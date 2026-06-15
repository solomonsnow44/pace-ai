create or replace view public.aircall_contact_call_timeline
with (security_invoker = true) as
select
  c.id,
  c.organization_id,
  c.client_id,
  c.campaign_id,
  c.company_id,
  c.contact_id,
  c.user_id,
  u.display_name as user_name,
  u.email as user_email,
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
  n.outcome as my_outcome,
  n.private_note as my_private_note,
  c.tags,
  c.comments,
  c.aircall_user_id,
  c.raw_payload -> 'number' ->> 'name' as aircall_number_name,
  c.raw_payload -> 'number' ->> 'digits' as aircall_number_digits,
  t.utterances as transcript_utterances
from public.aircall_calls c
left join public.users u on u.id = c.user_id
left join public.aircall_call_summaries s on s.call_id = c.id and s.custom_summary_key = 'default'
left join public.aircall_call_sentiments se on se.call_id = c.id
left join public.aircall_call_transcripts t on t.call_id = c.id
left join public.aircall_call_user_notes n on n.call_id = c.id and n.user_id = auth.uid();
