create or replace function public.update_workspace_user_role(
  target_user_id uuid,
  next_role text
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  display_name text,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users%rowtype;
  target public.users%rowtype;
  normalized_role text := lower(trim(coalesce(next_role, '')));
begin
  if normalized_role not in ('member', 'admin', 'org_admin') then
    raise exception 'Workspace role must be member, admin, or org_admin.';
  end if;

  select *
  into actor
  from public.users u
  where u.id = auth.uid()
    and u.status = 'active'
  limit 1;

  if actor.id is null or actor.role not in ('platform_admin', 'org_owner', 'org_admin', 'admin') then
    raise exception 'Admin access is required.';
  end if;

  if target_user_id = actor.id then
    raise exception 'You cannot change your own admin access.';
  end if;

  select *
  into target
  from public.users u
  where u.id = target_user_id
    and u.organization_id = actor.organization_id
  limit 1;

  if target.id is null then
    raise exception 'Workspace user was not found.';
  end if;

  if target.role in ('platform_admin', 'org_owner') then
    raise exception 'Workspace owners and platform admins cannot be changed here.';
  end if;

  if actor.role not in ('platform_admin', 'org_owner', 'org_admin') and normalized_role = 'org_admin' then
    raise exception 'Only org admins can assign org admin access.';
  end if;

  if actor.role not in ('platform_admin', 'org_owner', 'org_admin') and target.role = 'org_admin' then
    raise exception 'Only org admins can change org admin access.';
  end if;

  return query
  update public.users u
  set
    role = normalized_role::public.user_role,
    updated_at = now()
  where u.id = target.id
    and u.organization_id = actor.organization_id
  returning
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.display_name,
    u.role::text,
    u.status::text;
end;
$$;

grant execute on function public.update_workspace_user_role(uuid, text) to authenticated;
