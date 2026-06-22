create or replace function public.aircall_normalized_name(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(value, ''))), '[^a-z0-9]+', '', 'g')
$$;

create or replace function public.sync_user_aircall_identity(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user public.users%rowtype;
  candidate_name text;
  matched_aircall_row_id uuid;
  matched_aircall_user_id text;
  matched_count integer := 0;
  resolved_match_reason text;
  resolved_match_confidence numeric(5,2);
begin
  select *
  into target_user
  from public.users u
  where u.id = target_user_id
  limit 1;

  if target_user.id is null or target_user.organization_id is null then
    return null;
  end if;

  if nullif(trim(coalesce(target_user.aircall_user_id, '')), '') is not null then
    matched_aircall_user_id := target_user.aircall_user_id;

    if exists (
      select 1
      from public.aircall_users au
      where au.organization_id = target_user.organization_id
        and au.aircall_user_id = matched_aircall_user_id
        and au.linked_user_id is not null
        and au.linked_user_id <> target_user.id
    ) then
      return null;
    end if;

    update public.aircall_users au
    set
      linked_user_id = target_user.id,
      match_status = case
        when au.linked_user_id is null or au.linked_user_id = target_user.id then 'auto_matched'
        else au.match_status
      end,
      match_reason = case
        when au.linked_user_id is null or au.linked_user_id = target_user.id then 'users.aircall_user_id'
        else au.match_reason
      end,
      match_confidence = case
        when au.linked_user_id is null or au.linked_user_id = target_user.id then 1
        else au.match_confidence
      end,
      updated_at = now()
    where au.organization_id = target_user.organization_id
      and au.aircall_user_id = matched_aircall_user_id
      and (au.linked_user_id is null or au.linked_user_id = target_user.id);
  else
    if nullif(trim(coalesce(target_user.email, '')), '') is not null then
      select au.id, au.aircall_user_id, count(*) over ()
      into matched_aircall_row_id, matched_aircall_user_id, matched_count
      from public.aircall_users au
      where au.organization_id = target_user.organization_id
        and lower(au.email) = lower(target_user.email)
        and (au.linked_user_id is null or au.linked_user_id = target_user.id)
      limit 1;

      if matched_count = 1 then
        resolved_match_reason := 'email';
        resolved_match_confidence := 1;
      else
        matched_aircall_row_id := null;
        matched_aircall_user_id := null;
        matched_count := 0;
      end if;
    end if;

    if matched_aircall_user_id is null then
      candidate_name := public.aircall_normalized_name(
        coalesce(
          target_user.display_name,
          trim(concat_ws(' ', target_user.first_name, target_user.last_name)),
          split_part(target_user.email, '@', 1)
        )
      );

      if candidate_name <> '' then
        select au.id, au.aircall_user_id, count(*) over ()
        into matched_aircall_row_id, matched_aircall_user_id, matched_count
        from public.aircall_users au
        where au.organization_id = target_user.organization_id
          and (au.linked_user_id is null or au.linked_user_id = target_user.id)
          and public.aircall_normalized_name(
            coalesce(
              au.name,
              trim(concat_ws(' ', au.first_name, au.last_name)),
              split_part(au.email, '@', 1)
            )
          ) = candidate_name
        limit 1;

        if matched_count = 1 then
          resolved_match_reason := 'exact_name';
          resolved_match_confidence := 0.85;
        else
          matched_aircall_row_id := null;
          matched_aircall_user_id := null;
        end if;
      end if;
    end if;

    if matched_aircall_user_id is not null then
      update public.users u
      set
        aircall_user_id = matched_aircall_user_id,
        updated_at = now()
      where u.id = target_user.id
        and u.organization_id = target_user.organization_id
        and nullif(trim(coalesce(u.aircall_user_id, '')), '') is null;

      update public.aircall_users au
      set
        linked_user_id = target_user.id,
        match_status = 'auto_matched',
        match_reason = resolved_match_reason,
        match_confidence = resolved_match_confidence,
        updated_at = now()
      where au.id = matched_aircall_row_id
        and (au.linked_user_id is null or au.linked_user_id = target_user.id);
    end if;
  end if;

  if matched_aircall_user_id is not null then
    update public.aircall_calls c
    set
      user_id = target_user.id,
      updated_at = now()
    where c.organization_id = target_user.organization_id
      and c.aircall_user_id = matched_aircall_user_id
      and c.user_id is null;

    update public.aircall_call_action_items ai
    set
      assignee_user_id = target_user.id,
      updated_at = now()
    where ai.organization_id = target_user.organization_id
      and ai.assignee_aircall_user_id = matched_aircall_user_id
      and ai.assignee_user_id is null;
  end if;

  return matched_aircall_user_id;
end;
$$;

revoke all on function public.sync_user_aircall_identity(uuid) from public;
grant execute on function public.sync_user_aircall_identity(uuid) to service_role;

create or replace function public.auto_link_user_aircall_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_user_aircall_identity(new.id);
  return new;
end;
$$;

revoke all on function public.auto_link_user_aircall_identity() from public;

drop trigger if exists auto_link_user_aircall_identity on public.users;
create trigger auto_link_user_aircall_identity
after insert or update of organization_id, email, display_name, first_name, last_name, aircall_user_id
on public.users
for each row
when (pg_trigger_depth() < 2)
execute function public.auto_link_user_aircall_identity();

do $$
declare
  user_record record;
begin
  for user_record in
    select u.id
    from public.users u
    where u.organization_id is not null
  loop
    perform public.sync_user_aircall_identity(user_record.id);
  end loop;
end $$;
