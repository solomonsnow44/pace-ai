import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const AIRCALL_API_BASE_URL = "https://api.aircall.io/v1";
const PAGE_SIZE = 1000;
const UPSERT_BATCH_SIZE = 100;
const CHECK_CONCURRENCY = 4;
const CHECK_BATCH_DELAY_MS = 4000;
const REQUEST_TIMEOUT_MS = 15000;

for (const path of [".env", ".env.local"]) {
  if (!fs.existsSync(path)) continue;
  for (const line of fs.readFileSync(path, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const apiId = process.env.AIRCALL_API_ID;
const apiToken = process.env.AIRCALL_API_TOKEN;

if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase URL or service role key.");
if (!apiId || !apiToken) throw new Error("Missing Aircall API credentials.");

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function aircallTimestampToIso(value) {
  if (value === null || value === undefined || value === "") return null;
  if (Number.isFinite(Number(value))) return new Date(Number(value) * 1000).toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function authHeader() {
  return `Basic ${Buffer.from(`${apiId}:${apiToken}`).toString("base64")}`;
}

async function fetchAircallTranscription(callId) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      response = await fetch(`${AIRCALL_API_BASE_URL}/calls/${encodeURIComponent(callId)}/transcription`, {
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status !== 429 || attempt === 4) break;
    const retryAfter = Number(response.headers?.get?.("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * (attempt + 1));
  }

  if ([400, 403, 404].includes(response.status)) {
    return { skipped: true, status: response.status, payload: null };
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Aircall transcription request failed for ${callId} (${response.status})${body ? `: ${body}` : ""}`);
  }

  return { skipped: false, status: response.status, payload: await response.json() };
}

function transcriptTextFromUtterances(utterances) {
  return (Array.isArray(utterances) ? utterances : [])
    .map(item => String(item?.text || item?.content || item?.transcript || "").trim())
    .filter(Boolean)
    .join("\n");
}

function mapTranscript(organizationId, call, payload) {
  const transcription = payload?.transcription || payload;
  const content = transcription?.content || {};
  const utterances = Array.isArray(content.utterances) ? content.utterances : [];
  const fullText = transcriptTextFromUtterances(utterances);
  if (!fullText && !utterances.length) return null;

  return {
    organization_id: organizationId,
    call_id: call.id,
    aircall_call_id: call.aircall_call_id,
    language: content.language || transcription?.language || null,
    full_text: fullText || null,
    utterances,
    raw_payload: payload,
    generated_at: aircallTimestampToIso(transcription?.created_at || transcription?.call_created_at),
    last_synced_at: new Date().toISOString(),
  };
}

async function loadAllRows(table, select) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function upsertTranscriptRows(rows) {
  let count = 0;
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("aircall_call_transcripts")
      .upsert(batch, { onConflict: "organization_id,call_id" });
    if (error) throw error;
    count += batch.length;
  }
  return count;
}

const calls = await loadAllRows(
  "aircall_calls",
  "id,organization_id,aircall_call_id,aircall_call_uuid,started_at,recording_url,asset_url,voicemail_url"
);
const transcriptRows = await loadAllRows("aircall_call_transcripts", "call_id");
const existingTranscriptCallIds = new Set(transcriptRows.map(row => row.call_id).filter(Boolean));
const missingTranscriptCalls = calls
  .filter(call => call.aircall_call_id && !existingTranscriptCallIds.has(call.id) && (call.recording_url || call.asset_url || call.voicemail_url))
  .sort((a, b) => String(b.started_at || "").localeCompare(String(a.started_at || "")));
const missingWithoutRecording = calls
  .filter(call => call.aircall_call_id && !existingTranscriptCallIds.has(call.id) && !call.recording_url && !call.asset_url && !call.voicemail_url)
  .length;

const missingByStatus = {};
let checked = 0;
let empty = 0;
let errors = 0;
let upserted = 0;

async function checkCall(call) {
  try {
    const result = await fetchAircallTranscription(call.aircall_call_id);
    if (result.skipped) {
      return { status: result.status, transcript: null, empty: false, error: null };
    }

    const transcript = mapTranscript(call.organization_id, call, result.payload);
    return { status: 200, transcript, empty: !transcript, error: null };
  } catch (error) {
    return { status: "error", transcript: null, empty: false, error, call };
  }
}

for (let index = 0; index < missingTranscriptCalls.length; index += CHECK_CONCURRENCY) {
  if (index > 0) await sleep(CHECK_BATCH_DELAY_MS);
  const batch = missingTranscriptCalls.slice(index, index + CHECK_CONCURRENCY);
  const results = await Promise.all(batch.map(call => checkCall(call)));
  checked += batch.length;

  const rowsToUpsert = [];
  for (const result of results) {
    if (result.transcript) rowsToUpsert.push(result.transcript);
    if (result.empty) empty += 1;
    if ([400, 403, 404].includes(Number(result.status))) {
      missingByStatus[result.status] = (missingByStatus[result.status] || 0) + 1;
    }
    if (result.error) {
      errors += 1;
      console.warn(JSON.stringify({
        warning: "transcript_fetch_failed",
        aircallCallId: result.call?.aircall_call_id,
        message: result.error?.message || String(result.error),
      }));
    }
  }

  upserted += await upsertTranscriptRows(rowsToUpsert);

  if (checked % 120 < CHECK_CONCURRENCY || checked === missingTranscriptCalls.length) {
    console.log(JSON.stringify({
      progress: true,
      checked,
      total: missingTranscriptCalls.length,
      transcriptsUpserted: upserted,
      unavailableByStatus: missingByStatus,
      empty,
      errors,
    }));
  }
}

console.log(JSON.stringify({
  callsScanned: calls.length,
  existingTranscripts: existingTranscriptCallIds.size,
  missingTranscriptCalls: missingTranscriptCalls.length,
  missingWithoutRecording,
  checked,
  transcriptsUpserted: upserted,
  emptyTranscriptionResponses: empty,
  fetchErrors: errors,
  unavailableByStatus: missingByStatus,
}, null, 2));
