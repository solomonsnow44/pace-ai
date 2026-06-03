-- Operational admins can manage CRM records without becoming organization admins.
create or replace function public.is_operational_admin(target_organization_id uuid)
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
      and u.role::text in ('org_owner', 'org_admin', 'admin')
  ) or public.is_platform_admin()
$$;

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
    left join public.client_members cm on cm.client_id = c.id and cm.user_id = auth.uid()
    where c.id = target_client_id
      and c.status = 'active'
      and (public.is_operational_admin(c.organization_id) or cm.id is not null)
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
    left join public.client_members cm on cm.client_id = c.id and cm.user_id = auth.uid()
    where c.id = target_client_id
      and (public.is_operational_admin(c.organization_id) or cm.role in ('owner', 'admin', 'manager'))
  ) or public.is_platform_admin()
$$;

grant all on function public.is_operational_admin(uuid) to anon;
grant all on function public.is_operational_admin(uuid) to authenticated;
grant all on function public.is_operational_admin(uuid) to service_role;
