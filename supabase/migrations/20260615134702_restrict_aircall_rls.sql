drop policy if exists "aircall_users_members_all" on public.aircall_users;
drop policy if exists "aircall_calls_members_all" on public.aircall_calls;
drop policy if exists "aircall_call_transcripts_members_all" on public.aircall_call_transcripts;
drop policy if exists "aircall_call_summaries_members_all" on public.aircall_call_summaries;
drop policy if exists "aircall_call_sentiments_members_all" on public.aircall_call_sentiments;
drop policy if exists "aircall_call_topics_members_all" on public.aircall_call_topics;
drop policy if exists "aircall_call_action_items_members_all" on public.aircall_call_action_items;
drop policy if exists "aircall_call_evaluations_members_all" on public.aircall_call_evaluations;

create policy "aircall_users_select_admin_all_or_self" on public.aircall_users
  for select using (
    public.is_operational_admin(organization_id)
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
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_calls_select_admin_all_or_self" on public.aircall_calls
  for select using (
    public.is_operational_admin(organization_id)
    or (
      public.is_org_member(organization_id)
      and user_id = auth.uid()
    )
  );

create policy "aircall_calls_write_admins" on public.aircall_calls
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_call_transcripts_select_visible_calls" on public.aircall_call_transcripts
  for select using (
    exists (
      select 1
      from public.aircall_calls c
      where c.id = aircall_call_transcripts.call_id
    )
  );

create policy "aircall_call_transcripts_write_admins" on public.aircall_call_transcripts
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_call_summaries_select_visible_calls" on public.aircall_call_summaries
  for select using (
    exists (
      select 1
      from public.aircall_calls c
      where c.id = aircall_call_summaries.call_id
    )
  );

create policy "aircall_call_summaries_write_admins" on public.aircall_call_summaries
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_call_sentiments_select_visible_calls" on public.aircall_call_sentiments
  for select using (
    exists (
      select 1
      from public.aircall_calls c
      where c.id = aircall_call_sentiments.call_id
    )
  );

create policy "aircall_call_sentiments_write_admins" on public.aircall_call_sentiments
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_call_topics_select_visible_calls" on public.aircall_call_topics
  for select using (
    exists (
      select 1
      from public.aircall_calls c
      where c.id = aircall_call_topics.call_id
    )
  );

create policy "aircall_call_topics_write_admins" on public.aircall_call_topics
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_call_action_items_select_visible_calls" on public.aircall_call_action_items
  for select using (
    exists (
      select 1
      from public.aircall_calls c
      where c.id = aircall_call_action_items.call_id
    )
  );

create policy "aircall_call_action_items_write_admins" on public.aircall_call_action_items
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));

create policy "aircall_call_evaluations_select_visible_calls" on public.aircall_call_evaluations
  for select using (
    exists (
      select 1
      from public.aircall_calls c
      where c.id = aircall_call_evaluations.call_id
    )
  );

create policy "aircall_call_evaluations_write_admins" on public.aircall_call_evaluations
  for all using (public.is_operational_admin(organization_id))
  with check (public.is_operational_admin(organization_id));
