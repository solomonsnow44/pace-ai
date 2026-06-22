-- Lemlist CRM sync fields. Keep canonical PaceOps fields stable and store
-- Lemlist-specific identifiers/snapshots beside them for matching and import.

alter table public.contacts
  add column if not exists lemlist_contact_id text,
  add column if not exists lemlist_owner_id text,
  add column if not exists lemlist_status_id text,
  add column if not exists lemlist_unsubscribed boolean,
  add column if not exists linkedin_sales_nav_url text,
  add column if not exists profile_picture_url text,
  add column if not exists timezone text,
  add column if not exists summary text,
  add column if not exists tagline text,
  add column if not exists skills jsonb not null default '[]'::jsonb,
  add column if not exists lemlist_raw jsonb not null default '{}'::jsonb,
  add column if not exists last_lemlist_synced_at timestamptz;

alter table public.companies
  add column if not exists lemlist_company_id text,
  add column if not exists linkedin_url text,
  add column if not exists picture_url text,
  add column if not exists company_size text,
  add column if not exists founded_year integer check (founded_year is null or founded_year >= 0),
  add column if not exists location text,
  add column if not exists crm_sync_status text,
  add column if not exists lemlist_raw jsonb not null default '{}'::jsonb,
  add column if not exists last_lemlist_synced_at timestamptz;

alter table public.campaigns
  add column if not exists lemlist_campaign_id text,
  add column if not exists lemlist_status text,
  add column if not exists lemlist_created_at timestamptz,
  add column if not exists lemlist_raw jsonb not null default '{}'::jsonb,
  add column if not exists last_lemlist_synced_at timestamptz;

create table if not exists public.lemlist_campaign_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  lemlist_campaign_id text not null,
  lemlist_campaign_name text,
  lemlist_lead_id text not null,
  lemlist_contact_id text,
  lead_state text,
  is_paused boolean,
  email text,
  phone text,
  linkedin_url text,
  company_name text,
  raw jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(lemlist_campaign_id)) > 0),
  check (length(trim(lemlist_lead_id)) > 0)
);

create unique index if not exists contacts_org_lemlist_contact_id_key
  on public.contacts (organization_id, lemlist_contact_id)
  where lemlist_contact_id is not null and trim(lemlist_contact_id) <> '';

create index if not exists contacts_org_lemlist_owner_idx
  on public.contacts (organization_id, lemlist_owner_id)
  where lemlist_owner_id is not null and trim(lemlist_owner_id) <> '';

create unique index if not exists companies_org_lemlist_company_id_key
  on public.companies (organization_id, lemlist_company_id)
  where lemlist_company_id is not null and trim(lemlist_company_id) <> '';

create index if not exists companies_org_lemlist_linkedin_idx
  on public.companies (organization_id, lower(linkedin_url))
  where linkedin_url is not null and trim(linkedin_url) <> '';

create unique index if not exists campaigns_org_lemlist_campaign_id_key
  on public.campaigns (organization_id, lemlist_campaign_id)
  where lemlist_campaign_id is not null and trim(lemlist_campaign_id) <> '';

create unique index if not exists lemlist_campaign_leads_org_campaign_lead_key
  on public.lemlist_campaign_leads (organization_id, lemlist_campaign_id, lemlist_lead_id);

create index if not exists lemlist_campaign_leads_contact_idx
  on public.lemlist_campaign_leads (organization_id, lemlist_contact_id)
  where lemlist_contact_id is not null and trim(lemlist_contact_id) <> '';

create index if not exists lemlist_campaign_leads_company_id_idx
  on public.lemlist_campaign_leads (company_id)
  where company_id is not null;

create index if not exists lemlist_campaign_leads_contact_id_idx
  on public.lemlist_campaign_leads (contact_id)
  where contact_id is not null;

drop trigger if exists set_lemlist_campaign_leads_updated_at on public.lemlist_campaign_leads;
create trigger set_lemlist_campaign_leads_updated_at
before update on public.lemlist_campaign_leads
for each row execute function public.set_updated_at();

alter table public.lemlist_campaign_leads enable row level security;
alter table public.lemlist_campaign_leads force row level security;

drop policy if exists "lemlist_campaign_leads_members_all" on public.lemlist_campaign_leads;
create policy "lemlist_campaign_leads_members_all" on public.lemlist_campaign_leads
  for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant all on table public.lemlist_campaign_leads to anon;
grant all on table public.lemlist_campaign_leads to authenticated;
grant all on table public.lemlist_campaign_leads to service_role;
