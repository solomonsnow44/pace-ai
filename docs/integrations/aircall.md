# Aircall Integration

Purpose:
Allow users to call contacts directly from the CRM and log call activity.

MVP:
- Use tel: links for click-to-call.
- Create call activity when user clicks call.
- Allow manual outcome logging.
- Store each PaceOps user's Aircall user ID on `public.users.aircall_user_id`.
- Mirror Aircall users in `public.aircall_users` and auto-link by email or a unique normalized name match.
- Store synced calls in `public.aircall_calls` and attach them to CRM contacts, companies, campaigns, and users.
- Store transcripts, summaries, sentiments, topics, action items, and evaluations in dedicated call intelligence tables.
- Keep personal call outcomes/notes in `public.aircall_call_user_notes`, scoped to the current user by RLS.
- Show an Aircall dashboard tab with per-user calls made, connected calls, recordings, talk time, sentiment charts, and recent call activity.

Later:
- Aircall OAuth/API connection.
- Webhooks for call started, call ended, recording available, transcript available.
- Attach call logs to contacts, companies, deals, and users.

Never expose Aircall credentials in frontend.
