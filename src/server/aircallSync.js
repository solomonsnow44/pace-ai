export const AIRCALL_API_BASE_URL = "https://api.aircall.io/v1";

function createBasicAuthHeader(apiId, apiToken) {
  return `Basic ${Buffer.from(`${apiId}:${apiToken}`).toString("base64")}`;
}

function requireCredential(value, label) {
  if (!String(value || "").trim()) {
    const error = new Error(`${label} is required`);
    error.statusCode = 500;
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function unixSecondsToIso(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function aircallTimestampToIso(value) {
  if (value === null || value === undefined || value === "") return null;
  if (Number.isFinite(Number(value))) return unixSecondsToIso(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateInputToUnixSeconds(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000);
}

function buildCallPath(input = {}) {
  const params = new URLSearchParams({ order: "desc" });
  const from = dateInputToUnixSeconds(input.dateRangeStart || input.from);
  const to = dateInputToUnixSeconds(input.dateRangeEnd || input.to);
  if (from) params.set("from", String(from));
  if (to) params.set("to", String(to));
  return `/calls?${params.toString()}`;
}

function normalizePhoneKey(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function buildAircallAppCallUrl(callId) {
  const normalizedCallId = String(callId || "").trim();
  return normalizedCallId ? `https://phone.aircall.io/calls/${normalizedCallId}` : null;
}

function addPhoneMatch(map, key, contact) {
  if (!key) return;
  if (map.has(key)) {
    map.set(key, null);
    return;
  }
  map.set(key, contact);
}

async function fetchAircallJson(path, { apiId, apiToken, fetcher }) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetcher(`${AIRCALL_API_BASE_URL}${path}`, {
      headers: {
        Authorization: createBasicAuthHeader(apiId, apiToken),
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 429 || attempt === 4) break;
    const retryAfter = Number(response.headers?.get?.("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * (attempt + 1));
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`Aircall request failed (${response.status})${text ? `: ${text}` : ""}`);
    error.statusCode = response.status || 502;
    throw error;
  }

  return response.json();
}

async function fetchOptionalAircallJson(path, options) {
  try {
    return await fetchAircallJson(path, options);
  } catch (error) {
    if ([400, 403, 404].includes(Number(error.statusCode))) {
      return null;
    }
    throw error;
  }
}

export async function createTemporaryAircallRecordingLink(input = {}, options = {}) {
  const callId = String(input.callId || input.aircallCallId || "").trim();
  const apiId = options.apiId ?? input.apiId;
  const apiToken = options.apiToken ?? input.apiToken;
  const fetcher = options.fetcher || fetch;

  requireCredential(callId, "Aircall call ID");
  requireCredential(apiId, "Aircall API ID");
  requireCredential(apiToken, "Aircall API token");

  const payload = await fetchAircallJson(`/calls/${encodeURIComponent(callId)}`, { apiId, apiToken, fetcher });
  const call = payload?.call || payload;
  const temporaryRecordingUrl = call?.recording || "";
  if (!temporaryRecordingUrl) {
    const error = new Error("Aircall has not provided a temporary recording URL for this call.");
    error.statusCode = 404;
    throw error;
  }

  return {
    callId,
    recordingUrl: temporaryRecordingUrl,
    stableRecordingUrl: call?.asset || "",
    expires: "Aircall temporary recording URLs expire shortly after they are generated.",
  };
}

async function fetchAircallPages(path, key, options) {
  const perPage = Math.min(Math.max(Number(options.perPage) || 50, 1), 100);
  const maxPages = Math.max(Number(options.maxPages) || 1, 1);
  const separator = path.includes("?") ? "&" : "?";
  const rows = [];
  let page = 1;

  while (page <= maxPages) {
    const payload = await fetchAircallJson(`${path}${separator}per_page=${perPage}&page=${page}`, options);
    const nextRows = Array.isArray(payload?.[key]) ? payload[key] : [];
    rows.push(...nextRows);
    if (!payload?.meta?.next_page_link || !nextRows.length) break;
    page += 1;
  }

  return rows;
}

function mapAircallUser(organizationId, user) {
  const [firstName, ...lastNameParts] = String(user.name || "").trim().split(/\s+/).filter(Boolean);
  return {
    organization_id: organizationId,
    aircall_user_id: String(user.id),
    email: user.email || null,
    name: user.name || null,
    first_name: firstName || null,
    last_name: lastNameParts.join(" ") || null,
    availability_status: user.availability_status || null,
    time_zone: user.time_zone || null,
    raw_payload: user,
    last_seen_at: new Date().toISOString(),
  };
}

function mapAircallCall(organizationId, call, userByAircallId, contactByPhoneKey) {
  const aircallUserId = call.user?.id ? String(call.user.id) : null;
  const linkedUser = aircallUserId ? userByAircallId.get(aircallUserId) : null;
  const matchedContact = contactByPhoneKey.get(normalizePhoneKey(call.raw_digits)) || null;

  return {
    organization_id: organizationId,
    client_id: matchedContact?.client_id || null,
    company_id: matchedContact?.company_id || null,
    contact_id: matchedContact?.id || null,
    user_id: linkedUser?.id || null,
    aircall_user_id: aircallUserId,
    aircall_call_id: Number(call.id),
    aircall_call_uuid: call.sid || null,
    aircall_contact_id: call.contact?.id ? String(call.contact.id) : null,
    aircall_number_id: call.number?.id ? String(call.number.id) : null,
    direct_link: buildAircallAppCallUrl(call.id),
    direction: ["inbound", "outbound"].includes(call.direction) ? call.direction : null,
    status: call.status || null,
    missed_call_reason: call.missed_call_reason || null,
    hangup_cause: call.hangup_cause || null,
    started_at: unixSecondsToIso(call.started_at),
    answered_at: unixSecondsToIso(call.answered_at),
    ended_at: unixSecondsToIso(call.ended_at),
    duration_seconds: Number.isFinite(Number(call.duration)) ? Number(call.duration) : null,
    cost: call.cost === null || call.cost === undefined || call.cost === "" ? null : Number(call.cost),
    raw_digits: call.raw_digits || null,
    external_phone_number: call.raw_digits || null,
    recording_url: call.asset || call.recording || null,
    recording_short_url: call.recording_short_url || null,
    voicemail_url: call.voicemail || null,
    voicemail_short_url: call.voicemail_short_url || null,
    asset_url: call.asset || null,
    participants: call.teams || [],
    tags: call.tags || [],
    comments: call.comments || [],
    raw_payload: call,
    last_aircall_event: call.status || null,
    last_synced_at: new Date().toISOString(),
  };
}

function buildFullTranscriptText(utterances) {
  return (Array.isArray(utterances) ? utterances : [])
    .map(item => String(item?.text || "").trim())
    .filter(Boolean)
    .join("\n");
}

function mapTranscript(organizationId, callRow, payload) {
  const transcription = payload?.transcription || payload;
  const content = transcription?.content || {};
  const utterances = Array.isArray(content.utterances) ? content.utterances : [];
  const fullText = buildFullTranscriptText(utterances);
  if (!fullText && !utterances.length) return null;
  return {
    organization_id: organizationId,
    call_id: callRow.id,
    aircall_call_id: callRow.aircall_call_id,
    language: content.language || transcription?.language || null,
    full_text: fullText || null,
    utterances,
    raw_payload: payload,
    generated_at: aircallTimestampToIso(transcription?.created_at || transcription?.call_created_at),
    last_synced_at: new Date().toISOString(),
  };
}

function mapSummary(organizationId, callRow, payload, customSummaryKey = "default") {
  const summary = customSummaryKey === "default" ? payload?.summary || payload : payload;
  const summaryText = summary?.content
    || (Array.isArray(summary?.summary_template_results)
      ? summary.summary_template_results
        .map(item => [item?.name, item?.content].filter(Boolean).join(": "))
        .filter(Boolean)
        .join("\n")
      : "");
  if (!summaryText) return null;
  return {
    organization_id: organizationId,
    call_id: callRow.id,
    aircall_call_id: callRow.aircall_call_id,
    summary: summaryText,
    custom_summary_key: customSummaryKey,
    raw_payload: payload,
    generated_at: aircallTimestampToIso(summary?.created_at),
    last_synced_at: new Date().toISOString(),
  };
}

function extractSentimentScore(sentiment) {
  const score = sentiment?.score ?? sentiment?.sentiment_score ?? sentiment?.overall_score ?? sentiment?.normalized_score;
  return Number.isFinite(Number(score)) ? Number(score) : null;
}

function sentimentValueToScore(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "POSITIVE") return 1;
  if (normalized === "NEGATIVE") return -1;
  if (normalized === "NEUTRAL") return 0;
  return null;
}

function normalizeSentimentValue(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(normalized)) return normalized;
  return "";
}

function mapSentiment(organizationId, callRow, payload) {
  const sentiment = payload?.sentiment || payload?.sentiments || payload;
  const participants = Array.isArray(sentiment?.participants) ? sentiment.participants : [];
  const segments = participants.length
    ? participants
    : Array.isArray(sentiment?.segments)
    ? sentiment.segments
    : Array.isArray(sentiment?.content)
      ? sentiment.content
      : [];
  const externalParticipant = participants.find(item => String(item?.type || "").toLowerCase() === "external");
  const primaryParticipant = externalParticipant || participants[0];
  const participantLabel = normalizeSentimentValue(primaryParticipant?.value);
  const label = participantLabel || sentiment?.label || sentiment?.sentiment || sentiment?.overall_sentiment || null;
  const score = participantLabel ? sentimentValueToScore(participantLabel) : extractSentimentScore(sentiment);
  if (!label && score === null && !segments.length) return null;
  return {
    organization_id: organizationId,
    call_id: callRow.id,
    aircall_call_id: callRow.aircall_call_id,
    sentiment_label: label,
    sentiment_score: score,
    segments,
    raw_payload: payload,
    generated_at: aircallTimestampToIso(sentiment?.created_at),
    last_synced_at: new Date().toISOString(),
  };
}

function mapTopics(organizationId, callRow, payload) {
  const topic = payload?.topic || payload?.topics || payload;
  const topics = Array.isArray(topic?.content) ? topic.content : Array.isArray(topic) ? topic : [];
  if (!topics.length) return null;
  return {
    organization_id: organizationId,
    call_id: callRow.id,
    aircall_call_id: callRow.aircall_call_id,
    topics,
    raw_payload: payload,
    generated_at: aircallTimestampToIso(topic?.created_at),
    last_synced_at: new Date().toISOString(),
  };
}

function mapActionItems(organizationId, callRow, payload, userByAircallId) {
  const actionItems = Array.isArray(payload?.action_items) ? payload.action_items : [];
  return actionItems
    .filter(item => String(item?.content || "").trim())
    .map((item, index) => {
      const assigneeAircallUserId = item.assignee_user_id || item.assignee_id || item.created_by || null;
      return {
        organization_id: organizationId,
        call_id: callRow.id,
        aircall_call_id: callRow.aircall_call_id,
        aircall_action_item_id: item.id ? String(item.id) : `${callRow.aircall_call_id}:${index}`,
        content: String(item.content).trim(),
        ai_generated: item.ai_generated === null || item.ai_generated === undefined ? null : Boolean(item.ai_generated),
        assignee_aircall_user_id: assigneeAircallUserId ? String(assigneeAircallUserId) : null,
        assignee_user_id: assigneeAircallUserId ? userByAircallId.get(String(assigneeAircallUserId))?.id || null : null,
        completed_at: aircallTimestampToIso(item.completed_at),
        due_at: aircallTimestampToIso(item.due_at),
        raw_payload: item,
      };
    });
}

function mapEvaluationRows(organizationId, callRow, payload, typePrefix = "evaluation") {
  const evaluations = Array.isArray(payload?.evaluations) ? payload.evaluations : [payload].filter(Boolean);
  return evaluations.map((evaluation, index) => {
    const score = evaluation?.score?.normalized_score ?? evaluation?.adherence_score ?? evaluation?.score;
    const evaluationName = evaluation?.scorecard?.name || evaluation?.playbook?.name || typePrefix;
    return {
      organization_id: organizationId,
      call_id: callRow.id,
      aircall_call_id: callRow.aircall_call_id,
      evaluation_type: `${typePrefix}:${evaluationName}:${index}`,
      score: Number.isFinite(Number(score)) ? Number(score) : null,
      result: evaluation,
      raw_payload: payload,
      generated_at: aircallTimestampToIso(evaluation?.created_at || payload?.created_at),
      last_synced_at: new Date().toISOString(),
    };
  });
}

async function loadUserMap(serviceClient, organizationId) {
  const { data, error } = await serviceClient
    .from("users")
    .select("id,email,aircall_user_id")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return new Map((data || [])
    .filter(user => String(user.aircall_user_id || "").trim())
    .map(user => [String(user.aircall_user_id), user]));
}

async function loadContactPhoneMap(serviceClient, organizationId) {
  const { data, error } = await serviceClient
    .from("contacts")
    .select("id,client_id,company_id,phone,mobile,direct_dial,manual_mobile,manual_direct_dial")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(10000);
  if (error) throw error;

  const contactsByPhoneKey = new Map();
  for (const contact of data || []) {
    for (const field of ["phone", "mobile", "direct_dial", "manual_mobile", "manual_direct_dial"]) {
      addPhoneMatch(contactsByPhoneKey, normalizePhoneKey(contact[field]), contact);
    }
  }
  return contactsByPhoneKey;
}

async function loadSyncedCallMap(serviceClient, organizationId, aircallCallIds) {
  if (!aircallCallIds.length) return new Map();
  const { data, error } = await serviceClient
    .from("aircall_calls")
    .select("id,aircall_call_id")
    .eq("organization_id", organizationId)
    .in("aircall_call_id", aircallCallIds);
  if (error) throw error;
  return new Map((data || []).map(row => [Number(row.aircall_call_id), row]));
}

async function upsertRows(serviceClient, table, rows, onConflict) {
  if (!rows.length) return 0;
  const { error } = await serviceClient
    .from(table)
    .upsert(rows, { onConflict });
  if (error) throw error;
  return rows.length;
}

async function syncCallIntelligence({ serviceClient, organizationId, aircallCalls, callByAircallId, userByAircallId, apiId, apiToken, fetcher, enabled }) {
  if (!enabled) {
    return {
      transcriptsSynced: 0,
      summariesSynced: 0,
      sentimentsSynced: 0,
      topicsSynced: 0,
      actionItemsSynced: 0,
      evaluationsSynced: 0,
      intelligenceSkipped: 0,
    };
  }

  const options = { apiId, apiToken, fetcher };
  const rows = {
    transcripts: [],
    summaries: [],
    sentiments: [],
    topics: [],
    actionItems: [],
    evaluations: [],
  };
  let intelligenceSkipped = 0;

  for (const call of aircallCalls) {
    const aircallCallId = Number(call.id);
    const callRow = callByAircallId.get(aircallCallId);
    if (!callRow?.id) {
      intelligenceSkipped += 1;
      continue;
    }

    const transcriptPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/transcription`, options);
    const summaryPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/summary`, options);
    const customSummaryPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/custom_summary_result`, options);
    const sentimentPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/sentiments`, options);
    const topicPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/topics`, options);
    const actionItemsPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/action_items`, options);
    const playbookPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/playbook_result`, options);
    const evaluationsPayload = await fetchOptionalAircallJson(`/calls/${aircallCallId}/evaluations`, options);

    const transcript = mapTranscript(organizationId, callRow, transcriptPayload);
    if (transcript) rows.transcripts.push(transcript);

    const summary = mapSummary(organizationId, callRow, summaryPayload);
    if (summary) rows.summaries.push(summary);

    const customSummaryKey = customSummaryPayload?.custom_summary?.name || "custom";
    const customSummary = mapSummary(organizationId, callRow, customSummaryPayload, customSummaryKey);
    if (customSummary) rows.summaries.push(customSummary);

    const sentiment = mapSentiment(organizationId, callRow, sentimentPayload);
    if (sentiment) rows.sentiments.push(sentiment);

    const topics = mapTopics(organizationId, callRow, topicPayload);
    if (topics) rows.topics.push(topics);

    rows.actionItems.push(...mapActionItems(organizationId, callRow, actionItemsPayload, userByAircallId));
    if (playbookPayload) rows.evaluations.push(...mapEvaluationRows(organizationId, callRow, playbookPayload, "playbook"));
    if (evaluationsPayload) rows.evaluations.push(...mapEvaluationRows(organizationId, callRow, evaluationsPayload, "evaluation"));
  }

  const [
    transcriptsSynced,
    summariesSynced,
    sentimentsSynced,
    topicsSynced,
    actionItemsSynced,
    evaluationsSynced,
  ] = await Promise.all([
    upsertRows(serviceClient, "aircall_call_transcripts", rows.transcripts, "organization_id,call_id"),
    upsertRows(serviceClient, "aircall_call_summaries", rows.summaries, "organization_id,call_id,custom_summary_key"),
    upsertRows(serviceClient, "aircall_call_sentiments", rows.sentiments, "organization_id,call_id"),
    upsertRows(serviceClient, "aircall_call_topics", rows.topics, "organization_id,call_id"),
    upsertRows(serviceClient, "aircall_call_action_items", rows.actionItems, "organization_id,call_id,aircall_action_item_id"),
    upsertRows(serviceClient, "aircall_call_evaluations", rows.evaluations, "organization_id,call_id,evaluation_type"),
  ]);

  return {
    transcriptsSynced,
    summariesSynced,
    sentimentsSynced,
    topicsSynced,
    actionItemsSynced,
    evaluationsSynced,
    intelligenceSkipped,
  };
}

export async function syncAircallData(input = {}, options = {}) {
  const organizationId = String(input.organizationId || "").trim();
  const apiId = input.apiId;
  const apiToken = input.apiToken;
  const serviceClient = options.serviceClient;
  const fetcher = options.fetcher || fetch;

  requireCredential(organizationId, "organizationId");
  requireCredential(apiId, "Aircall API ID");
  requireCredential(apiToken, "Aircall API token");
  if (!serviceClient) throw new Error("Supabase service client is required");

  const perPage = input.perPage || 100;
  const maxUserPages = input.maxUserPages || 10;
  const maxCallPages = input.maxCallPages || 5;
  const includeIntelligence = input.includeIntelligence !== false;
  const callPath = buildCallPath(input);

  const aircallUsers = await fetchAircallPages("/users?", "users", { apiId, apiToken, fetcher, perPage, maxPages: maxUserPages });
  const usersFromAircallCalls = new Map();
  const aircallCalls = await fetchAircallPages(callPath, "calls", { apiId, apiToken, fetcher, perPage, maxPages: maxCallPages });

  for (const call of aircallCalls) {
    if (call.user?.id) usersFromAircallCalls.set(String(call.user.id), call.user);
  }

  const userRowsById = new Map();
  for (const user of [...aircallUsers, ...usersFromAircallCalls.values()]) {
    if (user?.id) userRowsById.set(String(user.id), mapAircallUser(organizationId, user));
  }

  const syncedUsers = await upsertRows(serviceClient, "aircall_users", [...userRowsById.values()], "organization_id,aircall_user_id");
  const [userByAircallId, contactByPhoneKey] = await Promise.all([
    loadUserMap(serviceClient, organizationId),
    loadContactPhoneMap(serviceClient, organizationId),
  ]);
  const callRows = aircallCalls.map(call => mapAircallCall(organizationId, call, userByAircallId, contactByPhoneKey));
  const syncedCalls = await upsertRows(serviceClient, "aircall_calls", callRows, "organization_id,aircall_call_id");
  const callByAircallId = await loadSyncedCallMap(serviceClient, organizationId, callRows.map(row => row.aircall_call_id));
  const intelligenceResult = await syncCallIntelligence({
    serviceClient,
    organizationId,
    aircallCalls,
    callByAircallId,
    userByAircallId,
    apiId,
    apiToken,
    fetcher,
    enabled: includeIntelligence,
  });

  return {
    status: "synced",
    usersFetched: aircallUsers.length,
    usersSynced: syncedUsers,
    callsFetched: aircallCalls.length,
    callsSynced: syncedCalls,
    ...intelligenceResult,
  };
}
