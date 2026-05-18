create table if not exists public.contact_private_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  crm_contact_id text not null,
  body text not null default '',
  created_by uuid not null references public.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (length(trim(crm_contact_id)) > 0),
  unique (organization_id, crm_contact_id, created_by)
);

alter table public.contact_private_notes enable row level security;
alter table public.contact_private_notes force row level security;

drop policy if exists "contact_private_notes_select_own" on public.contact_private_notes;
create policy "contact_private_notes_select_own" on public.contact_private_notes
  for select using (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists "contact_private_notes_insert_own" on public.contact_private_notes;
create policy "contact_private_notes_insert_own" on public.contact_private_notes
  for insert with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists "contact_private_notes_update_own" on public.contact_private_notes;
create policy "contact_private_notes_update_own" on public.contact_private_notes
  for update using (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  )
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists "contact_private_notes_delete_own" on public.contact_private_notes;
create policy "contact_private_notes_delete_own" on public.contact_private_notes
  for delete using (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

create index if not exists contact_private_notes_org_user_idx
  on public.contact_private_notes (organization_id, created_by);

drop trigger if exists set_contact_private_notes_updated_at on public.contact_private_notes;
create trigger set_contact_private_notes_updated_at
before update on public.contact_private_notes
for each row execute function public.set_updated_at();

grant all on table public.contact_private_notes to anon;
grant all on table public.contact_private_notes to authenticated;
grant all on table public.contact_private_notes to service_role;
