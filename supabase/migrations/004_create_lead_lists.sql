-- Saved Lead Finder result lists assigned to one or more CRM users.
create table if not exists public.lead_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  source text not null default 'lead_finder',
  assigned_user_ids uuid[] not null default '{}'::uuid[],
  leads jsonb not null default '[]'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name)) > 0),
  check (jsonb_typeof(leads) = 'array'),
  check (jsonb_typeof(filters) = 'object')
);

alter table public.lead_lists enable row level security;
alter table public.lead_lists force row level security;

drop policy if exists "lead_lists_select_assigned" on public.lead_lists;
create policy "lead_lists_select_assigned" on public.lead_lists
  for select using (
    public.is_org_member(organization_id)
    and (
      created_by = auth.uid()
      or auth.uid() = any(assigned_user_ids)
      or public.is_org_admin(organization_id)
    )
  );

drop policy if exists "lead_lists_insert_members" on public.lead_lists;
create policy "lead_lists_insert_members" on public.lead_lists
  for insert with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists "lead_lists_update_owners" on public.lead_lists;
create policy "lead_lists_update_owners" on public.lead_lists
  for update using (
    public.is_org_member(organization_id)
    and (
      created_by = auth.uid()
      or public.is_org_admin(organization_id)
    )
  ) with check (
    public.is_org_member(organization_id)
    and (
      created_by = auth.uid()
      or public.is_org_admin(organization_id)
    )
  );

drop policy if exists "lead_lists_delete_owners" on public.lead_lists;
create policy "lead_lists_delete_owners" on public.lead_lists
  for delete using (
    public.is_org_member(organization_id)
    and (
      created_by = auth.uid()
      or public.is_org_admin(organization_id)
    )
  );

create index if not exists lead_lists_organization_id_idx on public.lead_lists (organization_id);
create index if not exists lead_lists_created_by_idx on public.lead_lists (created_by);
create index if not exists lead_lists_created_at_idx on public.lead_lists (created_at desc);
create index if not exists lead_lists_assigned_user_ids_idx on public.lead_lists using gin (assigned_user_ids);

drop trigger if exists set_lead_lists_updated_at on public.lead_lists;
create trigger set_lead_lists_updated_at
before update on public.lead_lists
for each row execute function public.set_updated_at();

grant all on table public.lead_lists to anon;
grant all on table public.lead_lists to authenticated;
grant all on table public.lead_lists to service_role;

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
      and tablename = 'lead_lists'
  ) then
    alter publication supabase_realtime add table public.lead_lists;
  end if;
end $$;
