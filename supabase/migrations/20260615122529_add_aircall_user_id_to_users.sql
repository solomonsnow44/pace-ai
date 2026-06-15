alter table public.users
  add column if not exists first_name text;

alter table public.users
  add column if not exists last_name text;

alter table public.users
  add column if not exists aircall_user_id text;

alter table public.users
  add column if not exists currency_code text not null default 'GBP';

alter table public.users
  drop constraint if exists users_currency_code_check;

alter table public.users
  add constraint users_currency_code_check
  check (currency_code in ('EUR', 'GBP', 'USD'));

update public.users u
set
  first_name = coalesce(nullif(trim(au.raw_user_meta_data ->> 'first_name'), ''), u.first_name),
  last_name = coalesce(nullif(trim(au.raw_user_meta_data ->> 'last_name'), ''), u.last_name),
  display_name = coalesce(
    nullif(trim(concat_ws(' ', nullif(trim(au.raw_user_meta_data ->> 'first_name'), ''), nullif(trim(au.raw_user_meta_data ->> 'last_name'), ''))), ''),
    nullif(trim(au.raw_user_meta_data ->> 'display_name'), ''),
    u.display_name
  ),
  aircall_user_id = coalesce(nullif(trim(au.raw_user_meta_data ->> 'aircallUserId'), ''), u.aircall_user_id),
  updated_at = now()
from auth.users au
where au.id = u.id
  and (
    (nullif(trim(au.raw_user_meta_data ->> 'first_name'), '') is not null and u.first_name is null)
    or (nullif(trim(au.raw_user_meta_data ->> 'last_name'), '') is not null and u.last_name is null)
    or (nullif(trim(au.raw_user_meta_data ->> 'aircallUserId'), '') is not null and u.aircall_user_id is null)
    or u.display_name is null
  );

create index if not exists users_aircall_user_id_idx
  on public.users (aircall_user_id)
  where aircall_user_id is not null;

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
  email_local_part text := split_part(coalesce(user_email, ''), '@', 1);
  email_name_parts text[];
  derived_first_name text;
  derived_last_name text;
  user_display text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_email not like '%@paceops.com' then
    raise exception 'Only @paceops.com email addresses can access this CRM';
  end if;

  email_name_parts := regexp_split_to_array(regexp_replace(email_local_part, '[^[:alnum:]._-]+', '', 'g'), '[._-]+');
  derived_first_name := initcap(coalesce(nullif(email_name_parts[1], ''), ''));
  derived_last_name := initcap(coalesce(nullif(array_to_string(email_name_parts[2:array_upper(email_name_parts, 1)], ' '), ''), ''));
  user_display := coalesce(
    nullif(user_display_name, ''),
    nullif(trim(concat_ws(' ', derived_first_name, derived_last_name)), ''),
    email_local_part,
    'Workspace user'
  );

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
      first_name = coalesce(nullif(first_name, ''), derived_first_name),
      last_name = coalesce(nullif(last_name, ''), derived_last_name),
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
    first_name,
    last_name,
    display_name,
    role
  )
  values (
    current_user_id,
    company_organization_id,
    user_email,
    derived_first_name,
    derived_last_name,
    user_display,
    'member'
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    email = excluded.email,
    first_name = coalesce(nullif(public.users.first_name, ''), excluded.first_name),
    last_name = coalesce(nullif(public.users.last_name, ''), excluded.last_name),
    display_name = coalesce(nullif(public.users.display_name, ''), excluded.display_name),
    status = 'active',
    updated_at = now();

  return company_organization_id;
end;
$$;
