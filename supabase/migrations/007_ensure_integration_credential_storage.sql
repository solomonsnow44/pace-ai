-- Ensures the integration API key storage tables exist for deployed projects.
-- Credentials are only accessible through service-role backend routes.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_provider' and typnamespace = 'public'::regnamespace) then
    create type public.integration_provider as enum ('hubspot', 'cognism', 'aircall', 'openai', 'csv', 'other');
  end if;
end $$;

create table if not exists public.integration_connections (
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
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_credentials (
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

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'integration_connections_id_organization_id_key'
  ) then
    alter table public.integration_connections
      add constraint integration_connections_id_organization_id_key unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'integration_credentials_connection_scope_fkey'
  ) then
    alter table public.integration_credentials
      add constraint integration_credentials_connection_scope_fkey
      foreign key (connection_id, organization_id)
      references public.integration_connections(id, organization_id)
      on delete cascade;
  end if;
end $$;

create index if not exists integration_connections_scope_idx
  on public.integration_connections (organization_id, client_id, workspace_id, provider);

create index if not exists integration_credentials_connection_id_idx
  on public.integration_credentials (connection_id);

alter table public.integration_connections enable row level security;
alter table public.integration_connections force row level security;
alter table public.integration_credentials enable row level security;
alter table public.integration_credentials force row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'integration_connections' and policyname = 'integration_connections_select'
  ) then
    create policy "integration_connections_select" on public.integration_connections
      for select using (public.can_access_scoped_record(organization_id, client_id, workspace_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'integration_connections' and policyname = 'integration_connections_write'
  ) then
    create policy "integration_connections_write" on public.integration_connections
      for all using (public.can_edit_scoped_record(organization_id, client_id, workspace_id))
      with check (public.can_edit_scoped_record(organization_id, client_id, workspace_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'integration_credentials' and policyname = 'integration_credentials_service_only'
  ) then
    create policy "integration_credentials_service_only" on public.integration_credentials
      for all using (false) with check (false);
  end if;
end $$;
