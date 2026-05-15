-- Only PaceOps email addresses can bootstrap a CRM workspace.
create or replace function public.bootstrap_current_user(user_email text, user_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_organization_id uuid;
  new_organization_id uuid;
  base_slug text;
  final_slug text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if lower(coalesce(user_email, '')) not like '%@paceops.com' then
    raise exception 'Only @paceops.com email addresses can access this CRM';
  end if;

  select u.organization_id
  into existing_organization_id
  from public.users u
  where u.id = current_user_id
  limit 1;

  if existing_organization_id is not null then
    return existing_organization_id;
  end if;

  base_slug := lower(regexp_replace(coalesce(split_part(user_email, '@', 2), 'workspace'), '[^[:alnum:]]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'workspace';
  end if;
  final_slug := base_slug || '-' || left(current_user_id::text, 8);

  insert into public.organizations (
    name,
    slug,
    status,
    plan_key,
    seat_limit,
    billing_email
  )
  values (
    initcap(replace(base_slug, '-', ' ')),
    final_slug,
    'trialing',
    'starter',
    5,
    user_email
  )
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
    coalesce(nullif(user_display_name, ''), split_part(user_email, '@', 1), 'Workspace user'),
    'org_owner'
  );

  return new_organization_id;
end;
$$;
