alter table public.meetings
  add column if not exists owner_user_id uuid references public.users(id) on delete set null,
  add column if not exists booked_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists aircall_user_record_id uuid references public.aircall_users(id) on delete set null,
  add column if not exists aircall_user_id text,
  add column if not exists agent_name text;

update public.meetings
set
  owner_user_id = coalesce(owner_user_id, user_id),
  booked_by_user_id = coalesce(booked_by_user_id, user_id)
where owner_user_id is null
   or booked_by_user_id is null;

update public.meetings m
set
  owner_user_id = coalesce(c.user_id, au.linked_user_id, m.owner_user_id),
  aircall_user_record_id = coalesce(au.id, m.aircall_user_record_id),
  aircall_user_id = coalesce(c.aircall_user_id, m.aircall_user_id),
  agent_name = coalesce(nullif(u.display_name, ''), nullif(au.name, ''), nullif(m.agent_name, ''), m.agent_name)
from public.aircall_calls c
left join public.aircall_users au on au.organization_id = c.organization_id and au.aircall_user_id = c.aircall_user_id
left join public.users u on u.id = coalesce(c.user_id, au.linked_user_id)
where m.aircall_call_id = c.id;

create index if not exists meetings_owner_user_idx on public.meetings (organization_id, owner_user_id);
create index if not exists meetings_booked_by_user_idx on public.meetings (organization_id, booked_by_user_id);
create index if not exists meetings_aircall_user_record_idx on public.meetings (aircall_user_record_id);
create index if not exists meetings_aircall_user_id_idx on public.meetings (organization_id, aircall_user_id)
  where aircall_user_id is not null and trim(aircall_user_id) <> '';

drop policy if exists "meetings_select_assigned_or_admin" on public.meetings;
drop policy if exists "meetings_insert_assigned_member_or_admin" on public.meetings;
drop policy if exists "meetings_update_owner_or_admin" on public.meetings;
drop policy if exists "meetings_delete_owner_or_admin" on public.meetings;

create policy "meetings_select_assigned_or_admin" on public.meetings
  for select using (
    public.is_org_admin(organization_id)
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
    public.is_org_admin(organization_id)
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
  for update using (public.is_org_admin(organization_id) or owner_user_id = auth.uid() or booked_by_user_id = auth.uid())
  with check (public.is_org_admin(organization_id) or owner_user_id = auth.uid() or booked_by_user_id = auth.uid());

create policy "meetings_delete_owner_or_admin" on public.meetings
  for delete using (public.is_org_admin(organization_id) or owner_user_id = auth.uid() or booked_by_user_id = auth.uid());

drop view if exists public.aircall_contact_call_timeline;

create view public.aircall_contact_call_timeline
with (security_invoker = true) as
select
  c.id,
  c.organization_id,
  c.client_id,
  c.campaign_id,
  c.company_id,
  c.contact_id,
  coalesce(c.user_id, au.linked_user_id) as user_id,
  coalesce(nullif(u.display_name, ''), nullif(au.name, ''), au.email) as user_name,
  coalesce(u.email, au.email) as user_email,
  c.aircall_user_id,
  c.aircall_call_id,
  c.aircall_call_uuid,
  c.direction,
  c.status,
  c.started_at,
  c.answered_at,
  c.ended_at,
  c.duration_seconds,
  c.external_phone_number,
  c.recording_url,
  c.recording_short_url,
  c.direct_link,
  s.summary,
  se.sentiment_label,
  se.sentiment_score,
  t.full_text as transcript_text,
  t.utterances as transcript_utterances,
  n.outcome as my_outcome,
  n.private_note as my_private_note,
  c.tags,
  c.comments
from public.aircall_calls c
left join public.aircall_users au on au.organization_id = c.organization_id and au.aircall_user_id = c.aircall_user_id
left join public.users u on u.id = coalesce(c.user_id, au.linked_user_id)
left join public.aircall_call_summaries s on s.call_id = c.id and s.custom_summary_key = 'default'
left join public.aircall_call_sentiments se on se.call_id = c.id
left join public.aircall_call_transcripts t on t.call_id = c.id
left join public.aircall_call_user_notes n on n.call_id = c.id and n.user_id = auth.uid();

grant all on table public.aircall_contact_call_timeline to anon, authenticated, service_role;
