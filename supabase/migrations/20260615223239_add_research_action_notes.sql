create table if not exists public.action_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null default 'Action note',
  body text not null,
  status text not null default 'open',
  action_type text not null default 'general',
  source text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_notes_body_check check (length(trim(body)) > 0),
  constraint action_notes_status_check check (status in ('open', 'in_progress', 'done', 'archived')),
  constraint action_notes_action_type_check check (action_type in ('general', 'call_back_needed', 'unprocessed', 'follow_up', 'research', 'gatekeeper', 'objection'))
);

create table if not exists public.action_note_contacts (
  action_note_id uuid not null references public.action_notes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (action_note_id, contact_id)
);

create index if not exists action_notes_org_company_idx
  on public.action_notes (organization_id, company_id, updated_at desc);

create index if not exists action_notes_org_campaign_idx
  on public.action_notes (organization_id, campaign_id, updated_at desc);

create index if not exists action_note_contacts_org_contact_idx
  on public.action_note_contacts (organization_id, contact_id);

alter table public.action_notes enable row level security;
alter table public.action_notes force row level security;
alter table public.action_note_contacts enable row level security;
alter table public.action_note_contacts force row level security;

drop policy if exists "action_notes_select_org_members" on public.action_notes;
create policy "action_notes_select_org_members" on public.action_notes
for select using (public.is_org_member(organization_id));

drop policy if exists "action_notes_insert_org_members" on public.action_notes;
create policy "action_notes_insert_org_members" on public.action_notes
for insert with check (public.is_org_member(organization_id));

drop policy if exists "action_notes_update_org_members" on public.action_notes;
create policy "action_notes_update_org_members" on public.action_notes
for update using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "action_notes_delete_org_members" on public.action_notes;
create policy "action_notes_delete_org_members" on public.action_notes
for delete using (public.is_org_member(organization_id));

drop policy if exists "action_note_contacts_select_org_members" on public.action_note_contacts;
create policy "action_note_contacts_select_org_members" on public.action_note_contacts
for select using (public.is_org_member(organization_id));

drop policy if exists "action_note_contacts_insert_org_members" on public.action_note_contacts;
create policy "action_note_contacts_insert_org_members" on public.action_note_contacts
for insert with check (public.is_org_member(organization_id));

drop policy if exists "action_note_contacts_update_org_members" on public.action_note_contacts;
create policy "action_note_contacts_update_org_members" on public.action_note_contacts
for update using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "action_note_contacts_delete_org_members" on public.action_note_contacts;
create policy "action_note_contacts_delete_org_members" on public.action_note_contacts
for delete using (public.is_org_member(organization_id));

drop trigger if exists set_action_notes_updated_at on public.action_notes;
create trigger set_action_notes_updated_at
before update on public.action_notes
for each row execute function public.set_updated_at();

grant select, insert, update, delete on table public.action_notes to authenticated;
grant select, insert, update, delete on table public.action_note_contacts to authenticated;
grant all on table public.action_notes to service_role;
grant all on table public.action_note_contacts to service_role;
