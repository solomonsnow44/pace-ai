-- PaceOps is one internal company workspace, not one organization per user.
create or replace function public.bootstrap_current_user(user_email text, user_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_email text := lower(coalesce(user_email, ''));
  existing_user public.users%rowtype;
  company_organization_id uuid;
  new_organization_id uuid;
  user_display text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_email not like '%@paceops.com' then
    raise exception 'Only @paceops.com email addresses can access this CRM';
  end if;

  user_display := coalesce(nullif(user_display_name, ''), split_part(user_email, '@', 1), 'Workspace user');

  select *
  into existing_user
  from public.users u
  where u.id = current_user_id
  limit 1;

  select u.organization_id
  into company_organization_id
  from public.users u
  where lower(u.email) = 'solomon.sonowo@paceops.com'
    and u.status = 'active'
  limit 1;

  if company_organization_id is null then
    select o.id
    into company_organization_id
    from public.organizations o
    where o.slug = 'paceops'
       or o.metadata ->> 'company_workspace' = 'paceops'
    order by o.created_at asc
    limit 1;
  end if;

  if company_organization_id is not null and existing_user.id is not null then
    if existing_user.organization_id <> company_organization_id then
      update public.users
      set
        organization_id = company_organization_id,
        role = case
          when normalized_email = 'solomon.sonowo@paceops.com' then 'org_owner'::public.user_role
          when role in ('platform_admin', 'org_owner', 'org_admin') then 'member'::public.user_role
          else role
        end,
        status = 'active',
        updated_at = now()
      where id = current_user_id;
    end if;

    return company_organization_id;
  end if;

  if company_organization_id is not null then
    insert into public.users (
      id,
      organization_id,
      email,
      display_name,
      role
    )
    values (
      current_user_id,
      company_organization_id,
      user_email,
      user_display,
      case
        when normalized_email = 'solomon.sonowo@paceops.com' then 'org_owner'::public.user_role
        else 'member'::public.user_role
      end
    )
    on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      email = excluded.email,
      display_name = excluded.display_name,
      role = excluded.role,
      status = 'active',
      updated_at = now();

    return company_organization_id;
  end if;

  insert into public.organizations (
    name,
    slug,
    status,
    plan_key,
    seat_limit,
    billing_email,
    metadata
  )
  values (
    'PaceOps',
    'paceops',
    'trialing',
    'starter',
    50,
    user_email,
    jsonb_build_object('company_workspace', 'paceops')
  )
  on conflict (slug) do update
  set
    metadata = public.organizations.metadata || jsonb_build_object('company_workspace', 'paceops'),
    updated_at = now()
  returning id into new_organization_id;

  insert into public.users (
    id,
    organization_id,
    email,
    display_name,
    role
  )
  values (
    current_user_id,
    new_organization_id,
    user_email,
    user_display,
    'org_owner'
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    email = excluded.email,
    display_name = excluded.display_name,
    role = excluded.role,
    status = 'active',
    updated_at = now();

  return new_organization_id;
end;
$$;
