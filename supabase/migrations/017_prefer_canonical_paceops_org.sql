-- Prefer the canonical PaceOps organization over older personal/org anchors.
-- The previous bootstrap could select an older organization with
-- metadata.company_workspace = 'paceops' before the canonical slug = 'paceops'
-- record, leaving users attached to an empty CRM dataset.
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

  select o.id
  into company_organization_id
  from public.organizations o
  where o.slug = 'paceops'
     or o.metadata ->> 'company_workspace' = 'paceops'
  order by
    case when o.slug = 'paceops' then 0 else 1 end,
    case when o.metadata ? 'crm_data' then 0 else 1 end,
    case when o.metadata ->> 'company_workspace' = 'paceops' then 0 else 1 end,
    o.created_at asc
  limit 1;

  if company_organization_id is null then
    select o.id
    into company_organization_id
    from public.organizations o
    where exists (
      select 1
      from public.users u
      where u.organization_id = o.id
        and lower(u.email) like '%@paceops.com'
    )
    order by
      case when o.slug = 'paceops' then 0 else 1 end,
      case when o.metadata ? 'crm_data' then 0 else 1 end,
      o.created_at asc
    limit 1;
  end if;

  if company_organization_id is null then
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
    returning id into company_organization_id;
  else
    update public.organizations
    set
      name = case when slug = 'paceops' then 'PaceOps' else coalesce(nullif(name, ''), 'PaceOps') end,
      metadata = metadata || jsonb_build_object('company_workspace', 'paceops'),
      updated_at = now()
    where id = company_organization_id;
  end if;

  if existing_user.id is not null then
    update public.users
    set
      organization_id = company_organization_id,
      email = user_email,
      display_name = coalesce(nullif(display_name, ''), user_display),
      status = 'active',
      updated_at = now()
    where id = current_user_id;

    return company_organization_id;
  end if;

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
    'member'
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    email = excluded.email,
    display_name = excluded.display_name,
    status = 'active',
    updated_at = now();

  return company_organization_id;
end;
$$;

do $$
declare
  company_organization_id uuid;
begin
  select o.id
  into company_organization_id
  from public.organizations o
  where o.slug = 'paceops'
     or o.metadata ->> 'company_workspace' = 'paceops'
  order by
    case when o.slug = 'paceops' then 0 else 1 end,
    case when o.metadata ? 'crm_data' then 0 else 1 end,
    case when o.metadata ->> 'company_workspace' = 'paceops' then 0 else 1 end,
    o.created_at asc
  limit 1;

  if company_organization_id is not null then
    update public.organizations
    set
      name = case when slug = 'paceops' then 'PaceOps' else coalesce(nullif(name, ''), 'PaceOps') end,
      metadata = metadata || jsonb_build_object('company_workspace', 'paceops'),
      updated_at = now()
    where id = company_organization_id;

    update public.users
    set
      organization_id = company_organization_id,
      status = 'active',
      updated_at = now()
    where lower(email) like '%@paceops.com';
  end if;
end;
$$;
