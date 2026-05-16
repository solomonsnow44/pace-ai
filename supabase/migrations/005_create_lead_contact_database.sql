-- Organization-scoped reusable contact database for Lead Finder manual data.
create table if not exists public.lead_contact_database (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_name text,
  first_name text,
  last_name text,
  company text,
  job_title text,
  location text,
  linkedin_profile_url text,
  manual_email text,
  manual_mobile text,
  manual_direct_dial text,
  notes text,
  source_note text not null default 'Added manually by PaceOps user',
  data_source text not null default 'manual',
  confidence numeric(5,2) not null default 0.85,
  cognism_contact_id text,
  normalized_identity_key text not null,
  lookup_status text,
  lookup_notes text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_source in ('manual', 'linkedin_manual', 'paceops_db', 'imported_csv', 'cognism_preview')),
  check (length(trim(normalized_identity_key)) > 0)
);

alter table public.lead_contact_database
  add column if not exists notes text;

alter table public.lead_contact_database enable row level security;
alter table public.lead_contact_database force row level security;

drop policy if exists "lead_contact_database_select_members" on public.lead_contact_database;
create policy "lead_contact_database_select_members" on public.lead_contact_database
  for select using (public.is_org_member(organization_id));

drop policy if exists "lead_contact_database_insert_members" on public.lead_contact_database;
create policy "lead_contact_database_insert_members" on public.lead_contact_database
  for insert with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists "lead_contact_database_update_members" on public.lead_contact_database;
create policy "lead_contact_database_update_members" on public.lead_contact_database
  for update using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

drop policy if exists "lead_contact_database_delete_admins" on public.lead_contact_database;
create policy "lead_contact_database_delete_admins" on public.lead_contact_database
  for delete using (public.is_org_admin(organization_id));

create unique index if not exists lead_contact_database_identity_idx
  on public.lead_contact_database (organization_id, normalized_identity_key);
create index if not exists lead_contact_database_org_idx
  on public.lead_contact_database (organization_id);
create index if not exists lead_contact_database_cognism_idx
  on public.lead_contact_database (organization_id, cognism_contact_id)
  where cognism_contact_id is not null and cognism_contact_id <> '';
create index if not exists lead_contact_database_linkedin_idx
  on public.lead_contact_database (organization_id, lower(linkedin_profile_url))
  where linkedin_profile_url is not null and linkedin_profile_url <> '';
create index if not exists lead_contact_database_email_idx
  on public.lead_contact_database (organization_id, lower(manual_email))
  where manual_email is not null and manual_email <> '';
create index if not exists lead_contact_database_mobile_idx
  on public.lead_contact_database (organization_id, manual_mobile)
  where manual_mobile is not null and manual_mobile <> '';

drop trigger if exists set_lead_contact_database_updated_at on public.lead_contact_database;
create trigger set_lead_contact_database_updated_at
before update on public.lead_contact_database
for each row execute function public.set_updated_at();

grant all on table public.lead_contact_database to anon;
grant all on table public.lead_contact_database to authenticated;
grant all on table public.lead_contact_database to service_role;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lead_contact_database'
  ) then
    alter publication supabase_realtime add table public.lead_contact_database;
  end if;
end $$;
