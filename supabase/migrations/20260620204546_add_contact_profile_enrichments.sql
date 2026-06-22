create table if not exists public.contact_profile_enrichments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  provider text not null,
  provider_contact_id text,
  provider_lead_id text,
  linkedin_key text,
  linkedin_url text,
  full_name text,
  profile_picture_url text,
  summary text,
  headline text,
  location text,
  skills jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  last_enriched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(provider)) > 0),
  constraint contact_profile_enrichments_org_linkedin_key unique (organization_id, linkedin_key),
  check (
    contact_id is not null
    or nullif(trim(coalesce(linkedin_key, '')), '') is not null
    or nullif(trim(coalesce(provider_contact_id, '')), '') is not null
  )
);

create unique index if not exists contact_profile_enrichments_org_provider_contact_key
  on public.contact_profile_enrichments (organization_id, provider, provider_contact_id)
  where provider_contact_id is not null and trim(provider_contact_id) <> '';

create index if not exists contact_profile_enrichments_contact_idx
  on public.contact_profile_enrichments (contact_id)
  where contact_id is not null;

create index if not exists contact_profile_enrichments_org_enriched_idx
  on public.contact_profile_enrichments (organization_id, last_enriched_at desc);

drop trigger if exists set_contact_profile_enrichments_updated_at on public.contact_profile_enrichments;
create trigger set_contact_profile_enrichments_updated_at
before update on public.contact_profile_enrichments
for each row execute function public.set_updated_at();

alter table public.contact_profile_enrichments enable row level security;
alter table public.contact_profile_enrichments force row level security;

drop policy if exists "contact_profile_enrichments_members_all" on public.contact_profile_enrichments;
create policy "contact_profile_enrichments_members_all" on public.contact_profile_enrichments
  for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant all on table public.contact_profile_enrichments to authenticated;
grant all on table public.contact_profile_enrichments to service_role;
