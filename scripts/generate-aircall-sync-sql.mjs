import { existsSync, readFileSync, writeFileSync } from "node:fs";

const AIRCALL_API_BASE_URL = "https://api.aircall.io/v1";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const contents = readFileSync(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function argValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function requireValue(value, label) {
  if (!String(value || "").trim()) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function sqlJson(value) {
  return `$aircall_json$${JSON.stringify(value).replaceAll("$aircall_json$", "$aircall_json_escaped$")}$aircall_json$::jsonb`;
}

async function fetchAircall(path, apiId, apiToken) {
  const response = await fetch(`${AIRCALL_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiId}:${apiToken}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Aircall request failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function fetchPages(path, key, { apiId, apiToken, perPage, maxPages }) {
  const rows = [];
  const separator = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchAircall(`${path}${separator}per_page=${perPage}&page=${page}`, apiId, apiToken);
    const nextRows = Array.isArray(payload?.[key]) ? payload[key] : [];
    rows.push(...nextRows);
    if (!payload?.meta?.next_page_link || !nextRows.length) break;
  }
  return rows;
}

function createSql({ organizationId, users, calls }) {
  return `
with raw_aircall_users as (
  select value as payload
  from jsonb_array_elements(${sqlJson(users)})
),
upserted_aircall_users as (
  insert into public.aircall_users (
    organization_id,
    aircall_user_id,
    email,
    name,
    first_name,
    last_name,
    availability_status,
    time_zone,
    raw_payload,
    last_seen_at
  )
  select
    '${organizationId}'::uuid,
    payload ->> 'id',
    nullif(payload ->> 'email', ''),
    nullif(payload ->> 'name', ''),
    nullif(split_part(coalesce(payload ->> 'name', ''), ' ', 1), ''),
    nullif(regexp_replace(coalesce(payload ->> 'name', ''), '^\\S+\\s*', ''), ''),
    nullif(payload ->> 'availability_status', ''),
    nullif(payload ->> 'time_zone', ''),
    payload,
    now()
  from raw_aircall_users
  where nullif(payload ->> 'id', '') is not null
  on conflict (organization_id, aircall_user_id) do update set
    email = excluded.email,
    name = excluded.name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    availability_status = excluded.availability_status,
    time_zone = excluded.time_zone,
    raw_payload = excluded.raw_payload,
    last_seen_at = excluded.last_seen_at,
    updated_at = now()
  returning aircall_user_id
),
raw_aircall_calls as (
  select value as payload
  from jsonb_array_elements(${sqlJson(calls)})
),
normalized_aircall_calls as (
  select
    payload,
    regexp_replace(coalesce(payload ->> 'raw_digits', ''), '\\D', '', 'g') as call_digits
  from raw_aircall_calls
),
matched_aircall_calls as (
  select
    c.payload,
    c.call_digits,
    crm_user.id as crm_user_id,
    crm_contact.id as crm_contact_id,
    crm_contact.client_id,
    crm_contact.company_id
  from normalized_aircall_calls c
  left join public.users crm_user
    on crm_user.organization_id = '${organizationId}'::uuid
   and crm_user.aircall_user_id = c.payload -> 'user' ->> 'id'
  left join lateral (
    select contact.id, contact.client_id, contact.company_id
    from public.contacts contact
    where contact.organization_id = '${organizationId}'::uuid
      and contact.status = 'active'
      and c.call_digits <> ''
      and right(c.call_digits, 10) in (
        right(regexp_replace(coalesce(contact.phone, ''), '\\D', '', 'g'), 10),
        right(regexp_replace(coalesce(contact.mobile, ''), '\\D', '', 'g'), 10),
        right(regexp_replace(coalesce(contact.direct_dial, ''), '\\D', '', 'g'), 10),
        right(regexp_replace(coalesce(contact.manual_mobile, ''), '\\D', '', 'g'), 10),
        right(regexp_replace(coalesce(contact.manual_direct_dial, ''), '\\D', '', 'g'), 10)
      )
    order by contact.updated_at desc nulls last
    limit 1
  ) crm_contact on true
)
insert into public.aircall_calls (
  organization_id,
  client_id,
  company_id,
  contact_id,
  user_id,
  aircall_user_id,
  aircall_call_id,
  aircall_call_uuid,
  aircall_contact_id,
  aircall_number_id,
  direct_link,
  direction,
  status,
  missed_call_reason,
  hangup_cause,
  started_at,
  answered_at,
  ended_at,
  duration_seconds,
  cost,
  raw_digits,
  external_phone_number,
  recording_url,
  recording_short_url,
  voicemail_url,
  voicemail_short_url,
  asset_url,
  participants,
  tags,
  comments,
  raw_payload,
  last_aircall_event,
  last_synced_at
)
select
  '${organizationId}'::uuid,
  client_id,
  company_id,
  crm_contact_id,
  crm_user_id,
  payload -> 'user' ->> 'id',
  (payload ->> 'id')::bigint,
  nullif(payload ->> 'sid', ''),
  payload -> 'contact' ->> 'id',
  payload -> 'number' ->> 'id',
  nullif(payload ->> 'direct_link', ''),
  case when payload ->> 'direction' in ('inbound', 'outbound') then payload ->> 'direction' else null end,
  nullif(payload ->> 'status', ''),
  nullif(payload ->> 'missed_call_reason', ''),
  nullif(payload ->> 'hangup_cause', ''),
  case when nullif(payload ->> 'started_at', '') is null then null else to_timestamp((payload ->> 'started_at')::double precision) end,
  case when nullif(payload ->> 'answered_at', '') is null then null else to_timestamp((payload ->> 'answered_at')::double precision) end,
  case when nullif(payload ->> 'ended_at', '') is null then null else to_timestamp((payload ->> 'ended_at')::double precision) end,
  nullif(payload ->> 'duration', '')::integer,
  nullif(payload ->> 'cost', '')::numeric,
  nullif(payload ->> 'raw_digits', ''),
  nullif(payload ->> 'raw_digits', ''),
  nullif(payload ->> 'recording', ''),
  nullif(payload ->> 'recording_short_url', ''),
  nullif(payload ->> 'voicemail', ''),
  nullif(payload ->> 'voicemail_short_url', ''),
  nullif(payload ->> 'asset', ''),
  coalesce(payload -> 'teams', '[]'::jsonb),
  coalesce(payload -> 'tags', '[]'::jsonb),
  coalesce(payload -> 'comments', '[]'::jsonb),
  payload,
  nullif(payload ->> 'status', ''),
  now()
from matched_aircall_calls
where nullif(payload ->> 'id', '') is not null
on conflict (organization_id, aircall_call_id) do update set
  client_id = excluded.client_id,
  company_id = excluded.company_id,
  contact_id = excluded.contact_id,
  user_id = excluded.user_id,
  aircall_user_id = excluded.aircall_user_id,
  aircall_call_uuid = excluded.aircall_call_uuid,
  aircall_contact_id = excluded.aircall_contact_id,
  aircall_number_id = excluded.aircall_number_id,
  direct_link = excluded.direct_link,
  direction = excluded.direction,
  status = excluded.status,
  missed_call_reason = excluded.missed_call_reason,
  hangup_cause = excluded.hangup_cause,
  started_at = excluded.started_at,
  answered_at = excluded.answered_at,
  ended_at = excluded.ended_at,
  duration_seconds = excluded.duration_seconds,
  cost = excluded.cost,
  raw_digits = excluded.raw_digits,
  external_phone_number = excluded.external_phone_number,
  recording_url = excluded.recording_url,
  recording_short_url = excluded.recording_short_url,
  voicemail_url = excluded.voicemail_url,
  voicemail_short_url = excluded.voicemail_short_url,
  asset_url = excluded.asset_url,
  participants = excluded.participants,
  tags = excluded.tags,
  comments = excluded.comments,
  raw_payload = excluded.raw_payload,
  last_aircall_event = excluded.last_aircall_event,
  last_synced_at = now(),
  updated_at = now();
`.trim();
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const organizationId = requireValue(argValue("organization-id"), "organization id");
const outputPath = requireValue(argValue("output"), "output path");
const apiId = requireValue(process.env.AIRCALL_API_ID, "AIRCALL_API_ID");
const apiToken = requireValue(process.env.AIRCALL_API_TOKEN, "AIRCALL_API_TOKEN");
const perPage = Number(argValue("per-page", "100"));
const maxCallPages = Number(argValue("max-call-pages", "1"));
const maxUserPages = Number(argValue("max-user-pages", "10"));

const [users, calls] = await Promise.all([
  fetchPages("/users?", "users", { apiId, apiToken, perPage, maxPages: maxUserPages }),
  fetchPages("/calls?order=desc", "calls", { apiId, apiToken, perPage, maxPages: maxCallPages }),
]);

const usersById = new Map(users.map(user => [String(user.id), user]));
for (const call of calls) {
  if (call.user?.id) usersById.set(String(call.user.id), call.user);
}

writeFileSync(outputPath, createSql({
  organizationId,
  users: [...usersById.values()],
  calls,
}));

console.log(`Wrote ${calls.length} Aircall calls and ${usersById.size} users to ${outputPath}`);
