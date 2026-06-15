create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  aircall_call_id uuid references public.aircall_calls(id) on delete set null,
  title text not null,
  meeting_at timestamptz,
  status text not null default 'booked' check (status in ('booked', 'held', 'cancelled', 'no_show')),
  notes text,
  transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(title)) > 0),
  foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete cascade
);

create index if not exists meetings_organization_client_idx on public.meetings (organization_id, client_id, meeting_at desc);
create index if not exists meetings_campaign_idx on public.meetings (campaign_id, meeting_at desc);
create index if not exists meetings_user_idx on public.meetings (organization_id, user_id, meeting_at desc);
create index if not exists meetings_aircall_call_idx on public.meetings (aircall_call_id);

alter table public.meetings enable row level security;
alter table public.meetings force row level security;

drop policy if exists "meetings_select_assigned_or_admin" on public.meetings;
drop policy if exists "meetings_insert_assigned_member_or_admin" on public.meetings;
drop policy if exists "meetings_update_owner_or_admin" on public.meetings;
drop policy if exists "meetings_delete_owner_or_admin" on public.meetings;

create policy "meetings_select_assigned_or_admin" on public.meetings
  for select using (
    public.is_org_admin(organization_id)
    or user_id = auth.uid()
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
    public.is_org_admin(organization_id)
    or (
      user_id = auth.uid()
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
  for update using (public.is_org_admin(organization_id) or user_id = auth.uid())
  with check (public.is_org_admin(organization_id) or user_id = auth.uid());

create policy "meetings_delete_owner_or_admin" on public.meetings
  for delete using (public.is_org_admin(organization_id) or user_id = auth.uid());

drop trigger if exists set_meetings_updated_at on public.meetings;
create trigger set_meetings_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

drop policy if exists "aircall_calls_members_all" on public.aircall_calls;
alter view if exists public.aircall_contact_call_timeline set (security_invoker = true);
create policy "aircall_calls_select_own_or_admin" on public.aircall_calls
  for select using (public.is_org_admin(organization_id) or user_id = auth.uid());
create policy "aircall_calls_insert_admins" on public.aircall_calls
  for insert with check (public.is_org_admin(organization_id));
create policy "aircall_calls_update_admins" on public.aircall_calls
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));
create policy "aircall_calls_delete_admins" on public.aircall_calls
  for delete using (public.is_org_admin(organization_id));

grant all on public.meetings to anon, authenticated, service_role;
