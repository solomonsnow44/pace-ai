


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE TYPE "public"."activity_direction" AS ENUM (
    'inbound',
    'outbound',
    'internal'
);


ALTER TYPE "public"."activity_direction" OWNER TO "postgres";


CREATE TYPE "public"."activity_type" AS ENUM (
    'call',
    'email',
    'meeting',
    'note',
    'task',
    'linkedin',
    'sms',
    'import',
    'enrichment',
    'ai',
    'sync',
    'other'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."association_object_type" AS ENUM (
    'company',
    'contact',
    'deal',
    'activity',
    'task',
    'note',
    'file',
    'list',
    'campaign'
);


ALTER TYPE "public"."association_object_type" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status" AS ENUM (
    'draft',
    'active',
    'paused',
    'completed',
    'archived'
);


ALTER TYPE "public"."campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."company_type" AS ENUM (
    'prospect',
    'customer',
    'partner',
    'vendor',
    'competitor',
    'other'
);


ALTER TYPE "public"."company_type" OWNER TO "postgres";


CREATE TYPE "public"."contact_status" AS ENUM (
    'active',
    'inactive',
    'do_not_contact',
    'bounced',
    'unsubscribed',
    'archived'
);


ALTER TYPE "public"."contact_status" OWNER TO "postgres";


CREATE TYPE "public"."custom_property_object_type" AS ENUM (
    'company',
    'contact',
    'deal',
    'activity',
    'task',
    'client',
    'workspace'
);


ALTER TYPE "public"."custom_property_object_type" OWNER TO "postgres";


CREATE TYPE "public"."deal_status" AS ENUM (
    'open',
    'won',
    'lost',
    'archived'
);


ALTER TYPE "public"."deal_status" OWNER TO "postgres";


CREATE TYPE "public"."integration_provider" AS ENUM (
    'hubspot',
    'cognism',
    'aircall',
    'openai',
    'csv',
    'other'
);


ALTER TYPE "public"."integration_provider" OWNER TO "postgres";


CREATE TYPE "public"."job_status" AS ENUM (
    'queued',
    'running',
    'requires_review',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."member_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'member',
    'viewer'
);


ALTER TYPE "public"."member_role" OWNER TO "postgres";


CREATE TYPE "public"."organization_status" AS ENUM (
    'active',
    'trialing',
    'past_due',
    'suspended',
    'cancelled'
);


ALTER TYPE "public"."organization_status" OWNER TO "postgres";


CREATE TYPE "public"."record_status" AS ENUM (
    'active',
    'archived'
);


ALTER TYPE "public"."record_status" OWNER TO "postgres";


CREATE TYPE "public"."suppression_scope" AS ENUM (
    'organization',
    'client',
    'workspace'
);


ALTER TYPE "public"."suppression_scope" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'todo',
    'in_progress',
    'done',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'platform_admin',
    'org_owner',
    'org_admin',
    'manager',
    'member',
    'viewer',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."workspace_role" AS ENUM (
    'admin',
    'editor',
    'viewer'
);


ALTER TYPE "public"."workspace_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bootstrap_current_user"("user_email" "text", "user_display_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."bootstrap_current_user"("user_email" "text", "user_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_client"("target_client_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and c.status = 'active'
      and public.is_org_member(c.organization_id)
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."can_access_client"("target_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select case
    when target_client_id is not null then public.can_access_client(target_client_id)
    else public.is_org_member(target_organization_id)
  end
$$;


ALTER FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select false
$$;


ALTER FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select case
    when target_client_id is not null then public.can_manage_client(target_client_id)
    else public.is_org_member(target_organization_id)
  end
$$;


ALTER FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select false
$$;


ALTER FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_client"("target_client_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and public.is_org_member(c.organization_id)
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."can_manage_client"("target_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select u.role from public.users u where u.id = auth.uid() and u.status = 'active' limit 1
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."default_admin_settings"() RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select jsonb_build_object(
    'cognism_preview_enabled', true,
    'contact_deletion_enabled', false
  )
$$;


ALTER FUNCTION "public"."default_admin_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_default_pipeline"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  declare
    current_user_id uuid := auth.uid();
    current_org_id uuid;
    client_id uuid;
    workspace_id uuid;
    pipeline_id uuid;
  begin
    if current_user_id is null then
      raise exception 'Authentication required';
    end if;

    select organization_id
    into current_org_id
    from public.users
    where id = current_user_id
      and status = 'active';

    if current_org_id is null then
      raise exception 'Active CRM user not found';
    end if;

    select id
    into client_id
    from public.clients
    where organization_id = current_org_id
      and slug = 'default'
    limit 1;

    if client_id is null then
      insert into public.clients (
        organization_id,
        name,
        slug,
        owner_id,
        status,
        settings
      )
      values (
        current_org_id,
        'Default client',
        'default',
        current_user_id,
        'active',
        '{"shared_pipeline": true}'::jsonb
      )
      returning id into client_id;
    end if;

    insert into public.client_members (
      organization_id,
      client_id,
      user_id,
      role
    )
    values (
      current_org_id,
      client_id,
      current_user_id,
      'owner'
    )
    on conflict (client_id, user_id) do nothing;

    select id
    into workspace_id
    from public.workspaces
    where organization_id = current_org_id
      and client_id = client_id
      and slug = 'default'
    limit 1;

    if workspace_id is null then
      insert into public.workspaces (
        organization_id,
        client_id,
        name,
        slug,
        owner_id,
        status,
        settings
      )
      values (
        current_org_id,
        client_id,
        'Default workspace',
        'default',
        current_user_id,
        'active',
        '{"shared_pipeline": true}'::jsonb
      )
      returning id into workspace_id;
    end if;

    insert into public.workspace_members (
      organization_id,
      client_id,
      workspace_id,
      user_id,
      role
    )
    values (
      current_org_id,
      client_id,
      workspace_id,
      current_user_id,
      'admin'
    )
    on conflict (workspace_id, user_id) do nothing;

    select id
    into pipeline_id
    from public.pipelines
    where organization_id = current_org_id
      and client_id = client_id
      and workspace_id = workspace_id
      and is_default = true
    limit 1;

    if pipeline_id is null then
      insert into public.pipelines (
        organization_id,
        client_id,
        workspace_id,
        name,
        is_default,
        status,
        created_by
      )
      values (
        current_org_id,
        client_id,
        workspace_id,
        'Default pipeline',
        true,
        'active',
        current_user_id
      )
      returning id into pipeline_id;
    end if;

    insert into public.pipeline_stages (
      organization_id,
      client_id,
      workspace_id,
      pipeline_id,
      name,
      stage_order,
      probability
    )
    values
      (current_org_id, client_id, workspace_id, pipeline_id, 'Lead In', 1, 10),
      (current_org_id, client_id, workspace_id, pipeline_id, 'Researching', 2, 20),
      (current_org_id, client_id, workspace_id, pipeline_id, 'Contacted', 3, 35),
      (current_org_id, client_id, workspace_id, pipeline_id, 'Meeting', 4, 60),
      (current_org_id, client_id, workspace_id, pipeline_id, 'Qualified', 5, 80)
    on conflict (pipeline_id, stage_order) do nothing;

    return pipeline_id;
  end;
  $$;


ALTER FUNCTION "public"."ensure_default_pipeline"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_settings"("target_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_admin_settings"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shared_pipeline_stages"() RETURNS TABLE("id" "uuid", "stage_key" "text", "name" "text", "stage_order" integer, "probability" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  declare
    pipeline_id uuid;
  begin
    pipeline_id := public.ensure_default_pipeline();

    return query
    select
      ps.id,
      case ps.stage_order
        when 1 then 'lead'
        when 2 then 'researching'
        when 3 then 'contacted'
        when 4 then 'meeting'
        when 5 then 'qualified'
        else 'stage-' || ps.stage_order::text
      end as stage_key,
      ps.name,
      ps.stage_order,
      ps.probability
    from public.pipeline_stages ps
    where ps.pipeline_id = pipeline_id
    order by ps.stage_order;
  end;
  $$;


ALTER FUNCTION "public"."get_shared_pipeline_stages"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_operational_admin"("target_organization_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = target_organization_id
      and u.status = 'active'
      and u.role::text in ('org_owner', 'org_admin', 'admin')
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."is_operational_admin"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("target_organization_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = target_organization_id
      and u.status = 'active'
      and u.role in ('org_owner', 'org_admin')
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."is_org_admin"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("target_organization_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = target_organization_id
      and u.status = 'active'
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."is_org_member"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(public.current_user_role() = 'platform_admin', false)
$$;


ALTER FUNCTION "public"."is_platform_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_settings"("target_organization_id" "uuid", "cognism_preview_enabled" boolean DEFAULT NULL::boolean, "contact_deletion_enabled" boolean DEFAULT NULL::boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."update_admin_settings"("target_organization_id" "uuid", "cognism_preview_enabled" boolean, "contact_deletion_enabled" boolean) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'member'::"public"."user_role" NOT NULL,
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "last_seen_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_current_user_profile"("first_name" "text" DEFAULT ''::"text", "last_name" "text" DEFAULT ''::"text") RETURNS "public"."users"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  declare
    current_user_id uuid := auth.uid();
    clean_first text := nullif(trim(coalesce(first_name, '')), '');
    clean_last text := nullif(trim(coalesce(last_name, '')), '');
    clean_full text := nullif(trim(coalesce(clean_first, '') || ' ' || coalesce(clean_last, '')),
  '');
    updated_user public.users;
  begin
    if current_user_id is null then
      raise exception 'Authentication required';
    end if;

    update public.users
    set
      full_name = clean_full,
      display_name = coalesce(clean_full, display_name, email),
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object(
          'first_name', coalesce(clean_first, ''),
          'last_name', coalesce(clean_last, '')
        ),
      updated_at = now()
    where id = current_user_id
    returning * into updated_user;

    if updated_user.id is null then
      raise exception 'CRM user profile not found';
    end if;

    return updated_user;
  end;
  $$;


ALTER FUNCTION "public"."update_current_user_profile"("first_name" "text", "last_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_shared_pipeline_stages"("stages" "jsonb") RETURNS TABLE("id" "uuid", "stage_key" "text", "name" "text", "stage_order" integer, "probability" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  declare
    pipeline_id uuid;
    stage_count integer;
  begin
    if auth.uid() is null then
      raise exception 'Authentication required';
    end if;

    if jsonb_typeof(stages) <> 'array' then
      raise exception 'Stages must be a JSON array';
    end if;

    pipeline_id := public.ensure_default_pipeline();

    create temporary table tmp_stage_updates (
      stage_order integer primary key,
      stage_key text not null,
      name text not null
    ) on commit drop;

    insert into tmp_stage_updates (stage_order, stage_key, name)
    select
      case item->>'id'
        when 'lead' then 1
        when 'researching' then 2
        when 'contacted' then 3
        when 'meeting' then 4
        when 'qualified' then 5
        else null
      end,
      item->>'id',
      nullif(trim(item->>'name'), '')
    from jsonb_array_elements(stages) item;

    delete from tmp_stage_updates
    where stage_order is null
       or name is null;

    select count(*) into stage_count from tmp_stage_updates;

    if stage_count <> 5 then
      raise exception 'All five default stages are required';
    end if;

    if exists (
      select 1
      from tmp_stage_updates
      group by lower(name)
      having count(*) > 1
    ) then
      raise exception 'Stage names must be unique';
    end if;

    -- Avoid unique (pipeline_id, name) conflicts when swapping names.
    update public.pipeline_stages ps
    set name = 'tmp-' || ps.id::text,
        updated_at = now()
    where ps.pipeline_id = pipeline_id;

    update public.pipeline_stages ps
    set name = tsu.name,
        updated_at = now()
    from tmp_stage_updates tsu
    where ps.pipeline_id = pipeline_id
      and ps.stage_order = tsu.stage_order;

    return query
    select *
    from public.get_shared_pipeline_stages();
  end;
  $$;


ALTER FUNCTION "public"."update_shared_pipeline_stages"("stages" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "campaign_id" "uuid",
    "company_id" "uuid",
    "contact_id" "uuid",
    "actor_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activities_title_check" CHECK (("length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "activities_type_check" CHECK (("length"(TRIM(BOTH FROM "type")) > 0))
);

ALTER TABLE ONLY "public"."activities" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "object_type" "text",
    "object_id" "uuid",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_targets_check" CHECK ((("company_id" IS NOT NULL) OR ("contact_id" IS NOT NULL))),
    CONSTRAINT "campaign_targets_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'active'::"text", 'contacted'::"text", 'responded'::"text", 'qualified'::"text", 'disqualified'::"text", 'archived'::"text"])))
);

ALTER TABLE ONLY "public"."campaign_targets" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_targets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."campaign_companies" AS
 SELECT "id",
    "organization_id",
    "client_id",
    "campaign_id",
    "company_id",
    "status",
    "metadata",
    "created_at",
    "updated_at"
   FROM "public"."campaign_targets" "ct"
  WHERE ("company_id" IS NOT NULL);


ALTER VIEW "public"."campaign_companies" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."campaign_contacts" AS
 SELECT "id",
    "organization_id",
    "client_id",
    "campaign_id",
    "contact_id",
    "company_id",
    "status",
    "metadata",
    "created_at",
    "updated_at"
   FROM "public"."campaign_targets" "ct"
  WHERE ("contact_id" IS NOT NULL);


ALTER VIEW "public"."campaign_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "channel" "text" DEFAULT 'Outbound'::"text" NOT NULL,
    "description" "text",
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaigns_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text", 'archived'::"text"])))
);

ALTER TABLE ONLY "public"."campaigns" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "owner_id" "uuid",
    "website" "text",
    "industry" "text",
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clients_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "clients_slug_check" CHECK (("length"(TRIM(BOTH FROM "slug")) > 0)),
    CONSTRAINT "clients_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'archived'::"text"])))
);

ALTER TABLE ONLY "public"."clients" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."client_accounts" AS
 SELECT "id",
    "organization_id",
    "name",
    "slug",
    "status",
    "owner_id",
    "website",
    "industry",
    "notes",
    "metadata",
    "created_at",
    "updated_at"
   FROM "public"."clients";


ALTER VIEW "public"."client_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text",
    "domain" "text",
    "website" "text",
    "industry" "text",
    "employee_count" integer,
    "annual_revenue" numeric(18,2),
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "companies_annual_revenue_check" CHECK ((("annual_revenue" IS NULL) OR ("annual_revenue" >= (0)::numeric))),
    CONSTRAINT "companies_employee_count_check" CHECK ((("employee_count" IS NULL) OR ("employee_count" >= 0))),
    CONSTRAINT "companies_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "companies_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'archived'::"text"])))
);

ALTER TABLE ONLY "public"."companies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_private_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "crm_contact_id" "text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contact_private_notes_crm_contact_id_check" CHECK (("length"(TRIM(BOTH FROM "crm_contact_id")) > 0))
);

ALTER TABLE ONLY "public"."contact_private_notes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_private_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "contact_name" "text",
    "first_name" "text",
    "last_name" "text",
    "full_name" "text",
    "company" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "direct_dial" "text",
    "job_title" "text",
    "location" "text",
    "linkedin_url" "text",
    "linkedin_profile_url" "text",
    "manual_email" "text",
    "manual_mobile" "text",
    "manual_direct_dial" "text",
    "source_note" "text",
    "data_source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "confidence" numeric(5,2),
    "cognism_contact_id" "text",
    "normalized_identity_key" "text",
    "lookup_status" "text",
    "lookup_notes" "text",
    "hubspot_contact_id" "text",
    "hubspot_exported_at" timestamp with time zone,
    "hubspot_export_status" "text",
    "hubspot_export_error" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contacts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'archived'::"text"])))
);

ALTER TABLE ONLY "public"."contacts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "provider" "public"."integration_provider" NOT NULL,
    "name" "text" NOT NULL,
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "external_account_id" "text",
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "connected_by" "uuid",
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."integration_connections" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "encrypted_secret" "text" NOT NULL,
    "secret_hint" "text",
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "rotated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."integration_credentials" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "source" "text" DEFAULT 'lead_finder'::"text" NOT NULL,
    "assigned_user_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "leads" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lead_lists_filters_check" CHECK (("jsonb_typeof"("filters") = 'object'::"text")),
    CONSTRAINT "lead_lists_leads_check" CHECK (("jsonb_typeof"("leads") = 'array'::"text")),
    CONSTRAINT "lead_lists_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);

ALTER TABLE ONLY "public"."lead_lists" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_crm_contacts" (
    "id" "uuid",
    "organization_id" "uuid",
    "client_id" "uuid",
    "workspace_id" "uuid",
    "company_id" "uuid",
    "owner_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "job_title" "text",
    "seniority" "text",
    "department" "text",
    "linkedin_url" "text",
    "status" "public"."contact_status",
    "source" "text",
    "data_source" "text",
    "privacy_notice_status" "text",
    "privacy_notice_sent_at" timestamp with time zone,
    "last_contacted_at" timestamp with time zone,
    "external_ids" "jsonb",
    "enrichment" "jsonb",
    "custom_fields" "jsonb",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "direct_dial" "text",
    "normalized_email" "text",
    "normalized_linkedin_url" "text",
    "normalized_full_name" "text",
    "archived_at" timestamp with time zone
);


ALTER TABLE "public"."legacy_crm_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_lead_contact_database" (
    "id" "uuid",
    "organization_id" "uuid",
    "contact_name" "text",
    "first_name" "text",
    "last_name" "text",
    "company" "text",
    "job_title" "text",
    "location" "text",
    "linkedin_profile_url" "text",
    "manual_email" "text",
    "manual_mobile" "text",
    "manual_direct_dial" "text",
    "notes" "text",
    "source_note" "text",
    "data_source" "text",
    "confidence" numeric(5,2),
    "cognism_contact_id" "text",
    "normalized_identity_key" "text",
    "lookup_status" "text",
    "lookup_notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "hubspot_contact_id" "text",
    "hubspot_exported_at" timestamp with time zone,
    "hubspot_export_status" "text",
    "hubspot_export_error" "text",
    "archived_at" timestamp with time zone
);


ALTER TABLE "public"."legacy_lead_contact_database" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "status" "public"."organization_status" DEFAULT 'trialing'::"public"."organization_status" NOT NULL,
    "plan_key" "text" DEFAULT 'starter'::"text" NOT NULL,
    "billing_email" "text",
    "subscription_provider" "text",
    "subscription_customer_id" "text",
    "subscription_id" "text",
    "seat_limit" integer DEFAULT 5 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organizations_seat_limit_check" CHECK (("seat_limit" >= 0))
);

ALTER TABLE ONLY "public"."organizations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."member_role" DEFAULT 'member'::"public"."member_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."team_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "created_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."teams" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_client_id_name_key" UNIQUE ("client_id", "name");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_organization_id_slug_key" UNIQUE ("organization_id", "slug");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_private_notes"
    ADD CONSTRAINT "contact_private_notes_organization_id_crm_contact_id_create_key" UNIQUE ("organization_id", "crm_contact_id", "created_by");



ALTER TABLE ONLY "public"."contact_private_notes"
    ADD CONSTRAINT "contact_private_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_id_organization_id_key" UNIQUE ("id", "organization_id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_id_organization_id_key" UNIQUE ("id", "organization_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_organization_id_name_key" UNIQUE ("organization_id", "name");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_organization_id_key" UNIQUE ("id", "organization_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organization_id_email_key" UNIQUE ("organization_id", "email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "activities_occurred_at_idx" ON "public"."activities" USING "btree" ("occurred_at" DESC);



CREATE INDEX "activities_organization_client_idx" ON "public"."activities" USING "btree" ("organization_id", "client_id");



CREATE INDEX "audit_logs_actor_id_idx" ON "public"."audit_logs" USING "btree" ("actor_id");



CREATE INDEX "audit_logs_object_idx" ON "public"."audit_logs" USING "btree" ("object_type", "object_id");



CREATE INDEX "audit_logs_org_created_at_idx" ON "public"."audit_logs" USING "btree" ("organization_id", "created_at" DESC);



CREATE UNIQUE INDEX "campaign_targets_campaign_company_key" ON "public"."campaign_targets" USING "btree" ("campaign_id", "company_id") WHERE ("company_id" IS NOT NULL);



CREATE UNIQUE INDEX "campaign_targets_campaign_contact_key" ON "public"."campaign_targets" USING "btree" ("campaign_id", "contact_id") WHERE ("contact_id" IS NOT NULL);



CREATE INDEX "campaign_targets_campaign_id_idx" ON "public"."campaign_targets" USING "btree" ("campaign_id");



CREATE INDEX "campaign_targets_company_id_idx" ON "public"."campaign_targets" USING "btree" ("company_id");



CREATE INDEX "campaign_targets_contact_id_idx" ON "public"."campaign_targets" USING "btree" ("contact_id");



CREATE INDEX "campaigns_organization_client_idx" ON "public"."campaigns" USING "btree" ("organization_id", "client_id");



CREATE INDEX "clients_organization_id_idx" ON "public"."clients" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "companies_client_domain_key" ON "public"."companies" USING "btree" ("client_id", "lower"("domain")) WHERE (("domain" IS NOT NULL) AND (TRIM(BOTH FROM "domain") <> ''::"text"));



CREATE UNIQUE INDEX "companies_org_name_key" ON "public"."companies" USING "btree" ("organization_id", "lower"("name"));



CREATE INDEX "companies_organization_client_idx" ON "public"."companies" USING "btree" ("organization_id", "client_id");



CREATE INDEX "contact_private_notes_org_user_idx" ON "public"."contact_private_notes" USING "btree" ("organization_id", "created_by");



CREATE UNIQUE INDEX "contacts_client_email_key" ON "public"."contacts" USING "btree" ("client_id", "lower"("email")) WHERE (("email" IS NOT NULL) AND (TRIM(BOTH FROM "email") <> ''::"text"));



CREATE INDEX "contacts_cognism_contact_id_idx" ON "public"."contacts" USING "btree" ("organization_id", "cognism_contact_id") WHERE (("cognism_contact_id" IS NOT NULL) AND (TRIM(BOTH FROM "cognism_contact_id") <> ''::"text"));



CREATE INDEX "contacts_company_id_idx" ON "public"."contacts" USING "btree" ("company_id");



CREATE UNIQUE INDEX "contacts_identity_key" ON "public"."contacts" USING "btree" ("organization_id", "normalized_identity_key") WHERE (("normalized_identity_key" IS NOT NULL) AND (TRIM(BOTH FROM "normalized_identity_key") <> ''::"text"));



CREATE INDEX "contacts_linkedin_profile_url_idx" ON "public"."contacts" USING "btree" ("organization_id", "lower"("linkedin_profile_url")) WHERE (("linkedin_profile_url" IS NOT NULL) AND (TRIM(BOTH FROM "linkedin_profile_url") <> ''::"text"));



CREATE INDEX "contacts_organization_client_idx" ON "public"."contacts" USING "btree" ("organization_id", "client_id");



CREATE INDEX "integration_connections_org_provider_idx" ON "public"."integration_connections" USING "btree" ("organization_id", "provider", "name");



CREATE INDEX "integration_credentials_connection_id_idx" ON "public"."integration_credentials" USING "btree" ("connection_id");



CREATE INDEX "lead_lists_assigned_user_ids_idx" ON "public"."lead_lists" USING "gin" ("assigned_user_ids");



CREATE INDEX "lead_lists_created_at_idx" ON "public"."lead_lists" USING "btree" ("created_at" DESC);



CREATE INDEX "lead_lists_created_by_idx" ON "public"."lead_lists" USING "btree" ("created_by");



CREATE INDEX "lead_lists_organization_id_idx" ON "public"."lead_lists" USING "btree" ("organization_id");



CREATE INDEX "team_members_team_id_idx" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "team_members_user_id_idx" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "teams_organization_id_idx" ON "public"."teams" USING "btree" ("organization_id");



CREATE INDEX "users_email_idx" ON "public"."users" USING "btree" ("email");



CREATE INDEX "users_organization_id_idx" ON "public"."users" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "set_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_campaign_targets_updated_at" BEFORE UPDATE ON "public"."campaign_targets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_campaigns_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_contact_private_notes_updated_at" BEFORE UPDATE ON "public"."contact_private_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_integration_connections_updated_at" BEFORE UPDATE ON "public"."integration_connections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_integration_credentials_updated_at" BEFORE UPDATE ON "public"."integration_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_lead_lists_updated_at" BEFORE UPDATE ON "public"."lead_lists" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_private_notes"
    ADD CONSTRAINT "contact_private_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_private_notes"
    ADD CONSTRAINT "contact_private_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_connected_by_fkey" FOREIGN KEY ("connected_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_connection_scope_fkey" FOREIGN KEY ("connection_id", "organization_id") REFERENCES "public"."integration_connections"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_scope_fkey" FOREIGN KEY ("team_id", "organization_id") REFERENCES "public"."teams"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_scope_fkey" FOREIGN KEY ("user_id", "organization_id") REFERENCES "public"."users"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_members_all" ON "public"."activities" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_insert_members" ON "public"."audit_logs" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id"));



CREATE POLICY "audit_logs_select_admins" ON "public"."audit_logs" FOR SELECT USING ("public"."is_org_admin"("organization_id"));



ALTER TABLE "public"."campaign_targets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_targets_members_all" ON "public"."campaign_targets" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_members_all" ON "public"."campaigns" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_members_all" ON "public"."clients" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_members_all" ON "public"."companies" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."contact_private_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_private_notes_delete_own" ON "public"."contact_private_notes" FOR DELETE USING (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "contact_private_notes_insert_own" ON "public"."contact_private_notes" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "contact_private_notes_select_own" ON "public"."contact_private_notes" FOR SELECT USING (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "contact_private_notes_update_own" ON "public"."contact_private_notes" FOR UPDATE USING (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"()))) WITH CHECK (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_members_all" ON "public"."contacts" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."integration_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_connections_select" ON "public"."integration_connections" FOR SELECT USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "integration_connections_write" ON "public"."integration_connections" USING ("public"."is_org_member"("organization_id")) WITH CHECK ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."integration_credentials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_credentials_service_only" ON "public"."integration_credentials" USING (false) WITH CHECK (false);



ALTER TABLE "public"."lead_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_lists_delete_owners" ON "public"."lead_lists" FOR DELETE USING (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))));



CREATE POLICY "lead_lists_insert_members" ON "public"."lead_lists" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "lead_lists_select_assigned" ON "public"."lead_lists" FOR SELECT USING (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR ("auth"."uid"() = ANY ("assigned_user_ids")) OR "public"."is_org_admin"("organization_id"))));



CREATE POLICY "lead_lists_update_owners" ON "public"."lead_lists" FOR UPDATE USING (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id")))) WITH CHECK (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))));



ALTER TABLE "public"."legacy_crm_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legacy_lead_contact_database" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_select_members" ON "public"."organizations" FOR SELECT USING ("public"."is_org_member"("id"));



CREATE POLICY "organizations_update_admins" ON "public"."organizations" FOR UPDATE USING ("public"."is_org_admin"("id")) WITH CHECK ("public"."is_org_admin"("id"));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_select_org_members" ON "public"."team_members" FOR SELECT USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "team_members_write_org_admins" ON "public"."team_members" USING ("public"."is_org_admin"("organization_id")) WITH CHECK ("public"."is_org_admin"("organization_id"));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_select_org_members" ON "public"."teams" FOR SELECT USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "teams_write_org_admins" ON "public"."teams" USING ("public"."is_org_admin"("organization_id")) WITH CHECK ("public"."is_org_admin"("organization_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_admins" ON "public"."users" FOR INSERT WITH CHECK (("public"."is_org_admin"("organization_id") OR ("id" = "auth"."uid"())));



CREATE POLICY "users_select_org_members" ON "public"."users" FOR SELECT USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "users_update_self_or_admins" ON "public"."users" FOR UPDATE USING ((("id" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id")));



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."bootstrap_current_user"("user_email" "text", "user_display_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."bootstrap_current_user"("user_email" "text", "user_display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bootstrap_current_user"("user_email" "text", "user_display_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_client"("target_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_client"("target_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_client"("target_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_manage_client"("target_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_client"("target_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_client"("target_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."default_admin_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."default_admin_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."default_admin_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_default_pipeline"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_default_pipeline"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_default_pipeline"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_settings"("target_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_settings"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_settings"("target_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shared_pipeline_stages"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_shared_pipeline_stages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_pipeline_stages"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_operational_admin"("target_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_operational_admin"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_operational_admin"("target_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("target_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("target_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member"("target_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"("target_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_settings"("target_organization_id" "uuid", "cognism_preview_enabled" boolean, "contact_deletion_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_settings"("target_organization_id" "uuid", "cognism_preview_enabled" boolean, "contact_deletion_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_settings"("target_organization_id" "uuid", "cognism_preview_enabled" boolean, "contact_deletion_enabled" boolean) TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_current_user_profile"("first_name" "text", "last_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_current_user_profile"("first_name" "text", "last_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_current_user_profile"("first_name" "text", "last_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_shared_pipeline_stages"("stages" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_shared_pipeline_stages"("stages" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_shared_pipeline_stages"("stages" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_targets" TO "anon";
GRANT ALL ON TABLE "public"."campaign_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_targets" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_companies" TO "anon";
GRANT ALL ON TABLE "public"."campaign_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_companies" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_contacts" TO "anon";
GRANT ALL ON TABLE "public"."campaign_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."client_accounts" TO "anon";
GRANT ALL ON TABLE "public"."client_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."contact_private_notes" TO "anon";
GRANT ALL ON TABLE "public"."contact_private_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_private_notes" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."integration_connections" TO "anon";
GRANT ALL ON TABLE "public"."integration_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_connections" TO "service_role";



GRANT ALL ON TABLE "public"."integration_credentials" TO "anon";
GRANT ALL ON TABLE "public"."integration_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."lead_lists" TO "anon";
GRANT ALL ON TABLE "public"."lead_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_lists" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_crm_contacts" TO "anon";
GRANT ALL ON TABLE "public"."legacy_crm_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_crm_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_lead_contact_database" TO "anon";
GRANT ALL ON TABLE "public"."legacy_lead_contact_database" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_lead_contact_database" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




