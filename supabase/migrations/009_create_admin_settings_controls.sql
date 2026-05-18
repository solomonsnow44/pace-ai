-- Organization admin controls stored in organizations.metadata.

create or replace function public.default_admin_settings()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'cognism_preview_enabled', true,
    'contact_deletion_enabled', false
  )
$$;

create or replace function public.get_admin_settings(target_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  settings jsonb;
begin
  if not public.is_org_member(target_organization_id) then
    raise exception 'Admin settings are not available for this organization.' using errcode = '42501';
  end if;

  select public.default_admin_settings() || coalesce(o.metadata->'admin_settings', '{}'::jsonb)
    into settings
  from public.organizations o
  where o.id = target_organization_id;

  return coalesce(settings, public.default_admin_settings());
end;
$$;

create or replace function public.update_admin_settings(
  target_organization_id uuid,
  cognism_preview_enabled boolean default null,
  contact_deletion_enabled boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  before_settings jsonb;
  after_settings jsonb;
begin
  if not public.is_org_admin(target_organization_id) then
    raise exception 'Admin controls are available to organization admins only.' using errcode = '42501';
  end if;

  select public.default_admin_settings() || coalesce(o.metadata->'admin_settings', '{}'::jsonb)
    into before_settings
  from public.organizations o
  where o.id = target_organization_id;

  after_settings := before_settings
    || case when cognism_preview_enabled is null then '{}'::jsonb else jsonb_build_object('cognism_preview_enabled', cognism_preview_enabled) end
    || case when contact_deletion_enabled is null then '{}'::jsonb else jsonb_build_object('contact_deletion_enabled', contact_deletion_enabled) end
    || jsonb_build_object('updated_at', now(), 'updated_by', auth.uid());

  update public.organizations
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('admin_settings', after_settings)
  where id = target_organization_id;

  insert into public.audit_logs (organization_id, actor_id, action, object_type, object_id, before_data, after_data)
  values (target_organization_id, auth.uid(), 'admin_settings.updated', 'organization', target_organization_id, before_settings, after_settings);

  return after_settings;
end;
$$;
