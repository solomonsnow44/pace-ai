-- PaceOps CRM initial clean schema
-- Hierarchy:
-- organization -> users/teams -> clients -> workspaces -> companies -> contacts -> deals -> activities

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.organization_status as enum ('active', 'trialing', 'past_due', 'suspended', 'cancelled');
create type public.user_role as enum ('platform_admin', 'org_owner', 'org_admin', 'manager', 'member', 'viewer');
create type public.member_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
create type public.workspace_role as enum ('admin', 'editor', 'viewer');
create type public.record_status as enum ('active', 'archived');
create type public.company_type as enum ('prospect', 'customer', 'partner', 'vendor', 'competitor', 'other');
create type public.contact_status as enum ('active', 'inactive', 'do_not_contact', 'bounced', 'unsubscribed', 'archived');
create type public.deal_status as enum ('open', 'won', 'lost', 'archived');
create type public.activity_type as enum ('call', 'email', 'meeting', 'note', 'task', 'linkedin', 'sms', 'import', 'enrichment', 'ai', 'sync', 'other');
create type public.activity_direction as enum ('inbound', 'outbound', 'internal');
create type public.task_status as enum ('todo', 'in_progress', 'done', 'cancelled');
create type public.campaign_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
create type public.job_status as enum ('queued', 'running', 'requires_review', 'completed', 'failed', 'cancelled');
create type public.integration_provider as enum ('hubspot', 'cognism', 'aircall', 'openai', 'csv', 'other');
create type public.association_object_type as enum ('company', 'contact', 'deal', 'activity', 'task', 'note', 'file', 'list', 'campaign');
create type public.custom_property_object_type as enum ('company', 'contact', 'deal', 'activity', 'task', 'client', 'workspace');
create type public.suppression_scope as enum ('organization', 'client', 'workspace');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'trialing',
  plan_key text not null default 'starter',
  billing_email text,
  subscription_provider text,
  subscription_customer_id text,
  subscription_id text,
  seat_limit integer not null default 5 check (seat_limit >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  full_name text,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'member',
  status public.record_status not null default 'active',
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status public.record_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  status public.record_status not null default 'active',
  owner_id uuid references public.users(id) on delete set null,
  industry text,
  website text,
  billing_email text,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.client_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  slug text not null,
  status public.record_status not null default 'active',
  owner_id uuid references public.users(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, slug)
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  status public.record_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  stage_order integer not null,
  probability integer not null default 0 check (probability between 0 and 100),
  is_closed boolean not null default false,
  is_won boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, stage_order),
  unique (pipeline_id, name)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid references public.users(id) on delete set null,
  name text not null,
  domain text,
  website text,
  company_type public.company_type not null default 'prospect',
  status public.record_status not null default 'active',
  industry text,
  employee_count integer check (employee_count >= 0),
  annual_revenue numeric(18,2) check (annual_revenue >= 0),
  city text,
  region text,
  country text,
  linkedin_url text,
  phone text,
  source text,
  external_ids jsonb not null default '{}'::jsonb,
  enrichment jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, domain)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  first_name text,
  last_name text,
  full_name text generated always as (nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')) stored,
  email text,
  phone text,
  mobile text,
  job_title text,
  seniority text,
  department text,
  linkedin_url text,
  status public.contact_status not null default 'active',
  source text,
  data_source text,
  privacy_notice_status text,
  privacy_notice_sent_at timestamptz,
  last_contacted_at timestamptz,
  external_ids jsonb not null default '{}'::jsonb,
  enrichment jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary_contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null,
  name text not null,
  amount numeric(18,2) check (amount >= 0),
  currency char(3) not null default 'GBP',
  status public.deal_status not null default 'open',
  close_date date,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  source text,
  external_ids jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  campaign_id uuid,
  user_id uuid references public.users(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  type public.activity_type not null,
  direction public.activity_direction,
  subject text,
  body text,
  outcome text,
  occurred_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds >= 0),
  external_ids jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  activity_id uuid references public.activities(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority text not null default 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  activity_id uuid references public.activities(id) on delete set null,
  author_id uuid references public.users(id) on delete set null,
  title text,
  body text not null,
  is_pinned boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  uploaded_by uuid references public.users(id) on delete set null,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  checksum text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  object_type public.association_object_type not null default 'contact',
  is_dynamic boolean not null default false,
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.list_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  list_id uuid not null references public.lists(id) on delete cascade,
  object_type public.association_object_type not null,
  object_id uuid not null,
  added_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, object_type, object_id)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid references public.users(id) on delete set null,
  name text not null,
  description text,
  status public.campaign_status not null default 'draft',
  channel text,
  starts_at timestamptz,
  ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

alter table public.activities
  add constraint activities_campaign_id_fkey foreign key (campaign_id) references public.campaigns(id) on delete set null;

create table public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  status text not null default 'queued',
  last_activity_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (company_id is not null or contact_id is not null),
  unique (campaign_id, contact_id),
  unique (campaign_id, company_id)
);

create table public.associations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_type public.association_object_type not null,
  from_id uuid not null,
  to_type public.association_object_type not null,
  to_id uuid not null,
  label text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_type <> to_type or from_id <> to_id),
  unique (workspace_id, from_type, from_id, to_type, to_id, label)
);

create table public.custom_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  object_type public.custom_property_object_type not null,
  name text not null,
  label text not null,
  data_type text not null,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, workspace_id, object_type, name)
);

create table public.custom_property_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  property_id uuid not null references public.custom_properties(id) on delete cascade,
  object_type public.custom_property_object_type not null,
  object_id uuid not null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, object_id)
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  provider public.integration_provider not null,
  name text not null,
  status public.record_status not null default 'active',
  external_account_id text,
  scopes text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  connected_by uuid references public.users(id) on delete set null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, workspace_id, provider, name)
);

create table public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  encrypted_secret text not null,
  secret_hint text,
  expires_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  provider public.integration_provider not null,
  object_type public.association_object_type not null,
  name text not null,
  mapping jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  provider public.integration_provider not null default 'csv',
  connection_id uuid references public.integration_connections(id) on delete set null,
  file_id uuid references public.files(id) on delete set null,
  status public.job_status not null default 'queued',
  dry_run boolean not null default true,
  object_type public.association_object_type,
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  succeeded_rows integer not null default 0,
  failed_rows integer not null default 0,
  mapping jsonb not null default '{}'::jsonb,
  preview jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  provider public.integration_provider not null default 'cognism',
  connection_id uuid references public.integration_connections(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  status public.job_status not null default 'queued',
  query jsonb not null default '{}'::jsonb,
  preview_results jsonb not null default '[]'::jsonb,
  selected_results jsonb not null default '[]'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) check (confidence is null or confidence between 0 and 100),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  job_type text not null,
  provider text not null default 'openai',
  model text,
  status public.job_status not null default 'queued',
  prompt text,
  system_prompt text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  token_usage jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) check (confidence is null or confidence between 0 and 100),
  warnings jsonb not null default '[]'::jsonb,
  error_message text,
  source_references jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  object_type text,
  object_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.suppression_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  scope public.suppression_scope not null default 'organization',
  email text,
  domain text,
  phone text,
  reason text not null,
  source text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or domain is not null or phone is not null)
);

alter table public.users add constraint users_id_organization_id_key unique (id, organization_id);
alter table public.teams add constraint teams_id_organization_id_key unique (id, organization_id);
alter table public.clients add constraint clients_id_organization_id_key unique (id, organization_id);
alter table public.workspaces add constraint workspaces_id_scope_key unique (id, organization_id, client_id);
alter table public.pipelines add constraint pipelines_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.pipeline_stages add constraint pipeline_stages_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.companies add constraint companies_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.contacts add constraint contacts_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.deals add constraint deals_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.activities add constraint activities_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.files add constraint files_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.lists add constraint lists_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.campaigns add constraint campaigns_id_scope_key unique (id, organization_id, client_id, workspace_id);
alter table public.integration_connections add constraint integration_connections_id_organization_id_key unique (id, organization_id);

alter table public.team_members
  add constraint team_members_team_scope_fkey foreign key (team_id, organization_id) references public.teams(id, organization_id) on delete cascade,
  add constraint team_members_user_scope_fkey foreign key (user_id, organization_id) references public.users(id, organization_id) on delete cascade;

alter table public.client_members
  add constraint client_members_client_scope_fkey foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete cascade,
  add constraint client_members_user_scope_fkey foreign key (user_id, organization_id) references public.users(id, organization_id) on delete cascade;

alter table public.workspace_members
  add constraint workspace_members_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint workspace_members_user_scope_fkey foreign key (user_id, organization_id) references public.users(id, organization_id) on delete cascade;

alter table public.pipelines
  add constraint pipelines_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade;

alter table public.pipeline_stages
  add constraint pipeline_stages_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint pipeline_stages_pipeline_scope_fkey foreign key (pipeline_id, organization_id, client_id, workspace_id) references public.pipelines(id, organization_id, client_id, workspace_id) on delete cascade;

alter table public.companies
  add constraint companies_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade;

alter table public.contacts
  add constraint contacts_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint contacts_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id);

alter table public.deals
  add constraint deals_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint deals_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint deals_primary_contact_scope_fkey foreign key (primary_contact_id, organization_id, client_id, workspace_id) references public.contacts(id, organization_id, client_id, workspace_id),
  add constraint deals_pipeline_scope_fkey foreign key (pipeline_id, organization_id, client_id, workspace_id) references public.pipelines(id, organization_id, client_id, workspace_id),
  add constraint deals_pipeline_stage_scope_fkey foreign key (pipeline_stage_id, organization_id, client_id, workspace_id) references public.pipeline_stages(id, organization_id, client_id, workspace_id);

alter table public.activities
  add constraint activities_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint activities_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint activities_contact_scope_fkey foreign key (contact_id, organization_id, client_id, workspace_id) references public.contacts(id, organization_id, client_id, workspace_id),
  add constraint activities_deal_scope_fkey foreign key (deal_id, organization_id, client_id, workspace_id) references public.deals(id, organization_id, client_id, workspace_id),
  add constraint activities_campaign_scope_fkey foreign key (campaign_id, organization_id, client_id, workspace_id) references public.campaigns(id, organization_id, client_id, workspace_id);

alter table public.tasks
  add constraint tasks_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint tasks_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint tasks_contact_scope_fkey foreign key (contact_id, organization_id, client_id, workspace_id) references public.contacts(id, organization_id, client_id, workspace_id),
  add constraint tasks_deal_scope_fkey foreign key (deal_id, organization_id, client_id, workspace_id) references public.deals(id, organization_id, client_id, workspace_id),
  add constraint tasks_activity_scope_fkey foreign key (activity_id, organization_id, client_id, workspace_id) references public.activities(id, organization_id, client_id, workspace_id);

alter table public.notes
  add constraint notes_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint notes_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint notes_contact_scope_fkey foreign key (contact_id, organization_id, client_id, workspace_id) references public.contacts(id, organization_id, client_id, workspace_id),
  add constraint notes_deal_scope_fkey foreign key (deal_id, organization_id, client_id, workspace_id) references public.deals(id, organization_id, client_id, workspace_id),
  add constraint notes_activity_scope_fkey foreign key (activity_id, organization_id, client_id, workspace_id) references public.activities(id, organization_id, client_id, workspace_id);

alter table public.files
  add constraint files_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint files_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint files_contact_scope_fkey foreign key (contact_id, organization_id, client_id, workspace_id) references public.contacts(id, organization_id, client_id, workspace_id),
  add constraint files_deal_scope_fkey foreign key (deal_id, organization_id, client_id, workspace_id) references public.deals(id, organization_id, client_id, workspace_id);

alter table public.lists
  add constraint lists_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade;

alter table public.list_memberships
  add constraint list_memberships_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint list_memberships_list_scope_fkey foreign key (list_id, organization_id, client_id, workspace_id) references public.lists(id, organization_id, client_id, workspace_id) on delete cascade;

alter table public.campaigns
  add constraint campaigns_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade;

alter table public.campaign_members
  add constraint campaign_members_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade,
  add constraint campaign_members_campaign_scope_fkey foreign key (campaign_id, organization_id, client_id, workspace_id) references public.campaigns(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint campaign_members_company_scope_fkey foreign key (company_id, organization_id, client_id, workspace_id) references public.companies(id, organization_id, client_id, workspace_id) on delete cascade,
  add constraint campaign_members_contact_scope_fkey foreign key (contact_id, organization_id, client_id, workspace_id) references public.contacts(id, organization_id, client_id, workspace_id) on delete cascade;

alter table public.associations
  add constraint associations_workspace_scope_fkey foreign key (workspace_id, organization_id, client_id) references public.workspaces(id, organization_id, client_id) on delete cascade;

alter table public.integration_credentials
  add constraint integration_credentials_connection_scope_fkey foreign key (connection_id, organization_id) references public.integration_connections(id, organization_id) on delete cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role from public.users u where u.id = auth.uid() and u.status = 'active' limit 1
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'platform_admin', false)
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = target_organization_id
      and u.status = 'active'
  ) or public.is_platform_admin()
$$;

create or replace function public.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = target_organization_id
      and u.status = 'active'
      and u.role in ('org_owner', 'org_admin')
  ) or public.is_platform_admin()
$$;

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
    left join public.client_members cm on cm.client_id = c.id and cm.user_id = auth.uid()
    where c.id = target_client_id
      and c.status = 'active'
      and (public.is_org_admin(c.organization_id) or cm.id is not null)
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
    left join public.client_members cm on cm.client_id = c.id and cm.user_id = auth.uid()
    where c.id = target_client_id
      and (public.is_org_admin(c.organization_id) or cm.role in ('owner', 'admin', 'manager'))
  ) or public.is_platform_admin()
$$;

create or replace function public.can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id and wm.user_id = auth.uid()
    where w.id = target_workspace_id
      and w.status = 'active'
      and (public.can_access_client(w.client_id) or wm.id is not null)
  ) or public.is_platform_admin()
$$;

create or replace function public.can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id and wm.user_id = auth.uid()
    where w.id = target_workspace_id
      and (public.can_manage_client(w.client_id) or wm.role in ('admin', 'editor'))
  ) or public.is_platform_admin()
$$;

create or replace function public.can_access_scoped_record(target_organization_id uuid, target_client_id uuid, target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_workspace_id is not null then public.can_access_workspace(target_workspace_id)
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
    when target_workspace_id is not null then public.can_edit_workspace(target_workspace_id)
    when target_client_id is not null then public.can_manage_client(target_client_id)
    else public.is_org_admin(target_organization_id)
  end
$$;

create or replace function public.can_create_initial_org_user(target_organization_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_user_id
    and not exists (
      select 1
      from public.users u
      where u.organization_id = target_organization_id
    )
$$;

create or replace function public.bootstrap_current_user(user_email text, user_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_organization_id uuid;
  new_organization_id uuid;
  base_slug text;
  final_slug text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.organization_id
  into existing_organization_id
  from public.users u
  where u.id = current_user_id
  limit 1;

  if existing_organization_id is not null then
    return existing_organization_id;
  end if;

  base_slug := lower(regexp_replace(coalesce(split_part(user_email, '@', 2), 'workspace'), '[^[:alnum:]]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'workspace';
  end if;
  final_slug := base_slug || '-' || left(current_user_id::text, 8);

  insert into public.organizations (
    name,
    slug,
    status,
    plan_key,
    seat_limit,
    billing_email
  )
  values (
    initcap(replace(base_slug, '-', ' ')),
    final_slug,
    'trialing',
    'starter',
    5,
    user_email
  )
  returning id into new_organization_id;

  insert into public.users (
    id,
    organization_id,
    email,
    display_name,
    role
  )
  values (
    current_user_id,
    new_organization_id,
    user_email,
    coalesce(nullif(user_display_name, ''), split_part(user_email, '@', 1), 'Workspace user'),
    'org_owner'
  );

  return new_organization_id;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations','users','teams','team_members','clients','client_members','workspaces','workspace_members',
    'pipelines','pipeline_stages','companies','contacts','deals','activities','tasks','notes','files',
    'lists','list_memberships','campaigns','campaign_members','associations','custom_properties',
    'custom_property_values','integration_connections','integration_credentials','field_mappings',
    'import_jobs','enrichment_jobs','ai_jobs','audit_logs','suppression_entries'
  ]
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('alter table public.%I force row level security', tbl);
  end loop;
end $$;

create policy "organizations_select_members" on public.organizations
  for select using (public.is_org_member(id));
create policy "organizations_insert_authenticated" on public.organizations
  for insert with check (auth.uid() is not null);
create policy "organizations_update_admins" on public.organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "users_select_org_members" on public.users
  for select using (public.is_org_member(organization_id));
create policy "users_insert_admins" on public.users
  for insert with check (
    public.is_org_admin(organization_id)
    or public.can_create_initial_org_user(organization_id, id)
  );
create policy "users_update_self_or_admins" on public.users
  for update using (id = auth.uid() or public.is_org_admin(organization_id))
  with check (id = auth.uid() or public.is_org_admin(organization_id));

create policy "teams_select_org_members" on public.teams
  for select using (public.is_org_member(organization_id));
create policy "teams_write_org_admins" on public.teams
  for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy "team_members_select_org_members" on public.team_members
  for select using (public.is_org_member(organization_id));
create policy "team_members_write_org_admins" on public.team_members
  for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy "clients_select_members" on public.clients
  for select using (public.can_access_client(id));
create policy "clients_insert_org_admins" on public.clients
  for insert with check (public.is_org_admin(organization_id));
create policy "clients_update_managers" on public.clients
  for update using (public.can_manage_client(id)) with check (public.can_manage_client(id));
create policy "clients_delete_org_admins" on public.clients
  for delete using (public.is_org_admin(organization_id));

create policy "client_members_select_client_members" on public.client_members
  for select using (public.can_access_client(client_id));
create policy "client_members_write_client_managers" on public.client_members
  for all using (public.can_manage_client(client_id)) with check (public.can_manage_client(client_id));

create policy "workspaces_select_members" on public.workspaces
  for select using (public.can_access_workspace(id));
create policy "workspaces_insert_client_managers" on public.workspaces
  for insert with check (public.can_manage_client(client_id));
create policy "workspaces_update_editors" on public.workspaces
  for update using (public.can_edit_workspace(id)) with check (public.can_edit_workspace(id));
create policy "workspaces_delete_client_managers" on public.workspaces
  for delete using (public.can_manage_client(client_id));

create policy "workspace_members_select_workspace_members" on public.workspace_members
  for select using (public.can_access_workspace(workspace_id));
create policy "workspace_members_write_workspace_admins" on public.workspace_members
  for all using (public.can_manage_client(client_id)) with check (public.can_manage_client(client_id));

create policy "workspace_records_select" on public.pipelines
  for select using (public.can_access_workspace(workspace_id));
create policy "workspace_records_write" on public.pipelines
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "pipeline_stages_select" on public.pipeline_stages
  for select using (public.can_access_workspace(workspace_id));
create policy "pipeline_stages_write" on public.pipeline_stages
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "companies_select" on public.companies
  for select using (public.can_access_workspace(workspace_id));
create policy "companies_write" on public.companies
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "contacts_select" on public.contacts
  for select using (public.can_access_workspace(workspace_id));
create policy "contacts_write" on public.contacts
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "deals_select" on public.deals
  for select using (public.can_access_workspace(workspace_id));
create policy "deals_write" on public.deals
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "activities_select" on public.activities
  for select using (public.can_access_workspace(workspace_id));
create policy "activities_write" on public.activities
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "tasks_select" on public.tasks
  for select using (public.can_access_workspace(workspace_id));
create policy "tasks_write" on public.tasks
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "notes_select" on public.notes
  for select using (public.can_access_workspace(workspace_id));
create policy "notes_write" on public.notes
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "files_select" on public.files
  for select using (public.can_access_workspace(workspace_id));
create policy "files_write" on public.files
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "lists_select" on public.lists
  for select using (public.can_access_workspace(workspace_id));
create policy "lists_write" on public.lists
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "list_memberships_select" on public.list_memberships
  for select using (public.can_access_workspace(workspace_id));
create policy "list_memberships_write" on public.list_memberships
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "campaigns_select" on public.campaigns
  for select using (public.can_access_workspace(workspace_id));
create policy "campaigns_write" on public.campaigns
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "campaign_members_select" on public.campaign_members
  for select using (public.can_access_workspace(workspace_id));
create policy "campaign_members_write" on public.campaign_members
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "associations_select" on public.associations
  for select using (public.can_access_workspace(workspace_id));
create policy "associations_write" on public.associations
  for all using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

create policy "custom_properties_select" on public.custom_properties
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "custom_properties_write" on public.custom_properties
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "custom_property_values_select" on public.custom_property_values
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "custom_property_values_write" on public.custom_property_values
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "integration_connections_select" on public.integration_connections
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "integration_connections_write" on public.integration_connections
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "integration_credentials_service_only" on public.integration_credentials
  for all using (false) with check (false);

create policy "field_mappings_select" on public.field_mappings
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "field_mappings_write" on public.field_mappings
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "import_jobs_select" on public.import_jobs
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "import_jobs_write" on public.import_jobs
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "enrichment_jobs_select" on public.enrichment_jobs
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "enrichment_jobs_write" on public.enrichment_jobs
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "ai_jobs_select" on public.ai_jobs
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "ai_jobs_write" on public.ai_jobs
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

create policy "audit_logs_select_admins" on public.audit_logs
  for select using (public.can_edit_scoped_record(organization_id, client_id, workspace_id));
create policy "audit_logs_insert_members" on public.audit_logs
  for insert with check (public.can_access_scoped_record(organization_id, client_id, workspace_id));

create policy "suppression_entries_select" on public.suppression_entries
  for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
create policy "suppression_entries_write" on public.suppression_entries
  for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
  with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations','users','teams','team_members','clients','client_members','workspaces','workspace_members',
    'pipelines','pipeline_stages','companies','contacts','deals','activities','tasks','notes','files',
    'lists','list_memberships','campaigns','campaign_members','associations','custom_properties',
    'custom_property_values','integration_connections','integration_credentials','field_mappings',
    'import_jobs','enrichment_jobs','ai_jobs','suppression_entries'
  ]
  loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl, tbl);
  end loop;
end $$;

create index users_organization_id_idx on public.users (organization_id);
create index users_email_idx on public.users (email);
create index teams_organization_id_idx on public.teams (organization_id);
create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_user_id_idx on public.team_members (user_id);
create index clients_organization_id_idx on public.clients (organization_id);
create index clients_owner_id_idx on public.clients (owner_id);
create index client_members_client_id_idx on public.client_members (client_id);
create index client_members_user_id_idx on public.client_members (user_id);
create index workspaces_client_id_idx on public.workspaces (client_id);
create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

create index pipelines_workspace_id_idx on public.pipelines (workspace_id);
create index pipeline_stages_pipeline_id_idx on public.pipeline_stages (pipeline_id);

create index companies_client_id_idx on public.companies (client_id);
create index companies_workspace_id_idx on public.companies (workspace_id);
create index companies_owner_id_idx on public.companies (owner_id);
create index companies_status_idx on public.companies (status);
create index companies_created_at_idx on public.companies (created_at);
create index companies_name_trgm_idx on public.companies using gin (name gin_trgm_ops);
create index companies_domain_idx on public.companies (domain);

create index contacts_client_id_idx on public.contacts (client_id);
create index contacts_workspace_id_idx on public.contacts (workspace_id);
create index contacts_company_id_idx on public.contacts (company_id);
create index contacts_owner_id_idx on public.contacts (owner_id);
create index contacts_status_idx on public.contacts (status);
create index contacts_created_at_idx on public.contacts (created_at);
create index contacts_email_idx on public.contacts (email);
create index contacts_full_name_trgm_idx on public.contacts using gin (full_name gin_trgm_ops);

create index deals_client_id_idx on public.deals (client_id);
create index deals_workspace_id_idx on public.deals (workspace_id);
create index deals_company_id_idx on public.deals (company_id);
create index deals_primary_contact_id_idx on public.deals (primary_contact_id);
create index deals_owner_id_idx on public.deals (owner_id);
create index deals_status_idx on public.deals (status);
create index deals_created_at_idx on public.deals (created_at);
create index deals_pipeline_stage_id_idx on public.deals (pipeline_stage_id);

create index activities_client_id_idx on public.activities (client_id);
create index activities_workspace_id_idx on public.activities (workspace_id);
create index activities_company_id_idx on public.activities (company_id);
create index activities_contact_id_idx on public.activities (contact_id);
create index activities_deal_id_idx on public.activities (deal_id);
create index activities_campaign_id_idx on public.activities (campaign_id);
create index activities_user_id_idx on public.activities (user_id);
create index activities_type_idx on public.activities (type);
create index activities_occurred_at_idx on public.activities (occurred_at);
create index activities_created_at_idx on public.activities (created_at);

create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_workspace_id_idx on public.tasks (workspace_id);
create index tasks_company_id_idx on public.tasks (company_id);
create index tasks_contact_id_idx on public.tasks (contact_id);
create index tasks_deal_id_idx on public.tasks (deal_id);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_at_idx on public.tasks (due_at);

create index notes_workspace_id_idx on public.notes (workspace_id);
create index notes_company_id_idx on public.notes (company_id);
create index notes_contact_id_idx on public.notes (contact_id);
create index notes_deal_id_idx on public.notes (deal_id);
create index files_workspace_id_idx on public.files (workspace_id);
create index files_company_id_idx on public.files (company_id);
create index files_contact_id_idx on public.files (contact_id);
create index files_deal_id_idx on public.files (deal_id);

create index lists_workspace_id_idx on public.lists (workspace_id);
create index list_memberships_list_id_idx on public.list_memberships (list_id);
create index list_memberships_object_idx on public.list_memberships (object_type, object_id);
create index campaigns_workspace_id_idx on public.campaigns (workspace_id);
create index campaigns_status_idx on public.campaigns (status);
create index campaign_members_campaign_id_idx on public.campaign_members (campaign_id);
create index campaign_members_contact_id_idx on public.campaign_members (contact_id);
create index campaign_members_company_id_idx on public.campaign_members (company_id);
create index associations_workspace_id_idx on public.associations (workspace_id);
create index associations_from_idx on public.associations (from_type, from_id);
create index associations_to_idx on public.associations (to_type, to_id);

create index custom_properties_scope_idx on public.custom_properties (organization_id, client_id, workspace_id, object_type);
create index custom_property_values_object_idx on public.custom_property_values (object_type, object_id);
create index integration_connections_scope_idx on public.integration_connections (organization_id, client_id, workspace_id, provider);
create index integration_credentials_connection_id_idx on public.integration_credentials (connection_id);
create index field_mappings_scope_idx on public.field_mappings (organization_id, client_id, workspace_id, provider, object_type);
create index import_jobs_scope_status_idx on public.import_jobs (organization_id, client_id, workspace_id, status, created_at);
create index enrichment_jobs_scope_status_idx on public.enrichment_jobs (organization_id, client_id, workspace_id, status, created_at);
create index ai_jobs_scope_status_idx on public.ai_jobs (organization_id, client_id, workspace_id, status, created_at);
create index ai_jobs_company_id_idx on public.ai_jobs (company_id);
create index ai_jobs_contact_id_idx on public.ai_jobs (contact_id);
create index audit_logs_scope_created_at_idx on public.audit_logs (organization_id, client_id, workspace_id, created_at);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_object_idx on public.audit_logs (object_type, object_id);
create index suppression_entries_scope_idx on public.suppression_entries (organization_id, client_id, workspace_id);
create index suppression_entries_email_idx on public.suppression_entries (email);
create index suppression_entries_domain_idx on public.suppression_entries (domain);
create index suppression_entries_phone_idx on public.suppression_entries (phone);
