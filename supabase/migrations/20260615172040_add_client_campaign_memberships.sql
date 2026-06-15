-- Store simplified CRM visibility with proper relationships, not JSON metadata.

create unique index if not exists clients_id_organization_id_key
  on public.clients (id, organization_id);

create unique index if not exists campaigns_id_organization_client_id_key
  on public.campaigns (id, organization_id, client_id);

create table if not exists public.client_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id),
  foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete cascade,
  foreign key (user_id, organization_id) references public.users(id, organization_id) on delete cascade
);

create table if not exists public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id),
  foreign key (campaign_id, organization_id, client_id) references public.campaigns(id, organization_id, client_id) on delete cascade,
  foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete cascade,
  foreign key (user_id, organization_id) references public.users(id, organization_id) on delete cascade
);

create index if not exists client_members_organization_user_idx on public.client_members (organization_id, user_id);
create index if not exists client_members_client_idx on public.client_members (client_id);
create index if not exists campaign_members_organization_user_idx on public.campaign_members (organization_id, user_id);
create index if not exists campaign_members_campaign_idx on public.campaign_members (campaign_id);
create index if not exists campaign_members_client_idx on public.campaign_members (client_id);

alter table public.client_members enable row level security;
alter table public.campaign_members enable row level security;
alter table public.client_members force row level security;
alter table public.campaign_members force row level security;

drop policy if exists "client_members_select_assigned_or_admin" on public.client_members;
drop policy if exists "client_members_insert_admins" on public.client_members;
drop policy if exists "client_members_update_admins" on public.client_members;
drop policy if exists "client_members_delete_admins" on public.client_members;
drop policy if exists "campaign_members_select_assigned_or_admin" on public.campaign_members;
drop policy if exists "campaign_members_insert_admins" on public.campaign_members;
drop policy if exists "campaign_members_update_admins" on public.campaign_members;
drop policy if exists "campaign_members_delete_admins" on public.campaign_members;

create policy "client_members_select_assigned_or_admin" on public.client_members
  for select using (public.is_org_admin(organization_id) or user_id = auth.uid());

create policy "client_members_insert_admins" on public.client_members
  for insert with check (public.is_org_admin(organization_id));

create policy "client_members_update_admins" on public.client_members
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "client_members_delete_admins" on public.client_members
  for delete using (public.is_org_admin(organization_id));

create policy "campaign_members_select_assigned_or_admin" on public.campaign_members
  for select using (public.is_org_admin(organization_id) or user_id = auth.uid());

create policy "campaign_members_insert_admins" on public.campaign_members
  for insert with check (public.is_org_admin(organization_id));

create policy "campaign_members_update_admins" on public.campaign_members
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "campaign_members_delete_admins" on public.campaign_members
  for delete using (public.is_org_admin(organization_id));

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
      and (
        public.is_org_admin(c.organization_id)
        or exists (
          select 1
          from public.client_members cm
          where cm.client_id = c.id
            and cm.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.campaign_members cam
          where cam.client_id = c.id
            and cam.user_id = auth.uid()
        )
      )
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
      and public.is_org_admin(c.organization_id)
  ) or public.is_platform_admin()
$$;

drop policy if exists "clients_members_all" on public.clients;
drop policy if exists "companies_members_all" on public.companies;
drop policy if exists "contacts_members_all" on public.contacts;
drop policy if exists "campaigns_members_all" on public.campaigns;
drop policy if exists "campaign_targets_members_all" on public.campaign_targets;
drop policy if exists "activities_members_all" on public.activities;

create policy "clients_select_assigned_or_admin" on public.clients
  for select using (public.can_access_client(id));

create policy "clients_insert_admins" on public.clients
  for insert with check (public.is_org_admin(organization_id));

create policy "clients_update_admins" on public.clients
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "clients_delete_admins" on public.clients
  for delete using (public.is_org_admin(organization_id));

create policy "campaigns_select_assigned_or_admin" on public.campaigns
  for select using (
    public.is_org_admin(organization_id)
    or exists (
      select 1
      from public.campaign_members cm
      where cm.campaign_id = campaigns.id
        and cm.user_id = auth.uid()
    )
  );

create policy "campaigns_insert_admins" on public.campaigns
  for insert with check (public.is_org_admin(organization_id));

create policy "campaigns_update_admins" on public.campaigns
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "campaigns_delete_admins" on public.campaigns
  for delete using (public.is_org_admin(organization_id));

create policy "companies_select_assigned_or_admin" on public.companies
  for select using (
    public.is_org_admin(organization_id)
    or exists (
      select 1
      from public.client_members cm
      where cm.client_id = companies.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.campaign_targets ct
      join public.campaign_members cam on cam.campaign_id = ct.campaign_id
      where ct.company_id = companies.id
        and cam.user_id = auth.uid()
    )
  );

create policy "companies_insert_admins" on public.companies
  for insert with check (public.is_org_admin(organization_id));

create policy "companies_update_admins" on public.companies
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "companies_delete_admins" on public.companies
  for delete using (public.is_org_admin(organization_id));

create policy "contacts_select_assigned_or_admin" on public.contacts
  for select using (
    public.is_org_admin(organization_id)
    or exists (
      select 1
      from public.client_members cm
      where cm.client_id = contacts.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.campaign_targets ct
      join public.campaign_members cam on cam.campaign_id = ct.campaign_id
      where ct.contact_id = contacts.id
        and cam.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.campaign_targets ct
      join public.campaign_members cam on cam.campaign_id = ct.campaign_id
      where ct.company_id = contacts.company_id
        and cam.user_id = auth.uid()
    )
  );

create policy "contacts_insert_admins" on public.contacts
  for insert with check (public.is_org_admin(organization_id));

create policy "contacts_update_admins" on public.contacts
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "contacts_delete_admins" on public.contacts
  for delete using (public.is_org_admin(organization_id));

create policy "campaign_targets_select_assigned_or_admin" on public.campaign_targets
  for select using (
    public.is_org_admin(organization_id)
    or exists (
      select 1
      from public.campaign_members cm
      where cm.campaign_id = campaign_targets.campaign_id
        and cm.user_id = auth.uid()
    )
  );

create policy "campaign_targets_insert_admins" on public.campaign_targets
  for insert with check (public.is_org_admin(organization_id));

create policy "campaign_targets_update_admins" on public.campaign_targets
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "campaign_targets_delete_admins" on public.campaign_targets
  for delete using (public.is_org_admin(organization_id));

create policy "activities_select_assigned_or_admin" on public.activities
  for select using (
    public.is_org_admin(organization_id)
    or (client_id is not null and public.can_access_client(client_id))
    or exists (
      select 1
      from public.campaign_members cm
      where cm.campaign_id = activities.campaign_id
        and cm.user_id = auth.uid()
    )
  );

create policy "activities_insert_admins" on public.activities
  for insert with check (public.is_org_admin(organization_id));

create policy "activities_update_admins" on public.activities
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "activities_delete_admins" on public.activities
  for delete using (public.is_org_admin(organization_id));

drop trigger if exists set_client_members_updated_at on public.client_members;
create trigger set_client_members_updated_at
before update on public.client_members
for each row execute function public.set_updated_at();

drop trigger if exists set_campaign_members_updated_at on public.campaign_members;
create trigger set_campaign_members_updated_at
before update on public.campaign_members
for each row execute function public.set_updated_at();

insert into public.client_members (organization_id, client_id, user_id)
select c.organization_id, c.id, member_id::uuid
from public.clients c
cross join lateral (
  select old_member.member_id
  from jsonb_array_elements_text(coalesce(c.metadata->'member_ids', '[]'::jsonb)) as old_member(member_id)
  where old_member.member_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
) as members
join public.users u on u.id = member_id::uuid and u.organization_id = c.organization_id
on conflict (client_id, user_id) do nothing;

insert into public.campaign_members (organization_id, client_id, campaign_id, user_id)
select c.organization_id, c.client_id, c.id, member_id::uuid
from public.campaigns c
cross join lateral (
  select old_member.member_id
  from jsonb_array_elements_text(coalesce(c.settings->'member_ids', '[]'::jsonb)) as old_member(member_id)
  where old_member.member_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
) as members
join public.users u on u.id = member_id::uuid and u.organization_id = c.organization_id
on conflict (campaign_id, user_id) do nothing;

update public.clients
set metadata = metadata - 'member_ids'
where metadata ? 'member_ids';

update public.campaigns
set settings = settings - 'member_ids'
where settings ? 'member_ids';

grant all on public.client_members to anon, authenticated, service_role;
grant all on public.campaign_members to anon, authenticated, service_role;
