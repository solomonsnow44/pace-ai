create or replace function public.is_crm_admin(target_organization_id uuid)
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
      and u.role in ('org_owner', 'org_admin', 'admin')
  ) or public.is_platform_admin()
$$;

grant all on function public.is_crm_admin(uuid) to anon, authenticated, service_role;

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
        public.is_crm_admin(c.organization_id)
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
      and public.is_crm_admin(c.organization_id)
  ) or public.is_platform_admin()
$$;

grant all on function public.can_access_client(uuid) to anon, authenticated, service_role;
grant all on function public.can_manage_client(uuid) to anon, authenticated, service_role;

drop policy if exists "client_members_select_assigned_or_admin" on public.client_members;
drop policy if exists "client_members_insert_admins" on public.client_members;
drop policy if exists "client_members_update_admins" on public.client_members;
drop policy if exists "client_members_delete_admins" on public.client_members;

create policy "client_members_select_assigned_or_admin" on public.client_members
  for select using (public.is_crm_admin(organization_id) or user_id = auth.uid());

create policy "client_members_insert_admins" on public.client_members
  for insert with check (public.is_crm_admin(organization_id));

create policy "client_members_update_admins" on public.client_members
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "client_members_delete_admins" on public.client_members
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "campaign_members_select_assigned_or_admin" on public.campaign_members;
drop policy if exists "campaign_members_insert_admins" on public.campaign_members;
drop policy if exists "campaign_members_update_admins" on public.campaign_members;
drop policy if exists "campaign_members_delete_admins" on public.campaign_members;

create policy "campaign_members_select_assigned_or_admin" on public.campaign_members
  for select using (public.is_crm_admin(organization_id) or user_id = auth.uid());

create policy "campaign_members_insert_admins" on public.campaign_members
  for insert with check (public.is_crm_admin(organization_id));

create policy "campaign_members_update_admins" on public.campaign_members
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "campaign_members_delete_admins" on public.campaign_members
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "clients_insert_admins" on public.clients;
drop policy if exists "clients_update_admins" on public.clients;
drop policy if exists "clients_delete_admins" on public.clients;

create policy "clients_insert_admins" on public.clients
  for insert with check (public.is_crm_admin(organization_id));

create policy "clients_update_admins" on public.clients
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "clients_delete_admins" on public.clients
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "campaigns_select_assigned_or_admin" on public.campaigns;
drop policy if exists "campaigns_insert_admins" on public.campaigns;
drop policy if exists "campaigns_update_admins" on public.campaigns;
drop policy if exists "campaigns_delete_admins" on public.campaigns;

create policy "campaigns_select_assigned_or_admin" on public.campaigns
  for select using (
    public.is_crm_admin(organization_id)
    or exists (
      select 1
      from public.campaign_members cm
      where cm.campaign_id = campaigns.id
        and cm.user_id = auth.uid()
    )
  );

create policy "campaigns_insert_admins" on public.campaigns
  for insert with check (public.is_crm_admin(organization_id));

create policy "campaigns_update_admins" on public.campaigns
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "campaigns_delete_admins" on public.campaigns
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "companies_select_assigned_or_admin" on public.companies;
drop policy if exists "companies_insert_admins" on public.companies;
drop policy if exists "companies_update_admins" on public.companies;
drop policy if exists "companies_delete_admins" on public.companies;

create policy "companies_select_assigned_or_admin" on public.companies
  for select using (
    public.is_crm_admin(organization_id)
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
  for insert with check (public.is_crm_admin(organization_id));

create policy "companies_update_admins" on public.companies
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "companies_delete_admins" on public.companies
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "contacts_select_assigned_or_admin" on public.contacts;
drop policy if exists "contacts_insert_admins" on public.contacts;
drop policy if exists "contacts_update_admins" on public.contacts;
drop policy if exists "contacts_delete_admins" on public.contacts;

create policy "contacts_select_assigned_or_admin" on public.contacts
  for select using (
    public.is_crm_admin(organization_id)
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
  for insert with check (public.is_crm_admin(organization_id));

create policy "contacts_update_admins" on public.contacts
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "contacts_delete_admins" on public.contacts
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "campaign_targets_select_assigned_or_admin" on public.campaign_targets;
drop policy if exists "campaign_targets_insert_admins" on public.campaign_targets;
drop policy if exists "campaign_targets_update_admins" on public.campaign_targets;
drop policy if exists "campaign_targets_delete_admins" on public.campaign_targets;

create policy "campaign_targets_select_assigned_or_admin" on public.campaign_targets
  for select using (
    public.is_crm_admin(organization_id)
    or exists (
      select 1
      from public.campaign_members cm
      where cm.campaign_id = campaign_targets.campaign_id
        and cm.user_id = auth.uid()
    )
  );

create policy "campaign_targets_insert_admins" on public.campaign_targets
  for insert with check (public.is_crm_admin(organization_id));

create policy "campaign_targets_update_admins" on public.campaign_targets
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "campaign_targets_delete_admins" on public.campaign_targets
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "activities_select_assigned_or_admin" on public.activities;
drop policy if exists "activities_insert_admins" on public.activities;
drop policy if exists "activities_update_admins" on public.activities;
drop policy if exists "activities_delete_admins" on public.activities;

create policy "activities_select_assigned_or_admin" on public.activities
  for select using (
    public.is_crm_admin(organization_id)
    or (client_id is not null and public.can_access_client(client_id))
    or exists (
      select 1
      from public.campaign_members cm
      where cm.campaign_id = activities.campaign_id
        and cm.user_id = auth.uid()
    )
  );

create policy "activities_insert_admins" on public.activities
  for insert with check (public.is_crm_admin(organization_id));

create policy "activities_update_admins" on public.activities
  for update using (public.is_crm_admin(organization_id))
  with check (public.is_crm_admin(organization_id));

create policy "activities_delete_admins" on public.activities
  for delete using (public.is_crm_admin(organization_id));

drop policy if exists "meetings_select_assigned_or_admin" on public.meetings;
drop policy if exists "meetings_insert_assigned_member_or_admin" on public.meetings;
drop policy if exists "meetings_update_owner_or_admin" on public.meetings;
drop policy if exists "meetings_delete_owner_or_admin" on public.meetings;

create policy "meetings_select_assigned_or_admin" on public.meetings
  for select using (
    public.is_crm_admin(organization_id)
    or user_id = auth.uid()
    or owner_user_id = auth.uid()
    or booked_by_user_id = auth.uid()
    or exists (
      select 1
      from public.client_members cm
      where cm.client_id = meetings.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.campaign_members cam
      where cam.campaign_id = meetings.campaign_id
        and cam.user_id = auth.uid()
    )
  );

create policy "meetings_insert_assigned_member_or_admin" on public.meetings
  for insert with check (
    public.is_crm_admin(organization_id)
    or (
      booked_by_user_id = auth.uid()
      and coalesce(owner_user_id, user_id) = auth.uid()
      and (
        exists (
          select 1
          from public.client_members cm
          where cm.client_id = meetings.client_id
            and cm.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.campaign_members cam
          where cam.campaign_id = meetings.campaign_id
            and cam.user_id = auth.uid()
        )
      )
    )
  );

create policy "meetings_update_owner_or_admin" on public.meetings
  for update using (public.is_crm_admin(organization_id) or owner_user_id = auth.uid() or booked_by_user_id = auth.uid())
  with check (public.is_crm_admin(organization_id) or owner_user_id = auth.uid() or booked_by_user_id = auth.uid());

create policy "meetings_delete_owner_or_admin" on public.meetings
  for delete using (public.is_crm_admin(organization_id) or owner_user_id = auth.uid() or booked_by_user_id = auth.uid());
