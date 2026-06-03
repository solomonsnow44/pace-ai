-- Rebuild the CRM account/campaign model around one simple client scope.
-- This intentionally removes the workspace layer and the old composite scope keys.

create extension if not exists pgcrypto;

drop view if exists public.campaign_contacts cascade;
drop view if exists public.campaign_companies cascade;
drop view if exists public.client_accounts cascade;

create table if not exists public.legacy_crm_contacts as
select *, now() as archived_at
from public.contacts
where false;

insert into public.legacy_crm_contacts
select c.*, now() as archived_at
from public.contacts c
where to_regclass('public.contacts') is not null;

create table if not exists public.legacy_lead_contact_database as
select *, now() as archived_at
from public.lead_contact_database
where false;

insert into public.legacy_lead_contact_database
select lcd.*, now() as archived_at
from public.lead_contact_database lcd
where to_regclass('public.lead_contact_database') is not null;

drop table if exists public.campaign_lists cascade;
drop table if exists public.campaign_members cascade;
drop table if exists public.list_memberships cascade;
drop table if exists public.lists cascade;
drop table if exists public.custom_property_values cascade;
drop table if exists public.custom_properties cascade;
drop table if exists public.associations cascade;
drop table if exists public.field_mappings cascade;
drop table if exists public.import_jobs cascade;
drop table if exists public.enrichment_jobs cascade;
drop table if exists public.ai_jobs cascade;
drop table if exists public.suppression_entries cascade;
drop table if exists public.files cascade;
drop table if exists public.notes cascade;
drop table if exists public.tasks cascade;
drop table if exists public.activities cascade;
drop table if exists public.deals cascade;
drop table if exists public.pipeline_stages cascade;
drop table if exists public.pipelines cascade;
drop table if exists public.contacts cascade;
drop table if exists public.companies cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.client_members cascade;
drop table if exists public.clients cascade;
drop table if exists public.lead_contact_database cascade;

drop index if exists public.integration_connections_scope_idx;
drop policy if exists "integration_connections_select" on public.integration_connections;
drop policy if exists "integration_connections_write" on public.integration_connections;
drop policy if exists "audit_logs_select_admins" on public.audit_logs;
drop policy if exists "audit_logs_insert_members" on public.audit_logs;

alter table if exists public.integration_connections
  drop column if exists client_id,
  drop column if exists workspace_id;

alter table if exists public.audit_logs
  drop column if exists client_id,
  drop column if exists workspace_id;

drop index if exists public.audit_logs_scope_created_at_idx;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  owner_id uuid references public.users(id) on delete set null,
  website text,
  industry text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name)) > 0),
  check (length(trim(slug)) > 0),
  unique (organization_id, slug)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  slug text,
  domain text,
  website text,
  industry text,
  employee_count integer check (employee_count is null or employee_count >= 0),
  annual_revenue numeric(18,2) check (annual_revenue is null or annual_revenue >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name)) > 0)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  contact_name text,
  first_name text,
  last_name text,
  full_name text,
  company text,
  email text,
  phone text,
  mobile text,
  direct_dial text,
  job_title text,
  location text,
  linkedin_url text,
  linkedin_profile_url text,
  manual_email text,
  manual_mobile text,
  manual_direct_dial text,
  source_note text,
  data_source text not null default 'manual',
  confidence numeric(5,2),
  cognism_contact_id text,
  normalized_identity_key text,
  lookup_status text,
  lookup_notes text,
  hubspot_contact_id text,
  hubspot_exported_at timestamptz,
  hubspot_export_status text,
  hubspot_export_error text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  channel text not null default 'Outbound',
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name)) > 0),
  unique (client_id, name)
);

create table public.campaign_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'active', 'contacted', 'responded', 'qualified', 'disqualified', 'archived')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (company_id is not null or contact_id is not null)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  actor_id uuid references public.users(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(type)) > 0),
  check (length(trim(title)) > 0)
);

create unique index companies_org_name_key
  on public.companies (organization_id, lower(name));

create unique index contacts_identity_key
  on public.contacts (organization_id, normalized_identity_key)
  where normalized_identity_key is not null and trim(normalized_identity_key) <> '';

create unique index campaign_targets_campaign_company_key
  on public.campaign_targets (campaign_id, company_id)
  where company_id is not null;

create unique index campaign_targets_campaign_contact_key
  on public.campaign_targets (campaign_id, contact_id)
  where contact_id is not null;

create index clients_organization_id_idx on public.clients (organization_id);
create index companies_organization_client_idx on public.companies (organization_id, client_id);
create index contacts_organization_client_idx on public.contacts (organization_id, client_id);
create index contacts_company_id_idx on public.contacts (company_id);
create index contacts_cognism_contact_id_idx on public.contacts (organization_id, cognism_contact_id)
  where cognism_contact_id is not null and trim(cognism_contact_id) <> '';
create index contacts_linkedin_profile_url_idx on public.contacts (organization_id, lower(linkedin_profile_url))
  where linkedin_profile_url is not null and trim(linkedin_profile_url) <> '';
create index campaigns_organization_client_idx on public.campaigns (organization_id, client_id);
create index campaign_targets_campaign_id_idx on public.campaign_targets (campaign_id);
create index campaign_targets_company_id_idx on public.campaign_targets (company_id);
create index campaign_targets_contact_id_idx on public.campaign_targets (contact_id);
create index activities_organization_client_idx on public.activities (organization_id, client_id);
create index activities_occurred_at_idx on public.activities (occurred_at desc);
create index if not exists integration_connections_org_provider_idx
  on public.integration_connections (organization_id, provider, name);
create index if not exists audit_logs_org_created_at_idx
  on public.audit_logs (organization_id, created_at desc);

create or replace view public.client_accounts as
select * from public.clients;

create or replace view public.campaign_companies as
select
  ct.id,
  ct.organization_id,
  ct.client_id,
  ct.campaign_id,
  ct.company_id,
  ct.status,
  ct.metadata,
  ct.created_at,
  ct.updated_at
from public.campaign_targets ct
where ct.company_id is not null;

create or replace view public.campaign_contacts as
select
  ct.id,
  ct.organization_id,
  ct.client_id,
  ct.campaign_id,
  ct.contact_id,
  ct.company_id,
  ct.status,
  ct.metadata,
  ct.created_at,
  ct.updated_at
from public.campaign_targets ct
where ct.contact_id is not null;

create or replace function public.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and c.status = 'active'
      and public.is_org_member(c.organization_id)
  ) or public.is_platform_admin()
$$;

create or replace function public.can_manage_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and public.is_org_member(c.organization_id)
  ) or public.is_platform_admin()
$$;

create or replace function public.can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false
$$;

create or replace function public.can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false
$$;

create or replace function public.can_access_scoped_record(target_organization_id uuid, target_client_id uuid, target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_client_id is not null then public.can_access_client(target_client_id)
    else public.is_org_member(target_organization_id)
  end
$$;

create or replace function public.can_edit_scoped_record(target_organization_id uuid, target_client_id uuid, target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_client_id is not null then public.can_manage_client(target_client_id)
    else public.is_org_member(target_organization_id)
  end
$$;

alter table public.clients enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_targets enable row level security;
alter table public.activities enable row level security;

alter table public.clients force row level security;
alter table public.companies force row level security;
alter table public.contacts force row level security;
alter table public.campaigns force row level security;
alter table public.campaign_targets force row level security;
alter table public.activities force row level security;

create policy "clients_members_all" on public.clients
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "companies_members_all" on public.companies
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "contacts_members_all" on public.contacts
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "campaigns_members_all" on public.campaigns
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "campaign_targets_members_all" on public.campaign_targets
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "activities_members_all" on public.activities
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "integration_connections_select" on public.integration_connections
  for select using (public.is_org_member(organization_id));

create policy "integration_connections_write" on public.integration_connections
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "audit_logs_select_admins" on public.audit_logs
  for select using (public.is_org_admin(organization_id));

create policy "audit_logs_insert_members" on public.audit_logs
  for insert with check (public.is_org_member(organization_id));

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_campaign_targets_updated_at on public.campaign_targets;
create trigger set_campaign_targets_updated_at
before update on public.campaign_targets
for each row execute function public.set_updated_at();

drop trigger if exists set_activities_updated_at on public.activities;
create trigger set_activities_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

grant all on table public.clients to anon, authenticated, service_role;
grant all on table public.companies to anon, authenticated, service_role;
grant all on table public.contacts to anon, authenticated, service_role;
grant all on table public.campaigns to anon, authenticated, service_role;
grant all on table public.campaign_targets to anon, authenticated, service_role;
grant all on table public.activities to anon, authenticated, service_role;
grant all on table public.client_accounts to anon, authenticated, service_role;
grant all on table public.campaign_companies to anon, authenticated, service_role;
grant all on table public.campaign_contacts to anon, authenticated, service_role;

update public.organizations
set metadata =
  coalesce(metadata, '{}'::jsonb)
  - 'crm_data'
  - 'crm_data_updated_at'
  - 'crm_data_schema'
  || jsonb_build_object(
    'crm_data_schema', 'simple_client_campaigns_v1',
    'crm_data_updated_at', now(),
    'crm_data', jsonb_build_object(
      'clientAccounts', '[]'::jsonb,
      'campaigns', '[]'::jsonb,
      'companies', '[]'::jsonb,
      'contacts', '[]'::jsonb,
      'activities', '[]'::jsonb,
      'deals', '[]'::jsonb,
      'files', '[]'::jsonb,
      'scriptItems', '[]'::jsonb,
      'teamMembers', '[]'::jsonb,
      'callInsights', '[]'::jsonb,
      'integrations', '[]'::jsonb,
      'researchItems', '[]'::jsonb,
      'weeklyReports', '[]'::jsonb,
      'pipelineStages', '[]'::jsonb
    )
  )
where metadata ? 'crm_data';

do $$
declare
  tbl text;
begin
  foreach tbl in array array['clients','companies','contacts','campaigns','campaign_targets','activities']
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
