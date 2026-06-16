create table if not exists public.intent_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  url text,
  source_type text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intent_sources_name_check check (length(trim(name)) > 0),
  constraint intent_sources_source_type_check check (
    source_type is null or source_type in ('news', 'vc_page', 'company_blog', 'press_release', 'rss', 'manual_url', 'api', 'other')
  )
);

create table if not exists public.intent_research_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  query text,
  date_range_start date,
  date_range_end date,
  event_types text[] not null default '{}'::text[],
  geography text,
  industry text,
  source_filter text[] not null default '{}'::text[],
  status text not null default 'pending',
  total_found int not null default 0,
  new_inserted int not null default 0,
  duplicates_skipped int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint intent_research_runs_status_check check (status in ('pending', 'running', 'completed', 'failed'))
);

create table if not exists public.intent_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_id uuid references public.intent_research_runs(id) on delete set null,
  company_name text not null,
  company_domain text,
  company_website text,
  company_linkedin_url text,
  event_type text,
  event_date date,
  title text,
  summary text,
  funding_amount text,
  funding_currency text,
  funding_round text,
  investors text[] not null default '{}'::text[],
  source_name text,
  source_url text,
  confidence_score numeric(5,2),
  company_fingerprint text,
  event_fingerprint text not null unique,
  raw_data jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  existing_company_id uuid references public.companies(id) on delete set null,
  promoted_company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intent_events_company_name_check check (length(trim(company_name)) > 0),
  constraint intent_events_event_type_check check (
    event_type is null or event_type in ('funding', 'hiring', 'expansion', 'leadership_change', 'acquisition', 'partnership', 'product_launch', 'other')
  ),
  constraint intent_events_status_check check (status in ('new', 'reviewed', 'rejected', 'promoted'))
);

create table if not exists public.intent_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  intent_event_id uuid not null references public.intent_events(id) on delete cascade,
  company_name text,
  company_domain text,
  name text,
  title text,
  linkedin_url text,
  email text,
  phone text,
  department text,
  seniority text,
  source text,
  raw_data jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  promoted_contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intent_people_status_check check (status in ('new', 'reviewed', 'rejected', 'promoted')),
  constraint intent_people_identity_check check (
    name is not null or email is not null or linkedin_url is not null or phone is not null
  )
);

create index if not exists intent_sources_org_enabled_idx
  on public.intent_sources (organization_id, enabled, source_type);

create index if not exists intent_research_runs_org_created_idx
  on public.intent_research_runs (organization_id, created_at desc);

create index if not exists intent_events_org_status_idx
  on public.intent_events (organization_id, status, created_at desc);

create index if not exists intent_events_org_event_type_idx
  on public.intent_events (organization_id, event_type, event_date desc);

create index if not exists intent_events_org_company_fingerprint_idx
  on public.intent_events (organization_id, company_fingerprint);

create index if not exists intent_events_org_source_url_idx
  on public.intent_events (organization_id, lower(source_url))
  where source_url is not null and trim(source_url) <> '';

create index if not exists intent_events_org_company_domain_idx
  on public.intent_events (organization_id, lower(company_domain))
  where company_domain is not null and trim(company_domain) <> '';

create index if not exists intent_people_org_event_idx
  on public.intent_people (organization_id, intent_event_id, updated_at desc);

create index if not exists intent_people_org_email_idx
  on public.intent_people (organization_id, lower(email))
  where email is not null and trim(email) <> '';

create index if not exists intent_people_org_linkedin_idx
  on public.intent_people (organization_id, lower(linkedin_url))
  where linkedin_url is not null and trim(linkedin_url) <> '';

alter table public.intent_sources enable row level security;
alter table public.intent_sources force row level security;
alter table public.intent_research_runs enable row level security;
alter table public.intent_research_runs force row level security;
alter table public.intent_events enable row level security;
alter table public.intent_events force row level security;
alter table public.intent_people enable row level security;
alter table public.intent_people force row level security;

drop policy if exists "intent_sources_org_members_all" on public.intent_sources;
create policy "intent_sources_org_members_all" on public.intent_sources
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "intent_research_runs_org_members_all" on public.intent_research_runs;
create policy "intent_research_runs_org_members_all" on public.intent_research_runs
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "intent_events_org_members_all" on public.intent_events;
create policy "intent_events_org_members_all" on public.intent_events
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "intent_people_org_members_all" on public.intent_people;
create policy "intent_people_org_members_all" on public.intent_people
for all using (public.is_org_member(organization_id))
with check (
  public.is_org_member(organization_id)
  and exists (
    select 1
    from public.intent_events event
    where event.id = intent_event_id
      and event.organization_id = intent_people.organization_id
  )
);

drop trigger if exists set_intent_sources_updated_at on public.intent_sources;
create trigger set_intent_sources_updated_at
before update on public.intent_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_intent_events_updated_at on public.intent_events;
create trigger set_intent_events_updated_at
before update on public.intent_events
for each row execute function public.set_updated_at();

drop trigger if exists set_intent_people_updated_at on public.intent_people;
create trigger set_intent_people_updated_at
before update on public.intent_people
for each row execute function public.set_updated_at();

grant select, insert, update, delete on table public.intent_sources to authenticated;
grant select, insert, update, delete on table public.intent_research_runs to authenticated;
grant select, insert, update, delete on table public.intent_events to authenticated;
grant select, insert, update, delete on table public.intent_people to authenticated;
grant all on table public.intent_sources to service_role;
grant all on table public.intent_research_runs to service_role;
grant all on table public.intent_events to service_role;
grant all on table public.intent_people to service_role;
