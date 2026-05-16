


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
    'viewer'
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
    existing_organization_id uuid;
    new_organization_id uuid;
    base_slug text;
    final_slug text;
  begin
    if current_user_id is null then
      raise exception 'Authentication required';
    end if;

    select u.organization_id
    into existing_organization_id
    from public.users u
    where u.id = current_user_id
    limit 1;

    if existing_organization_id is not null then
      return existing_organization_id;
    end if;

    base_slug := lower(
      regexp_replace(
        coalesce(split_part(user_email, '@', 2), 'workspace'),
        '[^[:alnum:]]+',
        '-',
        'g'
      )
    );

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


ALTER FUNCTION "public"."bootstrap_current_user"("user_email" "text", "user_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_client"("target_client_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.clients c
    left join public.client_members cm on cm.client_id = c.id and cm.user_id = auth.uid()
    where c.id = target_client_id
      and c.status = 'active'
      and (public.is_org_admin(c.organization_id) or cm.id is not null)
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."can_access_client"("target_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select case
    when target_workspace_id is not null then public.can_access_workspace(target_workspace_id)
    when target_client_id is not null then public.can_access_client(target_client_id)
    else public.is_org_member(target_organization_id)
  end
$$;


ALTER FUNCTION "public"."can_access_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id and wm.user_id = auth.uid()
    where w.id = target_workspace_id
      and w.status = 'active'
      and (public.can_access_client(w.client_id) or wm.id is not null)
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."can_access_workspace"("target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select case
    when target_workspace_id is not null then public.can_edit_workspace(target_workspace_id)
    when target_client_id is not null then public.can_manage_client(target_client_id)
    else public.is_org_admin(target_organization_id)
  end
$$;


ALTER FUNCTION "public"."can_edit_scoped_record"("target_organization_id" "uuid", "target_client_id" "uuid", "target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id and wm.user_id = auth.uid()
    where w.id = target_workspace_id
      and (public.can_manage_client(w.client_id) or wm.role in ('admin', 'editor'))
  ) or public.is_platform_admin()
$$;


ALTER FUNCTION "public"."can_edit_workspace"("target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_client"("target_client_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.clients c
    left join public.client_members cm on cm.client_id = c.id and cm.user_id = auth.uid()
    where c.id = target_client_id
      and (public.is_org_admin(c.organization_id) or cm.role in ('owner', 'admin', 'manager'))
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
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "campaign_id" "uuid",
    "user_id" "uuid",
    "owner_id" "uuid",
    "type" "public"."activity_type" NOT NULL,
    "direction" "public"."activity_direction",
    "subject" "text",
    "body" "text",
    "outcome" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "due_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "duration_seconds" integer,
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activities_duration_seconds_check" CHECK (("duration_seconds" >= 0))
);

ALTER TABLE ONLY "public"."activities" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "company_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "user_id" "uuid",
    "job_type" "text" NOT NULL,
    "provider" "text" DEFAULT 'openai'::"text" NOT NULL,
    "model" "text",
    "status" "public"."job_status" DEFAULT 'queued'::"public"."job_status" NOT NULL,
    "prompt" "text",
    "system_prompt" "text",
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "token_usage" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence" numeric(5,2),
    "warnings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "error_message" "text",
    "source_references" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_jobs_confidence_check" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (100)::numeric))))
);

ALTER TABLE ONLY "public"."ai_jobs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."associations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "from_type" "public"."association_object_type" NOT NULL,
    "from_id" "uuid" NOT NULL,
    "to_type" "public"."association_object_type" NOT NULL,
    "to_id" "uuid" NOT NULL,
    "label" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "associations_check" CHECK ((("from_type" <> "to_type") OR ("from_id" <> "to_id")))
);

ALTER TABLE ONLY "public"."associations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."associations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
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


CREATE TABLE IF NOT EXISTS "public"."campaign_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "last_activity_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_members_check" CHECK ((("company_id" IS NOT NULL) OR ("contact_id" IS NOT NULL)))
);

ALTER TABLE ONLY "public"."campaign_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."campaign_status" DEFAULT 'draft'::"public"."campaign_status" NOT NULL,
    "channel" "text",
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."campaigns" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."member_role" DEFAULT 'member'::"public"."member_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."client_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "owner_id" "uuid",
    "industry" "text",
    "website" "text",
    "billing_email" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."clients" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "domain" "text",
    "website" "text",
    "company_type" "public"."company_type" DEFAULT 'prospect'::"public"."company_type" NOT NULL,
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "industry" "text",
    "employee_count" integer,
    "annual_revenue" numeric(18,2),
    "city" "text",
    "region" "text",
    "country" "text",
    "linkedin_url" "text",
    "phone" "text",
    "source" "text",
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enrichment" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "companies_annual_revenue_check" CHECK (("annual_revenue" >= (0)::numeric)),
    CONSTRAINT "companies_employee_count_check" CHECK (("employee_count" >= 0))
);

ALTER TABLE ONLY "public"."companies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "owner_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "full_name" "text" GENERATED ALWAYS AS (NULLIF(TRIM(BOTH FROM ((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text"))), ''::"text")) STORED,
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "job_title" "text",
    "seniority" "text",
    "department" "text",
    "linkedin_url" "text",
    "status" "public"."contact_status" DEFAULT 'active'::"public"."contact_status" NOT NULL,
    "source" "text",
    "data_source" "text",
    "privacy_notice_status" "text",
    "privacy_notice_sent_at" timestamp with time zone,
    "last_contacted_at" timestamp with time zone,
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enrichment" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."contacts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "object_type" "public"."custom_property_object_type" NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_required" boolean DEFAULT false NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."custom_properties" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_property_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "property_id" "uuid" NOT NULL,
    "object_type" "public"."custom_property_object_type" NOT NULL,
    "object_id" "uuid" NOT NULL,
    "value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."custom_property_values" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_property_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "primary_contact_id" "uuid",
    "owner_id" "uuid",
    "pipeline_id" "uuid",
    "pipeline_stage_id" "uuid",
    "name" "text" NOT NULL,
    "amount" numeric(18,2),
    "currency" character(3) DEFAULT 'GBP'::"bpchar" NOT NULL,
    "status" "public"."deal_status" DEFAULT 'open'::"public"."deal_status" NOT NULL,
    "close_date" "date",
    "won_at" timestamp with time zone,
    "lost_at" timestamp with time zone,
    "lost_reason" "text",
    "source" "text",
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deals_amount_check" CHECK (("amount" >= (0)::numeric))
);

ALTER TABLE ONLY "public"."deals" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrichment_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "provider" "public"."integration_provider" DEFAULT 'cognism'::"public"."integration_provider" NOT NULL,
    "connection_id" "uuid",
    "company_id" "uuid",
    "contact_id" "uuid",
    "status" "public"."job_status" DEFAULT 'queued'::"public"."job_status" NOT NULL,
    "query" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "preview_results" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "selected_results" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "raw_response" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence" numeric(5,2),
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enrichment_jobs_confidence_check" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (100)::numeric))))
);

ALTER TABLE ONLY "public"."enrichment_jobs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrichment_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "provider" "public"."integration_provider" NOT NULL,
    "object_type" "public"."association_object_type" NOT NULL,
    "name" "text" NOT NULL,
    "mapping" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."field_mappings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "uploaded_by" "uuid",
    "bucket" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "checksum" "text",
    "source" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "files_size_bytes_check" CHECK (("size_bytes" >= 0))
);

ALTER TABLE ONLY "public"."files" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "provider" "public"."integration_provider" DEFAULT 'csv'::"public"."integration_provider" NOT NULL,
    "connection_id" "uuid",
    "file_id" "uuid",
    "status" "public"."job_status" DEFAULT 'queued'::"public"."job_status" NOT NULL,
    "dry_run" boolean DEFAULT true NOT NULL,
    "object_type" "public"."association_object_type",
    "total_rows" integer DEFAULT 0 NOT NULL,
    "processed_rows" integer DEFAULT 0 NOT NULL,
    "succeeded_rows" integer DEFAULT 0 NOT NULL,
    "failed_rows" integer DEFAULT 0 NOT NULL,
    "mapping" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "preview" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."import_jobs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
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


CREATE TABLE IF NOT EXISTS "public"."lead_contact_database" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
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
    "source_note" "text" DEFAULT 'Added manually by PaceOps user'::"text" NOT NULL,
    "data_source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "confidence" numeric(5,2) DEFAULT 0.85 NOT NULL,
    "cognism_contact_id" "text",
    "normalized_identity_key" "text" NOT NULL,
    "lookup_status" "text",
    "lookup_notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lead_contact_database_data_source_check" CHECK (("data_source" = ANY (ARRAY['manual'::"text", 'linkedin_manual'::"text", 'paceops_db'::"text", 'imported_csv'::"text", 'cognism_preview'::"text"]))),
    CONSTRAINT "lead_contact_database_normalized_identity_key_check" CHECK (("length"(TRIM(BOTH FROM "normalized_identity_key")) > 0))
);

ALTER TABLE ONLY "public"."lead_contact_database" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_contact_database" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."list_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "list_id" "uuid" NOT NULL,
    "object_type" "public"."association_object_type" NOT NULL,
    "object_id" "uuid" NOT NULL,
    "added_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."list_memberships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."list_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "object_type" "public"."association_object_type" DEFAULT 'contact'::"public"."association_object_type" NOT NULL,
    "is_dynamic" boolean DEFAULT false NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."lists" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "activity_id" "uuid",
    "author_id" "uuid",
    "title" "text",
    "body" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."notes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."pipeline_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "stage_order" integer NOT NULL,
    "probability" integer DEFAULT 0 NOT NULL,
    "is_closed" boolean DEFAULT false NOT NULL,
    "is_won" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pipeline_stages_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100)))
);

ALTER TABLE ONLY "public"."pipeline_stages" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."pipelines" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppression_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "workspace_id" "uuid",
    "scope" "public"."suppression_scope" DEFAULT 'organization'::"public"."suppression_scope" NOT NULL,
    "email" "text",
    "domain" "text",
    "phone" "text",
    "reason" "text" NOT NULL,
    "source" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "suppression_entries_check" CHECK ((("email" IS NOT NULL) OR ("domain" IS NOT NULL) OR ("phone" IS NOT NULL)))
);

ALTER TABLE ONLY "public"."suppression_entries" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppression_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "activity_id" "uuid",
    "owner_id" "uuid",
    "assigned_to" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'todo'::"public"."task_status" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "due_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."tasks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."workspace_role" DEFAULT 'viewer'::"public"."workspace_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."workspace_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "status" "public"."record_status" DEFAULT 'active'::"public"."record_status" NOT NULL,
    "owner_id" "uuid",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."workspaces" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_workspace_id_from_type_from_id_to_type_to_id_l_key" UNIQUE ("workspace_id", "from_type", "from_id", "to_type", "to_id", "label");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_campaign_id_company_id_key" UNIQUE ("campaign_id", "company_id");



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_campaign_id_contact_id_key" UNIQUE ("campaign_id", "contact_id");



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_workspace_id_name_key" UNIQUE ("workspace_id", "name");



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_client_id_user_id_key" UNIQUE ("client_id", "user_id");



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_id_organization_id_key" UNIQUE ("id", "organization_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_organization_id_slug_key" UNIQUE ("organization_id", "slug");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_workspace_id_domain_key" UNIQUE ("workspace_id", "domain");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_workspace_id_email_key" UNIQUE ("workspace_id", "email");



ALTER TABLE ONLY "public"."custom_properties"
    ADD CONSTRAINT "custom_properties_organization_id_client_id_workspace_id_ob_key" UNIQUE ("organization_id", "client_id", "workspace_id", "object_type", "name");



ALTER TABLE ONLY "public"."custom_properties"
    ADD CONSTRAINT "custom_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_property_values"
    ADD CONSTRAINT "custom_property_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_property_values"
    ADD CONSTRAINT "custom_property_values_property_id_object_id_key" UNIQUE ("property_id", "object_id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_mappings"
    ADD CONSTRAINT "field_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_bucket_storage_path_key" UNIQUE ("bucket", "storage_path");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_id_organization_id_key" UNIQUE ("id", "organization_id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_organization_id_client_id_workspace_key" UNIQUE ("organization_id", "client_id", "workspace_id", "provider", "name");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_contact_database"
    ADD CONSTRAINT "lead_contact_database_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_list_id_object_type_object_id_key" UNIQUE ("list_id", "object_type", "object_id");



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_workspace_id_name_key" UNIQUE ("workspace_id", "name");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_name_key" UNIQUE ("pipeline_id", "name");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_stage_order_key" UNIQUE ("pipeline_id", "stage_order");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_id_scope_key" UNIQUE ("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_workspace_id_name_key" UNIQUE ("workspace_id", "name");



ALTER TABLE ONLY "public"."suppression_entries"
    ADD CONSTRAINT "suppression_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_user_id_key" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_client_id_slug_key" UNIQUE ("client_id", "slug");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_id_scope_key" UNIQUE ("id", "organization_id", "client_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "activities_campaign_id_idx" ON "public"."activities" USING "btree" ("campaign_id");



CREATE INDEX "activities_client_id_idx" ON "public"."activities" USING "btree" ("client_id");



CREATE INDEX "activities_company_id_idx" ON "public"."activities" USING "btree" ("company_id");



CREATE INDEX "activities_contact_id_idx" ON "public"."activities" USING "btree" ("contact_id");



CREATE INDEX "activities_created_at_idx" ON "public"."activities" USING "btree" ("created_at");



CREATE INDEX "activities_deal_id_idx" ON "public"."activities" USING "btree" ("deal_id");



CREATE INDEX "activities_occurred_at_idx" ON "public"."activities" USING "btree" ("occurred_at");



CREATE INDEX "activities_type_idx" ON "public"."activities" USING "btree" ("type");



CREATE INDEX "activities_user_id_idx" ON "public"."activities" USING "btree" ("user_id");



CREATE INDEX "activities_workspace_id_idx" ON "public"."activities" USING "btree" ("workspace_id");



CREATE INDEX "ai_jobs_company_id_idx" ON "public"."ai_jobs" USING "btree" ("company_id");



CREATE INDEX "ai_jobs_contact_id_idx" ON "public"."ai_jobs" USING "btree" ("contact_id");



CREATE INDEX "ai_jobs_scope_status_idx" ON "public"."ai_jobs" USING "btree" ("organization_id", "client_id", "workspace_id", "status", "created_at");



CREATE INDEX "associations_from_idx" ON "public"."associations" USING "btree" ("from_type", "from_id");



CREATE INDEX "associations_to_idx" ON "public"."associations" USING "btree" ("to_type", "to_id");



CREATE INDEX "associations_workspace_id_idx" ON "public"."associations" USING "btree" ("workspace_id");



CREATE INDEX "audit_logs_actor_id_idx" ON "public"."audit_logs" USING "btree" ("actor_id");



CREATE INDEX "audit_logs_object_idx" ON "public"."audit_logs" USING "btree" ("object_type", "object_id");



CREATE INDEX "audit_logs_scope_created_at_idx" ON "public"."audit_logs" USING "btree" ("organization_id", "client_id", "workspace_id", "created_at");



CREATE INDEX "campaign_members_campaign_id_idx" ON "public"."campaign_members" USING "btree" ("campaign_id");



CREATE INDEX "campaign_members_company_id_idx" ON "public"."campaign_members" USING "btree" ("company_id");



CREATE INDEX "campaign_members_contact_id_idx" ON "public"."campaign_members" USING "btree" ("contact_id");



CREATE INDEX "campaigns_status_idx" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "campaigns_workspace_id_idx" ON "public"."campaigns" USING "btree" ("workspace_id");



CREATE INDEX "client_members_client_id_idx" ON "public"."client_members" USING "btree" ("client_id");



CREATE INDEX "client_members_user_id_idx" ON "public"."client_members" USING "btree" ("user_id");



CREATE INDEX "clients_organization_id_idx" ON "public"."clients" USING "btree" ("organization_id");



CREATE INDEX "clients_owner_id_idx" ON "public"."clients" USING "btree" ("owner_id");



CREATE INDEX "companies_client_id_idx" ON "public"."companies" USING "btree" ("client_id");



CREATE INDEX "companies_created_at_idx" ON "public"."companies" USING "btree" ("created_at");



CREATE INDEX "companies_domain_idx" ON "public"."companies" USING "btree" ("domain");



CREATE INDEX "companies_name_trgm_idx" ON "public"."companies" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "companies_owner_id_idx" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "companies_status_idx" ON "public"."companies" USING "btree" ("status");



CREATE INDEX "companies_workspace_id_idx" ON "public"."companies" USING "btree" ("workspace_id");



CREATE INDEX "contacts_client_id_idx" ON "public"."contacts" USING "btree" ("client_id");



CREATE INDEX "contacts_company_id_idx" ON "public"."contacts" USING "btree" ("company_id");



CREATE INDEX "contacts_created_at_idx" ON "public"."contacts" USING "btree" ("created_at");



CREATE INDEX "contacts_email_idx" ON "public"."contacts" USING "btree" ("email");



CREATE INDEX "contacts_full_name_trgm_idx" ON "public"."contacts" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "contacts_owner_id_idx" ON "public"."contacts" USING "btree" ("owner_id");



CREATE INDEX "contacts_status_idx" ON "public"."contacts" USING "btree" ("status");



CREATE INDEX "contacts_workspace_id_idx" ON "public"."contacts" USING "btree" ("workspace_id");



CREATE INDEX "custom_properties_scope_idx" ON "public"."custom_properties" USING "btree" ("organization_id", "client_id", "workspace_id", "object_type");



CREATE INDEX "custom_property_values_object_idx" ON "public"."custom_property_values" USING "btree" ("object_type", "object_id");



CREATE INDEX "deals_client_id_idx" ON "public"."deals" USING "btree" ("client_id");



CREATE INDEX "deals_company_id_idx" ON "public"."deals" USING "btree" ("company_id");



CREATE INDEX "deals_created_at_idx" ON "public"."deals" USING "btree" ("created_at");



CREATE INDEX "deals_owner_id_idx" ON "public"."deals" USING "btree" ("owner_id");



CREATE INDEX "deals_pipeline_stage_id_idx" ON "public"."deals" USING "btree" ("pipeline_stage_id");



CREATE INDEX "deals_primary_contact_id_idx" ON "public"."deals" USING "btree" ("primary_contact_id");



CREATE INDEX "deals_status_idx" ON "public"."deals" USING "btree" ("status");



CREATE INDEX "deals_workspace_id_idx" ON "public"."deals" USING "btree" ("workspace_id");



CREATE INDEX "enrichment_jobs_scope_status_idx" ON "public"."enrichment_jobs" USING "btree" ("organization_id", "client_id", "workspace_id", "status", "created_at");



CREATE INDEX "field_mappings_scope_idx" ON "public"."field_mappings" USING "btree" ("organization_id", "client_id", "workspace_id", "provider", "object_type");



CREATE INDEX "files_company_id_idx" ON "public"."files" USING "btree" ("company_id");



CREATE INDEX "files_contact_id_idx" ON "public"."files" USING "btree" ("contact_id");



CREATE INDEX "files_deal_id_idx" ON "public"."files" USING "btree" ("deal_id");



CREATE INDEX "files_workspace_id_idx" ON "public"."files" USING "btree" ("workspace_id");



CREATE INDEX "import_jobs_scope_status_idx" ON "public"."import_jobs" USING "btree" ("organization_id", "client_id", "workspace_id", "status", "created_at");



CREATE INDEX "integration_connections_scope_idx" ON "public"."integration_connections" USING "btree" ("organization_id", "client_id", "workspace_id", "provider");



CREATE INDEX "integration_credentials_connection_id_idx" ON "public"."integration_credentials" USING "btree" ("connection_id");



CREATE INDEX "lead_contact_database_cognism_idx" ON "public"."lead_contact_database" USING "btree" ("organization_id", "cognism_contact_id") WHERE (("cognism_contact_id" IS NOT NULL) AND ("cognism_contact_id" <> ''::"text"));



CREATE INDEX "lead_contact_database_email_idx" ON "public"."lead_contact_database" USING "btree" ("organization_id", "lower"("manual_email")) WHERE (("manual_email" IS NOT NULL) AND ("manual_email" <> ''::"text"));



CREATE UNIQUE INDEX "lead_contact_database_identity_idx" ON "public"."lead_contact_database" USING "btree" ("organization_id", "normalized_identity_key");



CREATE INDEX "lead_contact_database_linkedin_idx" ON "public"."lead_contact_database" USING "btree" ("organization_id", "lower"("linkedin_profile_url")) WHERE (("linkedin_profile_url" IS NOT NULL) AND ("linkedin_profile_url" <> ''::"text"));



CREATE INDEX "lead_contact_database_mobile_idx" ON "public"."lead_contact_database" USING "btree" ("organization_id", "manual_mobile") WHERE (("manual_mobile" IS NOT NULL) AND ("manual_mobile" <> ''::"text"));



CREATE INDEX "lead_contact_database_org_idx" ON "public"."lead_contact_database" USING "btree" ("organization_id");



CREATE INDEX "lead_lists_assigned_user_ids_idx" ON "public"."lead_lists" USING "gin" ("assigned_user_ids");



CREATE INDEX "lead_lists_created_at_idx" ON "public"."lead_lists" USING "btree" ("created_at" DESC);



CREATE INDEX "lead_lists_created_by_idx" ON "public"."lead_lists" USING "btree" ("created_by");



CREATE INDEX "lead_lists_organization_id_idx" ON "public"."lead_lists" USING "btree" ("organization_id");



CREATE INDEX "list_memberships_list_id_idx" ON "public"."list_memberships" USING "btree" ("list_id");



CREATE INDEX "list_memberships_object_idx" ON "public"."list_memberships" USING "btree" ("object_type", "object_id");



CREATE INDEX "lists_workspace_id_idx" ON "public"."lists" USING "btree" ("workspace_id");



CREATE INDEX "notes_company_id_idx" ON "public"."notes" USING "btree" ("company_id");



CREATE INDEX "notes_contact_id_idx" ON "public"."notes" USING "btree" ("contact_id");



CREATE INDEX "notes_deal_id_idx" ON "public"."notes" USING "btree" ("deal_id");



CREATE INDEX "notes_workspace_id_idx" ON "public"."notes" USING "btree" ("workspace_id");



CREATE INDEX "pipeline_stages_pipeline_id_idx" ON "public"."pipeline_stages" USING "btree" ("pipeline_id");



CREATE INDEX "pipelines_workspace_id_idx" ON "public"."pipelines" USING "btree" ("workspace_id");



CREATE INDEX "suppression_entries_domain_idx" ON "public"."suppression_entries" USING "btree" ("domain");



CREATE INDEX "suppression_entries_email_idx" ON "public"."suppression_entries" USING "btree" ("email");



CREATE INDEX "suppression_entries_phone_idx" ON "public"."suppression_entries" USING "btree" ("phone");



CREATE INDEX "suppression_entries_scope_idx" ON "public"."suppression_entries" USING "btree" ("organization_id", "client_id", "workspace_id");



CREATE INDEX "tasks_assigned_to_idx" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "tasks_client_id_idx" ON "public"."tasks" USING "btree" ("client_id");



CREATE INDEX "tasks_company_id_idx" ON "public"."tasks" USING "btree" ("company_id");



CREATE INDEX "tasks_contact_id_idx" ON "public"."tasks" USING "btree" ("contact_id");



CREATE INDEX "tasks_deal_id_idx" ON "public"."tasks" USING "btree" ("deal_id");



CREATE INDEX "tasks_due_at_idx" ON "public"."tasks" USING "btree" ("due_at");



CREATE INDEX "tasks_status_idx" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "tasks_workspace_id_idx" ON "public"."tasks" USING "btree" ("workspace_id");



CREATE INDEX "team_members_team_id_idx" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "team_members_user_id_idx" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "teams_organization_id_idx" ON "public"."teams" USING "btree" ("organization_id");



CREATE INDEX "users_email_idx" ON "public"."users" USING "btree" ("email");



CREATE INDEX "users_organization_id_idx" ON "public"."users" USING "btree" ("organization_id");



CREATE INDEX "workspace_members_user_id_idx" ON "public"."workspace_members" USING "btree" ("user_id");



CREATE INDEX "workspace_members_workspace_id_idx" ON "public"."workspace_members" USING "btree" ("workspace_id");



CREATE INDEX "workspaces_client_id_idx" ON "public"."workspaces" USING "btree" ("client_id");



CREATE INDEX "workspaces_owner_id_idx" ON "public"."workspaces" USING "btree" ("owner_id");



CREATE OR REPLACE TRIGGER "set_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_ai_jobs_updated_at" BEFORE UPDATE ON "public"."ai_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_associations_updated_at" BEFORE UPDATE ON "public"."associations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_campaign_members_updated_at" BEFORE UPDATE ON "public"."campaign_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_campaigns_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_client_members_updated_at" BEFORE UPDATE ON "public"."client_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_custom_properties_updated_at" BEFORE UPDATE ON "public"."custom_properties" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_custom_property_values_updated_at" BEFORE UPDATE ON "public"."custom_property_values" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_enrichment_jobs_updated_at" BEFORE UPDATE ON "public"."enrichment_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_field_mappings_updated_at" BEFORE UPDATE ON "public"."field_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_files_updated_at" BEFORE UPDATE ON "public"."files" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_import_jobs_updated_at" BEFORE UPDATE ON "public"."import_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_integration_connections_updated_at" BEFORE UPDATE ON "public"."integration_connections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_integration_credentials_updated_at" BEFORE UPDATE ON "public"."integration_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_lead_contact_database_updated_at" BEFORE UPDATE ON "public"."lead_contact_database" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_lead_lists_updated_at" BEFORE UPDATE ON "public"."lead_lists" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_list_memberships_updated_at" BEFORE UPDATE ON "public"."list_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_lists_updated_at" BEFORE UPDATE ON "public"."lists" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_notes_updated_at" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_pipeline_stages_updated_at" BEFORE UPDATE ON "public"."pipeline_stages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_pipelines_updated_at" BEFORE UPDATE ON "public"."pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_suppression_entries_updated_at" BEFORE UPDATE ON "public"."suppression_entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspace_members_updated_at" BEFORE UPDATE ON "public"."workspace_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspaces_updated_at" BEFORE UPDATE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_campaign_scope_fkey" FOREIGN KEY ("campaign_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."campaigns"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_scope_fkey" FOREIGN KEY ("contact_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."contacts"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_deal_scope_fkey" FOREIGN KEY ("deal_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."deals"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_jobs"
    ADD CONSTRAINT "ai_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."associations"
    ADD CONSTRAINT "associations_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_campaign_scope_fkey" FOREIGN KEY ("campaign_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."campaigns"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_contact_scope_fkey" FOREIGN KEY ("contact_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."contacts"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_members"
    ADD CONSTRAINT "campaign_members_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_client_scope_fkey" FOREIGN KEY ("client_id", "organization_id") REFERENCES "public"."clients"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_user_scope_fkey" FOREIGN KEY ("user_id", "organization_id") REFERENCES "public"."users"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_properties"
    ADD CONSTRAINT "custom_properties_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_properties"
    ADD CONSTRAINT "custom_properties_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."custom_properties"
    ADD CONSTRAINT "custom_properties_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_properties"
    ADD CONSTRAINT "custom_properties_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_property_values"
    ADD CONSTRAINT "custom_property_values_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_property_values"
    ADD CONSTRAINT "custom_property_values_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_property_values"
    ADD CONSTRAINT "custom_property_values_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_property_values"
    ADD CONSTRAINT "custom_property_values_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pipeline_scope_fkey" FOREIGN KEY ("pipeline_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."pipelines"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pipeline_stage_id_fkey" FOREIGN KEY ("pipeline_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pipeline_stage_scope_fkey" FOREIGN KEY ("pipeline_stage_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."pipeline_stages"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_primary_contact_id_fkey" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_primary_contact_scope_fkey" FOREIGN KEY ("primary_contact_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."contacts"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_mappings"
    ADD CONSTRAINT "field_mappings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_mappings"
    ADD CONSTRAINT "field_mappings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_mappings"
    ADD CONSTRAINT "field_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_mappings"
    ADD CONSTRAINT "field_mappings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_contact_scope_fkey" FOREIGN KEY ("contact_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."contacts"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_deal_scope_fkey" FOREIGN KEY ("deal_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."deals"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_connected_by_fkey" FOREIGN KEY ("connected_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_connection_scope_fkey" FOREIGN KEY ("connection_id", "organization_id") REFERENCES "public"."integration_connections"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_contact_database"
    ADD CONSTRAINT "lead_contact_database_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_contact_database"
    ADD CONSTRAINT "lead_contact_database_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_contact_database"
    ADD CONSTRAINT "lead_contact_database_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_lists"
    ADD CONSTRAINT "lead_lists_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_list_scope_fkey" FOREIGN KEY ("list_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."lists"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_memberships"
    ADD CONSTRAINT "list_memberships_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_activity_scope_fkey" FOREIGN KEY ("activity_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."activities"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_contact_scope_fkey" FOREIGN KEY ("contact_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."contacts"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_deal_scope_fkey" FOREIGN KEY ("deal_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."deals"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_scope_fkey" FOREIGN KEY ("pipeline_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."pipelines"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppression_entries"
    ADD CONSTRAINT "suppression_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppression_entries"
    ADD CONSTRAINT "suppression_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suppression_entries"
    ADD CONSTRAINT "suppression_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppression_entries"
    ADD CONSTRAINT "suppression_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_activity_scope_fkey" FOREIGN KEY ("activity_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."activities"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_company_scope_fkey" FOREIGN KEY ("company_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."companies"("id", "organization_id", "client_id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_contact_scope_fkey" FOREIGN KEY ("contact_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."contacts"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_deal_scope_fkey" FOREIGN KEY ("deal_id", "organization_id", "client_id", "workspace_id") REFERENCES "public"."deals"("id", "organization_id", "client_id", "workspace_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_scope_fkey" FOREIGN KEY ("user_id", "organization_id") REFERENCES "public"."users"("id", "organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_scope_fkey" FOREIGN KEY ("workspace_id", "organization_id", "client_id") REFERENCES "public"."workspaces"("id", "organization_id", "client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_select" ON "public"."activities" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "activities_write" ON "public"."activities" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."ai_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_jobs_select" ON "public"."ai_jobs" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "ai_jobs_write" ON "public"."ai_jobs" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."associations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "associations_select" ON "public"."associations" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "associations_write" ON "public"."associations" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_insert_members" ON "public"."audit_logs" FOR INSERT WITH CHECK ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "audit_logs_select_admins" ON "public"."audit_logs" FOR SELECT USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."campaign_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_members_select" ON "public"."campaign_members" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "campaign_members_write" ON "public"."campaign_members" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_select" ON "public"."campaigns" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "campaigns_write" ON "public"."campaigns" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."client_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_members_select_client_members" ON "public"."client_members" FOR SELECT USING ("public"."can_access_client"("client_id"));



CREATE POLICY "client_members_write_client_managers" ON "public"."client_members" USING ("public"."can_manage_client"("client_id")) WITH CHECK ("public"."can_manage_client"("client_id"));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete_org_admins" ON "public"."clients" FOR DELETE USING ("public"."is_org_admin"("organization_id"));



CREATE POLICY "clients_insert_org_admins" ON "public"."clients" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id"));



CREATE POLICY "clients_select_members" ON "public"."clients" FOR SELECT USING ("public"."can_access_client"("id"));



CREATE POLICY "clients_update_managers" ON "public"."clients" FOR UPDATE USING ("public"."can_manage_client"("id")) WITH CHECK ("public"."can_manage_client"("id"));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_select" ON "public"."companies" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "companies_write" ON "public"."companies" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_select" ON "public"."contacts" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "contacts_write" ON "public"."contacts" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."custom_properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_properties_select" ON "public"."custom_properties" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "custom_properties_write" ON "public"."custom_properties" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."custom_property_values" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_property_values_select" ON "public"."custom_property_values" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "custom_property_values_write" ON "public"."custom_property_values" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deals_select" ON "public"."deals" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "deals_write" ON "public"."deals" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."enrichment_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enrichment_jobs_select" ON "public"."enrichment_jobs" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "enrichment_jobs_write" ON "public"."enrichment_jobs" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."field_mappings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "field_mappings_select" ON "public"."field_mappings" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "field_mappings_write" ON "public"."field_mappings" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "files_select" ON "public"."files" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "files_write" ON "public"."files" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."import_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "import_jobs_select" ON "public"."import_jobs" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "import_jobs_write" ON "public"."import_jobs" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."integration_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_connections_select" ON "public"."integration_connections" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "integration_connections_write" ON "public"."integration_connections" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."integration_credentials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_credentials_service_only" ON "public"."integration_credentials" USING (false) WITH CHECK (false);



ALTER TABLE "public"."lead_contact_database" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_contact_database_delete_admins" ON "public"."lead_contact_database" FOR DELETE USING ("public"."is_org_admin"("organization_id"));



CREATE POLICY "lead_contact_database_insert_members" ON "public"."lead_contact_database" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "lead_contact_database_select_members" ON "public"."lead_contact_database" FOR SELECT USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "lead_contact_database_update_members" ON "public"."lead_contact_database" FOR UPDATE USING ("public"."is_org_member"("organization_id")) WITH CHECK (("public"."is_org_member"("organization_id") AND ("updated_by" = "auth"."uid"())));



ALTER TABLE "public"."lead_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_lists_delete_owners" ON "public"."lead_lists" FOR DELETE USING (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))));



CREATE POLICY "lead_lists_insert_members" ON "public"."lead_lists" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "lead_lists_select_assigned" ON "public"."lead_lists" FOR SELECT USING (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR ("auth"."uid"() = ANY ("assigned_user_ids")) OR "public"."is_org_admin"("organization_id"))));



CREATE POLICY "lead_lists_update_owners" ON "public"."lead_lists" FOR UPDATE USING (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id")))) WITH CHECK (("public"."is_org_member"("organization_id") AND (("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))));



ALTER TABLE "public"."list_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "list_memberships_select" ON "public"."list_memberships" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "list_memberships_write" ON "public"."list_memberships" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lists_select" ON "public"."lists" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "lists_write" ON "public"."lists" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes_select" ON "public"."notes" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "notes_write" ON "public"."notes" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_select_members" ON "public"."organizations" FOR SELECT USING ("public"."is_org_member"("id"));



CREATE POLICY "organizations_update_admins" ON "public"."organizations" FOR UPDATE USING ("public"."is_org_admin"("id")) WITH CHECK ("public"."is_org_admin"("id"));



ALTER TABLE "public"."pipeline_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pipeline_stages_select" ON "public"."pipeline_stages" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "pipeline_stages_write" ON "public"."pipeline_stages" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppression_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppression_entries_select" ON "public"."suppression_entries" FOR SELECT USING ("public"."can_access_scoped_record"("organization_id", "client_id", "workspace_id"));



CREATE POLICY "suppression_entries_write" ON "public"."suppression_entries" USING ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id")) WITH CHECK ("public"."can_edit_scoped_record"("organization_id", "client_id", "workspace_id"));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_select" ON "public"."tasks" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "tasks_write" ON "public"."tasks" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



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



ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace_members_select_workspace_members" ON "public"."workspace_members" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "workspace_members_write_workspace_admins" ON "public"."workspace_members" USING ("public"."can_manage_client"("client_id")) WITH CHECK ("public"."can_manage_client"("client_id"));



CREATE POLICY "workspace_records_select" ON "public"."pipelines" FOR SELECT USING ("public"."can_access_workspace"("workspace_id"));



CREATE POLICY "workspace_records_write" ON "public"."pipelines" USING ("public"."can_edit_workspace"("workspace_id")) WITH CHECK ("public"."can_edit_workspace"("workspace_id"));



ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspaces_delete_client_managers" ON "public"."workspaces" FOR DELETE USING ("public"."can_manage_client"("client_id"));



CREATE POLICY "workspaces_insert_client_managers" ON "public"."workspaces" FOR INSERT WITH CHECK ("public"."can_manage_client"("client_id"));



CREATE POLICY "workspaces_select_members" ON "public"."workspaces" FOR SELECT USING ("public"."can_access_workspace"("id"));



CREATE POLICY "workspaces_update_editors" ON "public"."workspaces" FOR UPDATE USING ("public"."can_edit_workspace"("id")) WITH CHECK ("public"."can_edit_workspace"("id"));



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



GRANT ALL ON FUNCTION "public"."ensure_default_pipeline"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_default_pipeline"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_default_pipeline"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shared_pipeline_stages"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_shared_pipeline_stages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_pipeline_stages"() TO "service_role";



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



GRANT ALL ON TABLE "public"."ai_jobs" TO "anon";
GRANT ALL ON TABLE "public"."ai_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."associations" TO "anon";
GRANT ALL ON TABLE "public"."associations" TO "authenticated";
GRANT ALL ON TABLE "public"."associations" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_members" TO "anon";
GRANT ALL ON TABLE "public"."campaign_members" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_members" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."client_members" TO "anon";
GRANT ALL ON TABLE "public"."client_members" TO "authenticated";
GRANT ALL ON TABLE "public"."client_members" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."custom_properties" TO "anon";
GRANT ALL ON TABLE "public"."custom_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_properties" TO "service_role";



GRANT ALL ON TABLE "public"."custom_property_values" TO "anon";
GRANT ALL ON TABLE "public"."custom_property_values" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_property_values" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."enrichment_jobs" TO "anon";
GRANT ALL ON TABLE "public"."enrichment_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."enrichment_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."field_mappings" TO "anon";
GRANT ALL ON TABLE "public"."field_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."field_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."import_jobs" TO "anon";
GRANT ALL ON TABLE "public"."import_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."integration_connections" TO "anon";
GRANT ALL ON TABLE "public"."integration_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_connections" TO "service_role";



GRANT ALL ON TABLE "public"."integration_credentials" TO "anon";
GRANT ALL ON TABLE "public"."integration_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."lead_contact_database" TO "anon";
GRANT ALL ON TABLE "public"."lead_contact_database" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_contact_database" TO "service_role";



GRANT ALL ON TABLE "public"."lead_lists" TO "anon";
GRANT ALL ON TABLE "public"."lead_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_lists" TO "service_role";



GRANT ALL ON TABLE "public"."list_memberships" TO "anon";
GRANT ALL ON TABLE "public"."list_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."list_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."lists" TO "anon";
GRANT ALL ON TABLE "public"."lists" TO "authenticated";
GRANT ALL ON TABLE "public"."lists" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."pipelines" TO "anon";
GRANT ALL ON TABLE "public"."pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."suppression_entries" TO "anon";
GRANT ALL ON TABLE "public"."suppression_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."suppression_entries" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



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




