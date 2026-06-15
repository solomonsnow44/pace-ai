-- Aircall call intelligence, contact timelines, and user mapping.
-- Stores the raw Aircall payloads while also extracting the fields needed for
-- CRM history, per-user call reporting, and contact detail filtering.

create extension if not exists pgcrypto;

alter table public.users
  add column if not exists aircall_user_id text;

create table if not exists public.aircall_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  aircall_user_id text not null,
  linked_user_id uuid references public.users(id) on delete set null,
  email text,
  name text,
  first_name text,
  last_name text,
  availability_status text,
  time_zone text,
  raw_payload jsonb not null default '{}'::jsonb,
  match_status text not null default 'unmatched' check (match_status in ('auto_matched', 'manual_matched', 'ambiguous', 'unmatched', 'ignored')),
  match_reason text,
  match_confidence numeric(5,2),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(aircall_user_id)) > 0),
  unique (organization_id, aircall_user_id)
);

create table if not exists public.aircall_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  aircall_user_id text,
  aircall_call_id bigint not null,
  aircall_call_uuid text,
  aircall_contact_id text,
  aircall_number_id text,
  direct_link text,
  direction text check (direction is null or direction in ('inbound', 'outbound')),
  status text,
  missed_call_reason text,
  hangup_cause text,
  started_at timestamptz,
  answered_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  cost numeric(12,4),
  raw_digits text,
  external_phone_number text,
  recording_url text,
  recording_short_url text,
  voicemail_url text,
  voicemail_short_url text,
  asset_url text,
  participants jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  source text not null default 'aircall',
  last_aircall_event text,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, aircall_call_id)
);

create table if not exists public.aircall_call_transcripts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  aircall_call_id bigint not null,
  language text,
  full_text text,
  utterances jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, call_id)
);

create table if not exists public.aircall_call_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  aircall_call_id bigint not null,
  summary text,
  custom_summary_key text not null default 'default',
  raw_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, call_id, custom_summary_key)
);

create table if not exists public.aircall_call_sentiments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  aircall_call_id bigint not null,
  sentiment_label text,
  sentiment_score numeric(6,3),
  segments jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, call_id)
);

create table if not exists public.aircall_call_topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  aircall_call_id bigint not null,
  topics jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, call_id)
);

create table if not exists public.aircall_call_action_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  aircall_call_id bigint not null,
  aircall_action_item_id text,
  content text not null,
  ai_generated boolean,
  assignee_aircall_user_id text,
  assignee_user_id uuid references public.users(id) on delete set null,
  completed_at timestamptz,
  due_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(content)) > 0),
  unique (organization_id, call_id, aircall_action_item_id)
);

create table if not exists public.aircall_call_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  aircall_call_id bigint not null,
  evaluation_type text,
  score numeric(8,3),
  result jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, call_id, evaluation_type)
);

create table if not exists public.aircall_call_user_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.aircall_calls(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  outcome text,
  private_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, call_id, user_id)
);

create index if not exists users_aircall_user_id_idx
  on public.users (aircall_user_id)
  where aircall_user_id is not null and trim(aircall_user_id) <> '';

create index if not exists aircall_users_org_link_idx on public.aircall_users (organization_id, linked_user_id);
create index if not exists aircall_users_org_email_idx on public.aircall_users (organization_id, lower(email))
  where email is not null and trim(email) <> '';
create index if not exists aircall_calls_contact_started_idx on public.aircall_calls (organization_id, contact_id, started_at desc);
create index if not exists aircall_calls_user_started_idx on public.aircall_calls (organization_id, user_id, started_at desc);
create index if not exists aircall_calls_company_started_idx on public.aircall_calls (organization_id, company_id, started_at desc);
create index if not exists aircall_calls_phone_idx on public.aircall_calls (organization_id, external_phone_number)
  where external_phone_number is not null and trim(external_phone_number) <> '';
create index if not exists aircall_calls_started_at_idx on public.aircall_calls (started_at desc);
create index if not exists aircall_call_user_notes_user_idx on public.aircall_call_user_notes (organization_id, user_id, updated_at desc);

create or replace function public.aircall_normalized_name(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(value, ''))), '[^a-z0-9]+', '', 'g')
$$;

create or replace function public.auto_link_aircall_user()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  matched_user_id uuid;
  matched_count integer;
  candidate_name text := public.aircall_normalized_name(coalesce(new.name, trim(concat_ws(' ', new.first_name, new.last_name))));
begin
  if new.linked_user_id is not null then
    update public.users
    set aircall_user_id = coalesce(nullif(trim(aircall_user_id), ''), new.aircall_user_id),
        updated_at = now()
    where id = new.linked_user_id
      and organization_id = new.organization_id;
    new.match_status := coalesce(nullif(new.match_status, 'unmatched'), 'manual_matched');
    return new;
  end if;

  if nullif(trim(coalesce(new.email, '')), '') is not null then
    select u.id, count(*) over ()
    into matched_user_id, matched_count
    from public.users u
    where u.organization_id = new.organization_id
      and lower(u.email) = lower(new.email)
    limit 1;

    if matched_count = 1 then
      new.linked_user_id := matched_user_id;
      new.match_status := 'auto_matched';
      new.match_reason := 'email';
      new.match_confidence := 1;
    end if;
  end if;

  if new.linked_user_id is null and candidate_name <> '' then
    select u.id, count(*) over ()
    into matched_user_id, matched_count
    from public.users u
    where u.organization_id = new.organization_id
      and public.aircall_normalized_name(coalesce(u.display_name, trim(concat_ws(' ', u.first_name, u.last_name)), split_part(u.email, '@', 1))) = candidate_name
    limit 1;

    if matched_count = 1 then
      new.linked_user_id := matched_user_id;
      new.match_status := 'auto_matched';
      new.match_reason := 'exact_name';
      new.match_confidence := 0.85;
    elsif matched_count > 1 then
      new.match_status := 'ambiguous';
      new.match_reason := 'multiple_name_matches';
      new.match_confidence := 0.5;
    end if;
  end if;

  if new.linked_user_id is not null then
    update public.users
    set aircall_user_id = coalesce(nullif(trim(aircall_user_id), ''), new.aircall_user_id),
        updated_at = now()
    where id = new.linked_user_id
      and organization_id = new.organization_id;
  end if;

  return new;
end $$;

drop trigger if exists auto_link_aircall_user on public.aircall_users;
create trigger auto_link_aircall_user
before insert or update of email, name, first_name, last_name, linked_user_id, aircall_user_id
on public.aircall_users
for each row execute function public.auto_link_aircall_user();

create or replace view public.aircall_contact_call_timeline
with (security_invoker = true) as
select
  c.id,
  c.organization_id,
  c.client_id,
  c.campaign_id,
  c.company_id,
  c.contact_id,
  c.user_id,
  u.display_name as user_name,
  u.email as user_email,
  c.aircall_call_id,
  c.aircall_call_uuid,
  c.direction,
  c.status,
  c.started_at,
  c.answered_at,
  c.ended_at,
  c.duration_seconds,
  c.external_phone_number,
  c.recording_url,
  c.recording_short_url,
  c.direct_link,
  s.summary,
  se.sentiment_label,
  se.sentiment_score,
  t.full_text as transcript_text,
  n.outcome as my_outcome,
  n.private_note as my_private_note,
  c.tags,
  c.comments
from public.aircall_calls c
left join public.users u on u.id = c.user_id
left join public.aircall_call_summaries s on s.call_id = c.id and s.custom_summary_key = 'default'
left join public.aircall_call_sentiments se on se.call_id = c.id
left join public.aircall_call_transcripts t on t.call_id = c.id
left join public.aircall_call_user_notes n on n.call_id = c.id and n.user_id = auth.uid();

create or replace view public.aircall_user_daily_stats
with (security_invoker = true) as
select
  organization_id,
  user_id,
  aircall_user_id,
  date_trunc('day', coalesce(started_at, created_at))::date as call_date,
  count(*) as calls_total,
  count(*) filter (where direction = 'outbound') as outbound_calls,
  count(*) filter (where direction = 'inbound') as inbound_calls,
  count(*) filter (where answered_at is not null) as answered_calls,
  count(*) filter (where recording_url is not null or recording_short_url is not null) as recorded_calls,
  sum(coalesce(duration_seconds, 0)) as duration_seconds_total,
  avg(nullif(duration_seconds, 0)) as average_duration_seconds
from public.aircall_calls
group by organization_id, user_id, aircall_user_id, date_trunc('day', coalesce(started_at, created_at))::date;

create or replace view public.aircall_user_match_candidates
with (security_invoker = true) as
select
  au.id as aircall_user_row_id,
  au.organization_id,
  au.aircall_user_id,
  au.email as aircall_email,
  au.name as aircall_name,
  au.linked_user_id,
  au.match_status,
  au.match_reason,
  u.id as paceops_user_id,
  u.email as paceops_email,
  u.display_name as paceops_name,
  case
    when au.linked_user_id = u.id then 1
    when au.email is not null and lower(au.email) = lower(u.email) then 0.98
    when public.aircall_normalized_name(au.name) <> '' and public.aircall_normalized_name(au.name) = public.aircall_normalized_name(u.display_name) then 0.85
    else 0
  end as match_score
from public.aircall_users au
join public.users u on u.organization_id = au.organization_id
where au.linked_user_id = u.id
   or (au.email is not null and lower(au.email) = lower(u.email))
   or (
    public.aircall_normalized_name(au.name) <> ''
    and public.aircall_normalized_name(au.name) = public.aircall_normalized_name(u.display_name)
   );

alter table public.aircall_users enable row level security;
alter table public.aircall_calls enable row level security;
alter table public.aircall_call_transcripts enable row level security;
alter table public.aircall_call_summaries enable row level security;
alter table public.aircall_call_sentiments enable row level security;
alter table public.aircall_call_topics enable row level security;
alter table public.aircall_call_action_items enable row level security;
alter table public.aircall_call_evaluations enable row level security;
alter table public.aircall_call_user_notes enable row level security;

alter table public.aircall_users force row level security;
alter table public.aircall_calls force row level security;
alter table public.aircall_call_transcripts force row level security;
alter table public.aircall_call_summaries force row level security;
alter table public.aircall_call_sentiments force row level security;
alter table public.aircall_call_topics force row level security;
alter table public.aircall_call_action_items force row level security;
alter table public.aircall_call_evaluations force row level security;
alter table public.aircall_call_user_notes force row level security;

create policy "aircall_users_members_all" on public.aircall_users
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_calls_members_all" on public.aircall_calls
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_transcripts_members_all" on public.aircall_call_transcripts
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_summaries_members_all" on public.aircall_call_summaries
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_sentiments_members_all" on public.aircall_call_sentiments
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_topics_members_all" on public.aircall_call_topics
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_action_items_members_all" on public.aircall_call_action_items
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_evaluations_members_all" on public.aircall_call_evaluations
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_user_notes_select_own" on public.aircall_call_user_notes
  for select using (public.is_org_member(organization_id) and user_id = auth.uid());
create policy "aircall_call_user_notes_insert_own" on public.aircall_call_user_notes
  for insert with check (public.is_org_member(organization_id) and user_id = auth.uid());
create policy "aircall_call_user_notes_update_own" on public.aircall_call_user_notes
  for update using (public.is_org_member(organization_id) and user_id = auth.uid())
  with check (public.is_org_member(organization_id) and user_id = auth.uid());
create policy "aircall_call_user_notes_delete_own" on public.aircall_call_user_notes
  for delete using (public.is_org_member(organization_id) and user_id = auth.uid());

drop trigger if exists set_aircall_users_updated_at on public.aircall_users;
create trigger set_aircall_users_updated_at before update on public.aircall_users
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_calls_updated_at on public.aircall_calls;
create trigger set_aircall_calls_updated_at before update on public.aircall_calls
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_transcripts_updated_at on public.aircall_call_transcripts;
create trigger set_aircall_call_transcripts_updated_at before update on public.aircall_call_transcripts
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_summaries_updated_at on public.aircall_call_summaries;
create trigger set_aircall_call_summaries_updated_at before update on public.aircall_call_summaries
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_sentiments_updated_at on public.aircall_call_sentiments;
create trigger set_aircall_call_sentiments_updated_at before update on public.aircall_call_sentiments
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_topics_updated_at on public.aircall_call_topics;
create trigger set_aircall_call_topics_updated_at before update on public.aircall_call_topics
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_action_items_updated_at on public.aircall_call_action_items;
create trigger set_aircall_call_action_items_updated_at before update on public.aircall_call_action_items
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_evaluations_updated_at on public.aircall_call_evaluations;
create trigger set_aircall_call_evaluations_updated_at before update on public.aircall_call_evaluations
for each row execute function public.set_updated_at();

drop trigger if exists set_aircall_call_user_notes_updated_at on public.aircall_call_user_notes;
create trigger set_aircall_call_user_notes_updated_at before update on public.aircall_call_user_notes
for each row execute function public.set_updated_at();

grant all on table public.aircall_users to anon, authenticated, service_role;
grant all on table public.aircall_calls to anon, authenticated, service_role;
grant all on table public.aircall_call_transcripts to anon, authenticated, service_role;
grant all on table public.aircall_call_summaries to anon, authenticated, service_role;
grant all on table public.aircall_call_sentiments to anon, authenticated, service_role;
grant all on table public.aircall_call_topics to anon, authenticated, service_role;
grant all on table public.aircall_call_action_items to anon, authenticated, service_role;
grant all on table public.aircall_call_evaluations to anon, authenticated, service_role;
grant all on table public.aircall_call_user_notes to anon, authenticated, service_role;
grant all on table public.aircall_contact_call_timeline to anon, authenticated, service_role;
grant all on table public.aircall_user_daily_stats to anon, authenticated, service_role;
grant all on table public.aircall_user_match_candidates to anon, authenticated, service_role;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'aircall_users',
    'aircall_calls',
    'aircall_call_transcripts',
    'aircall_call_summaries',
    'aircall_call_sentiments',
    'aircall_call_topics',
    'aircall_call_action_items',
    'aircall_call_evaluations',
    'aircall_call_user_notes'
  ]
  loop
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = tbl
      )
    then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
