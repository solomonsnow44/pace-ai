alter table public.aircall_call_user_notes
  add column if not exists note text not null default '';

update public.aircall_call_user_notes
set note = coalesce(nullif(trim(note), ''), private_note, '')
where coalesce(nullif(trim(note), ''), '') = ''
  and coalesce(nullif(trim(private_note), ''), '') <> '';

with ranked_notes as (
  select
    id,
    row_number() over (
      partition by organization_id, call_id
      order by
        case when coalesce(nullif(trim(note), ''), nullif(trim(private_note), '')) is null then 1 else 0 end,
        updated_at desc,
        created_at desc,
        id
    ) as row_number
  from public.aircall_call_user_notes
)
delete from public.aircall_call_user_notes n
using ranked_notes ranked
where n.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists aircall_call_user_notes_call_unique_idx
  on public.aircall_call_user_notes (organization_id, call_id);

create index if not exists aircall_call_user_notes_contact_idx
  on public.aircall_call_user_notes (organization_id, contact_id, updated_at desc)
  where contact_id is not null;

drop policy if exists "aircall_call_user_notes_select_own" on public.aircall_call_user_notes;
drop policy if exists "aircall_call_user_notes_insert_own" on public.aircall_call_user_notes;
drop policy if exists "aircall_call_user_notes_update_own" on public.aircall_call_user_notes;
drop policy if exists "aircall_call_user_notes_delete_own" on public.aircall_call_user_notes;

create policy "aircall_call_user_notes_select_org_members" on public.aircall_call_user_notes
  for select using (public.is_org_member(organization_id));

create policy "aircall_call_user_notes_insert_org_members" on public.aircall_call_user_notes
  for insert with check (public.is_org_member(organization_id) and user_id = auth.uid());

create policy "aircall_call_user_notes_update_org_members" on public.aircall_call_user_notes
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "aircall_call_user_notes_delete_org_members" on public.aircall_call_user_notes
  for delete using (public.is_org_member(organization_id));

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
  c.raw_payload -> 'number' ->> 'name' as aircall_number_name,
  c.raw_payload -> 'number' ->> 'digits' as aircall_number_digits,
  c.recording_url,
  c.recording_short_url,
  c.direct_link,
  s.summary,
  se.sentiment_label,
  se.sentiment_score,
  t.full_text as transcript_text,
  t.utterances as transcript_utterances,
  n.outcome as my_outcome,
  n.note as call_note,
  n.note as my_call_note,
  n.note as my_private_note,
  c.tags,
  c.comments
from public.aircall_calls c
left join public.aircall_users au on au.organization_id = c.organization_id and au.aircall_user_id = c.aircall_user_id
left join public.users u on u.id = coalesce(c.user_id, au.linked_user_id)
left join public.aircall_call_summaries s on s.call_id = c.id and s.custom_summary_key = 'default'
left join public.aircall_call_sentiments se on se.call_id = c.id
left join public.aircall_call_transcripts t on t.call_id = c.id
left join public.aircall_call_user_notes n on n.call_id = c.id;

grant all on table public.aircall_contact_call_timeline to anon, authenticated, service_role;
