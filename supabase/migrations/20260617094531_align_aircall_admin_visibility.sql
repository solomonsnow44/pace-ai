drop policy if exists "aircall_users_select_admin_all_or_self" on public.aircall_users;
drop policy if exists "aircall_users_write_admins" on public.aircall_users;
drop policy if exists "aircall_calls_select_admin_all_or_self" on public.aircall_calls;
drop policy if exists "aircall_calls_select_own_or_admin" on public.aircall_calls;
drop policy if exists "aircall_calls_insert_admins" on public.aircall_calls;
drop policy if exists "aircall_calls_update_admins" on public.aircall_calls;
drop policy if exists "aircall_calls_delete_admins" on public.aircall_calls;

create policy "aircall_users_select_admin_all_or_self" on public.aircall_users
  for select using (
    public.is_crm_admin(organization_id)
    or public.is_operational_admin(organization_id)
    or (
      public.is_org_member(organization_id)
      and (
        linked_user_id = auth.uid()
        or aircall_user_id = (
          select u.aircall_user_id
          from public.users u
          where u.id = auth.uid()
            and u.organization_id = aircall_users.organization_id
          limit 1
        )
      )
    )
  );

create policy "aircall_users_write_admins" on public.aircall_users
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_calls_select_admin_all_or_self" on public.aircall_calls
  for select using (
    public.is_crm_admin(organization_id)
    or public.is_operational_admin(organization_id)
    or (
      public.is_org_member(organization_id)
      and (
        user_id = auth.uid()
        or aircall_user_id = (
          select u.aircall_user_id
          from public.users u
          where u.id = auth.uid()
            and u.organization_id = aircall_calls.organization_id
          limit 1
        )
      )
    )
  );

create policy "aircall_calls_insert_admins" on public.aircall_calls
  for insert with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_calls_update_admins" on public.aircall_calls
  for update using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_calls_delete_admins" on public.aircall_calls
  for delete using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

drop policy if exists "aircall_call_transcripts_write_admins" on public.aircall_call_transcripts;
drop policy if exists "aircall_call_summaries_write_admins" on public.aircall_call_summaries;
drop policy if exists "aircall_call_sentiments_write_admins" on public.aircall_call_sentiments;
drop policy if exists "aircall_call_topics_write_admins" on public.aircall_call_topics;
drop policy if exists "aircall_call_action_items_write_admins" on public.aircall_call_action_items;
drop policy if exists "aircall_call_evaluations_write_admins" on public.aircall_call_evaluations;

create policy "aircall_call_transcripts_write_admins" on public.aircall_call_transcripts
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_call_summaries_write_admins" on public.aircall_call_summaries
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_call_sentiments_write_admins" on public.aircall_call_sentiments
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_call_topics_write_admins" on public.aircall_call_topics
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_call_action_items_write_admins" on public.aircall_call_action_items
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));

create policy "aircall_call_evaluations_write_admins" on public.aircall_call_evaluations
  for all using (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id))
  with check (public.is_crm_admin(organization_id) or public.is_operational_admin(organization_id));
