


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_question_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.question_id IS NOT NULL THEN
    UPDATE public.discovery_questions
    SET usage_count = usage_count + 1
    WHERE id = NEW.question_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_question_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_member"("p_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
      AND owner_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_project_member"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_call_transcript_tsvector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.transcript_tsvector :=
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.transcript, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.post_call_notes, '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_call_transcript_tsvector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.ai_sessions
  SET last_message_at = NOW(), message_count = message_count + 1
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_session_last_message"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "contact_id" "uuid",
    "call_review_id" "uuid",
    "action_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "entity_name" "text",
    "description" "text",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activity_log_action_type_check" CHECK (("action_type" = ANY (ARRAY['call_logged'::"text", 'status_changed'::"text", 'note_added'::"text", 'contact_created'::"text", 'contact_updated'::"text", 'project_created'::"text", 'document_uploaded'::"text", 'ai_session_started'::"text", 'playbook_updated'::"text", 'meeting_booked'::"text", 'enrichment_run'::"text", 'icp_scored'::"text"])))
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "tool_used" "text",
    "documents_used" "uuid"[],
    "model" "text" DEFAULT 'claude-sonnet-4-20250514'::"text",
    "tokens_used" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "contact_id" "uuid",
    "title" "text",
    "session_type" "text" DEFAULT 'general'::"text",
    "context_snapshot" "jsonb",
    "message_count" integer DEFAULT 0,
    "is_starred" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['general'::"text", 'prospect_research'::"text", 'call_brief'::"text", 'icp_scoring'::"text", 'script_builder'::"text", 'call_coach'::"text", 'follow_up'::"text", 'discovery_questions'::"text", 'playbook_builder'::"text", 'objection_handling'::"text"])))
);


ALTER TABLE "public"."ai_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cadence_steps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cadence_id" "uuid" NOT NULL,
    "step_number" integer NOT NULL,
    "touch_type" "text" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "outcome" "text",
    "notes" "text",
    "template_used" "text",
    CONSTRAINT "cadence_steps_touch_type_check" CHECK (("touch_type" = ANY (ARRAY['call'::"text", 'email'::"text", 'linkedin'::"text", 'whatsapp'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."cadence_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cadences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cadences_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."cadences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_review_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "call_review_id" "uuid" NOT NULL,
    "question_id" "uuid",
    "question_text" "text" NOT NULL,
    "was_effective" boolean,
    "prospect_response" "text",
    "notes" "text"
);


ALTER TABLE "public"."call_review_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_review_tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "call_review_id" "uuid" NOT NULL,
    "tag" "text" NOT NULL
);


ALTER TABLE "public"."call_review_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "contact_id" "uuid",
    "called_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_minutes" numeric(5,1),
    "call_outcome" "text",
    "call_direction" "text" DEFAULT 'outbound'::"text",
    "transcript" "text",
    "transcript_tsvector" "tsvector",
    "summary" "text",
    "key_moments" "text"[],
    "objections_raised" "text"[],
    "objections_handled" "text"[],
    "rep_talk_ratio" integer,
    "prospect_talk_ratio" integer GENERATED ALWAYS AS ((100 - "rep_talk_ratio")) STORED,
    "objection_count" integer DEFAULT 0,
    "permission_to_operate" boolean,
    "pos_stage" "text",
    "overall_score" numeric(3,1),
    "score_hook" numeric(3,1),
    "score_bridge" numeric(3,1),
    "score_questioning" numeric(3,1),
    "score_objection" numeric(3,1),
    "score_close" numeric(3,1),
    "score_listening" numeric(3,1),
    "coaching_feedback" "text",
    "biggest_miss" "text",
    "drill_recommendation" "text",
    "next_call_tip" "text",
    "pre_call_prep_notes" "text",
    "post_call_notes" "text",
    "follow_up_action" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "call_reviews_call_direction_check" CHECK (("call_direction" = ANY (ARRAY['outbound'::"text", 'inbound'::"text"]))),
    CONSTRAINT "call_reviews_call_outcome_check" CHECK (("call_outcome" = ANY (ARRAY['meeting_booked'::"text", 'callback_requested'::"text", 'not_interested'::"text", 'voicemail'::"text", 'gatekeeper'::"text", 'no_answer'::"text", 'qualified'::"text", 'follow_up_email'::"text"]))),
    CONSTRAINT "call_reviews_overall_score_check" CHECK ((("overall_score" >= (0)::numeric) AND ("overall_score" <= (10)::numeric))),
    CONSTRAINT "call_reviews_pos_stage_check" CHECK (("pos_stage" = ANY (ARRAY['profile'::"text", 'search'::"text", 'connect'::"text", 'engage'::"text", 'assess'::"text", 'influence'::"text"]))),
    CONSTRAINT "call_reviews_rep_talk_ratio_check" CHECK ((("rep_talk_ratio" >= 0) AND ("rep_talk_ratio" <= 100))),
    CONSTRAINT "call_reviews_score_bridge_check" CHECK ((("score_bridge" >= (0)::numeric) AND ("score_bridge" <= (10)::numeric))),
    CONSTRAINT "call_reviews_score_close_check" CHECK ((("score_close" >= (0)::numeric) AND ("score_close" <= (10)::numeric))),
    CONSTRAINT "call_reviews_score_hook_check" CHECK ((("score_hook" >= (0)::numeric) AND ("score_hook" <= (10)::numeric))),
    CONSTRAINT "call_reviews_score_listening_check" CHECK ((("score_listening" >= (0)::numeric) AND ("score_listening" <= (10)::numeric))),
    CONSTRAINT "call_reviews_score_objection_check" CHECK ((("score_objection" >= (0)::numeric) AND ("score_objection" <= (10)::numeric))),
    CONSTRAINT "call_reviews_score_questioning_check" CHECK ((("score_questioning" >= (0)::numeric) AND ("score_questioning" <= (10)::numeric)))
);


ALTER TABLE "public"."call_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "note_type" "text" DEFAULT 'general'::"text",
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['general'::"text", 'research'::"text", 'objection'::"text", 'pain_point'::"text", 'trigger'::"text", 'competitor'::"text", 'follow_up'::"text"])))
);


ALTER TABLE "public"."contact_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_stage_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "moved_at" timestamp with time zone DEFAULT "now"(),
    "moved_by" "uuid"
);


ALTER TABLE "public"."contact_stage_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "full_name" "text" GENERATED ALWAYS AS (TRIM(BOTH FROM (("first_name" || ' '::"text") || COALESCE("last_name", ''::"text")))) STORED,
    "job_title" "text",
    "seniority_level" "text",
    "department" "text",
    "email" "text",
    "phone" "text",
    "linkedin_url" "text",
    "twitter_handle" "text",
    "company_name" "text",
    "company_department" "text",
    "location_city" "text",
    "location_country" "text" DEFAULT 'Ireland'::"text",
    "is_decision_maker" boolean DEFAULT false,
    "is_influencer" boolean DEFAULT false,
    "is_gatekeeper" boolean DEFAULT false,
    "decision_authority" "text",
    "reports_to" "text",
    "pos_stage" "text" DEFAULT 'profile'::"text",
    "status" "text" DEFAULT 'new'::"text",
    "enrichment_data" "jsonb",
    "pain_points" "text"[],
    "trigger_events" "text"[],
    "icp_score" integer,
    "icp_score_breakdown" "jsonb",
    "call_count" integer DEFAULT 0,
    "last_called_at" timestamp with time zone,
    "last_called_by" "uuid",
    "next_follow_up_at" timestamp with time zone,
    "notes" "text",
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contacts_icp_score_check" CHECK ((("icp_score" >= 0) AND ("icp_score" <= 100))),
    CONSTRAINT "contacts_pos_stage_check" CHECK (("pos_stage" = ANY (ARRAY['profile'::"text", 'search'::"text", 'connect'::"text", 'engage'::"text", 'assess'::"text", 'influence'::"text"]))),
    CONSTRAINT "contacts_seniority_level_check" CHECK (("seniority_level" = ANY (ARRAY['c_suite'::"text", 'vp'::"text", 'director'::"text", 'manager'::"text", 'individual'::"text", 'unknown'::"text"]))),
    CONSTRAINT "contacts_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'researched'::"text", 'contacted'::"text", 'engaged'::"text", 'qualified'::"text", 'meeting_booked'::"text", 'handed_over'::"text", 'lost'::"text", 'nurture'::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discovery_question_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT '❓'::"text",
    "colour" "text" DEFAULT '#7C3AED'::"text",
    "pm_module" integer,
    "position" integer DEFAULT 0,
    "is_system" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."discovery_question_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discovery_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "question_text" "text" NOT NULL,
    "purpose" "text",
    "question_type" "text" DEFAULT 'discovery'::"text",
    "call_stage" "text" DEFAULT 'mid'::"text",
    "pos_stage" "text",
    "difficulty" integer DEFAULT 2,
    "is_favourite" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "discovery_questions_call_stage_check" CHECK (("call_stage" = ANY (ARRAY['opener'::"text", 'early'::"text", 'mid'::"text", 'late'::"text", 'close'::"text"]))),
    CONSTRAINT "discovery_questions_difficulty_check" CHECK ((("difficulty" >= 1) AND ("difficulty" <= 3))),
    CONSTRAINT "discovery_questions_pos_stage_check" CHECK (("pos_stage" = ANY (ARRAY['profile'::"text", 'search'::"text", 'connect'::"text", 'engage'::"text", 'assess'::"text", 'influence'::"text"]))),
    CONSTRAINT "discovery_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['discovery'::"text", 'qualifying'::"text", 'strategic'::"text", 'urgency'::"text", 'next_step'::"text", 'objection_handling'::"text"])))
);


ALTER TABLE "public"."discovery_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_chunks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" "text" NOT NULL,
    "token_count" integer,
    "page_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."objections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid",
    "created_by" "uuid",
    "objection_text" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "industry" "text",
    "response_1" "text",
    "response_2" "text",
    "response_3" "text",
    "ai_response" "text",
    "best_response" "text",
    "times_heard" integer DEFAULT 1,
    "times_handled" integer DEFAULT 0,
    "success_rate" numeric(5,2),
    "is_system" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "objections_category_check" CHECK (("category" = ANY (ARRAY['timing'::"text", 'budget'::"text", 'authority'::"text", 'need'::"text", 'competitor'::"text", 'process'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."objections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_stages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "pos_stage" "text",
    "colour" "text" DEFAULT '#7C3AED'::"text",
    "position" integer DEFAULT 0 NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playbook_sections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "playbook_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."playbook_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playbooks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "version" "text" DEFAULT 'v1.0'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "background_research" "text",
    "leadership_framework" "text",
    "products_services" "text",
    "key_partners" "text",
    "target_industry_research" "text",
    "competitor_analysis" "text",
    "outreach_strategy" "text",
    "messaging_cadence" "text",
    "scripting_templates" "text",
    "social_positioning" "text",
    "prospecting_techniques" "text",
    "engagement_routes" "text",
    "icp_profile" "text",
    "icp_industry" "text",
    "icp_company_size" "text",
    "icp_job_titles" "text"[],
    "icp_pain_points" "text"[],
    "icp_trigger_events" "text"[],
    "permission_to_operate" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "playbooks_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."playbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "company_website" "text",
    "company_size" "text",
    "industry" "text",
    "icp_description" "text",
    "colour" "text" DEFAULT '#7C3AED'::"text",
    "icon" "text" DEFAULT '🏢'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "pos_stage" "text" DEFAULT 'profile'::"text",
    "funnel_stage" "text" DEFAULT 'discovering'::"text",
    "target_meeting_date" "date",
    "pipeline_value" numeric(12,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "projects_funnel_stage_check" CHECK (("funnel_stage" = ANY (ARRAY['discovering'::"text", 'sharing'::"text", 'cultivating'::"text", 'handover'::"text"]))),
    CONSTRAINT "projects_pos_stage_check" CHECK (("pos_stage" = ANY (ARRAY['profile'::"text", 'search'::"text", 'connect'::"text", 'engage'::"text", 'assess'::"text", 'influence'::"text"]))),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'won'::"text", 'lost'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."uploaded_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size_bytes" integer,
    "storage_path" "text" NOT NULL,
    "public_url" "text",
    "doc_type" "text" DEFAULT 'research'::"text",
    "title" "text",
    "description" "text",
    "is_processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "page_count" integer,
    "pm_module" integer,
    "pos_stage" "text",
    "is_global" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "uploaded_documents_doc_type_check" CHECK (("doc_type" = ANY (ARRAY['research'::"text", 'playbook'::"text", 'call_script'::"text", 'discovery_questions'::"text", 'competitor_analysis'::"text", 'training'::"text", 'proposal'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."uploaded_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_performance_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "snapshot_period" "text" DEFAULT 'daily'::"text",
    "calls_made" integer DEFAULT 0,
    "calls_connected" integer DEFAULT 0,
    "voicemails_left" integer DEFAULT 0,
    "emails_sent" integer DEFAULT 0,
    "linkedin_touches" integer DEFAULT 0,
    "meetings_booked" integer DEFAULT 0,
    "contacts_enriched" integer DEFAULT 0,
    "avg_call_score" numeric(3,1),
    "avg_talk_ratio" integer,
    "objections_handled" integer DEFAULT 0,
    "conversion_rate" numeric(5,2),
    "score_organised" numeric(3,1),
    "score_resilience" numeric(3,1),
    "score_curiosity" numeric(3,1),
    "score_listening" numeric(3,1),
    "score_coachable" numeric(3,1),
    "score_persistence" numeric(3,1),
    "pos_level" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_performance_snapshots_snapshot_period_check" CHECK (("snapshot_period" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"])))
);


ALTER TABLE "public"."user_performance_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_question_favourites" (
    "user_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_question_favourites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "avatar_color" "text" DEFAULT '#7C3AED'::"text",
    "avatar_emoji" "text" DEFAULT '⚡'::"text",
    "role" "text" DEFAULT 'bdr'::"text",
    "pin_hash" "text",
    "access_code" "text",
    "pos_level" integer DEFAULT 1,
    "timezone" "text" DEFAULT 'Europe/Dublin'::"text",
    "is_active" boolean DEFAULT true,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_pos_level_check" CHECK ((("pos_level" >= 1) AND ("pos_level" <= 4))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['bdr'::"text", 'senior_bdr'::"text", 'manager'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cadence_steps"
    ADD CONSTRAINT "cadence_steps_cadence_id_step_number_key" UNIQUE ("cadence_id", "step_number");



ALTER TABLE ONLY "public"."cadence_steps"
    ADD CONSTRAINT "cadence_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cadences"
    ADD CONSTRAINT "cadences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_review_questions"
    ADD CONSTRAINT "call_review_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_review_tags"
    ADD CONSTRAINT "call_review_tags_call_review_id_tag_key" UNIQUE ("call_review_id", "tag");



ALTER TABLE ONLY "public"."call_review_tags"
    ADD CONSTRAINT "call_review_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_reviews"
    ADD CONSTRAINT "call_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_stage_entries"
    ADD CONSTRAINT "contact_stage_entries_contact_id_project_id_key" UNIQUE ("contact_id", "project_id");



ALTER TABLE ONLY "public"."contact_stage_entries"
    ADD CONSTRAINT "contact_stage_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discovery_question_categories"
    ADD CONSTRAINT "discovery_question_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."discovery_question_categories"
    ADD CONSTRAINT "discovery_question_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discovery_questions"
    ADD CONSTRAINT "discovery_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_document_id_chunk_index_key" UNIQUE ("document_id", "chunk_index");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."objections"
    ADD CONSTRAINT "objections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playbook_sections"
    ADD CONSTRAINT "playbook_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_performance_snapshots"
    ADD CONSTRAINT "user_performance_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_performance_snapshots"
    ADD CONSTRAINT "user_performance_snapshots_user_id_snapshot_date_snapshot_p_key" UNIQUE ("user_id", "snapshot_date", "snapshot_period");



ALTER TABLE ONLY "public"."user_question_favourites"
    ADD CONSTRAINT "user_question_favourites_pkey" PRIMARY KEY ("user_id", "question_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_contact" ON "public"."activity_log" USING "btree" ("contact_id");



CREATE INDEX "idx_activity_project" ON "public"."activity_log" USING "btree" ("project_id", "created_at" DESC);



CREATE INDEX "idx_activity_type" ON "public"."activity_log" USING "btree" ("action_type");



CREATE INDEX "idx_activity_user" ON "public"."activity_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_ai_messages_session" ON "public"."ai_messages" USING "btree" ("session_id", "created_at");



CREATE INDEX "idx_ai_sessions_last_msg" ON "public"."ai_sessions" USING "btree" ("last_message_at" DESC);



CREATE INDEX "idx_ai_sessions_project" ON "public"."ai_sessions" USING "btree" ("project_id");



CREATE INDEX "idx_ai_sessions_type" ON "public"."ai_sessions" USING "btree" ("session_type");



CREATE INDEX "idx_ai_sessions_user" ON "public"."ai_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_cadence_steps_due" ON "public"."cadence_steps" USING "btree" ("scheduled_for") WHERE ("completed_at" IS NULL);



CREATE INDEX "idx_cadences_contact" ON "public"."cadences" USING "btree" ("contact_id");



CREATE INDEX "idx_cadences_project" ON "public"."cadences" USING "btree" ("project_id");



CREATE INDEX "idx_call_reviews_called_at" ON "public"."call_reviews" USING "btree" ("called_at" DESC);



CREATE INDEX "idx_call_reviews_contact" ON "public"."call_reviews" USING "btree" ("contact_id");



CREATE INDEX "idx_call_reviews_date_user" ON "public"."call_reviews" USING "btree" ("user_id", "called_at" DESC);



CREATE INDEX "idx_call_reviews_fts" ON "public"."call_reviews" USING "gin" ("transcript_tsvector");



CREATE INDEX "idx_call_reviews_outcome" ON "public"."call_reviews" USING "btree" ("call_outcome");



CREATE INDEX "idx_call_reviews_project" ON "public"."call_reviews" USING "btree" ("project_id");



CREATE INDEX "idx_call_reviews_score" ON "public"."call_reviews" USING "btree" ("overall_score" DESC NULLS LAST);



CREATE INDEX "idx_call_reviews_user" ON "public"."call_reviews" USING "btree" ("user_id");



CREATE INDEX "idx_chunks_document" ON "public"."document_chunks" USING "btree" ("document_id", "chunk_index");



CREATE INDEX "idx_contact_notes_contact" ON "public"."contact_notes" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_notes_created" ON "public"."contact_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_notes_user" ON "public"."contact_notes" USING "btree" ("user_id");



CREATE INDEX "idx_contacts_follow_up" ON "public"."contacts" USING "btree" ("next_follow_up_at") WHERE ("next_follow_up_at" IS NOT NULL);



CREATE INDEX "idx_contacts_icp_score" ON "public"."contacts" USING "btree" ("icp_score" DESC NULLS LAST);



CREATE INDEX "idx_contacts_last_called" ON "public"."contacts" USING "btree" ("last_called_at" DESC NULLS LAST);



CREATE INDEX "idx_contacts_name_trgm" ON "public"."contacts" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_contacts_pos_stage" ON "public"."contacts" USING "btree" ("pos_stage");



CREATE INDEX "idx_contacts_project" ON "public"."contacts" USING "btree" ("project_id");



CREATE INDEX "idx_contacts_status" ON "public"."contacts" USING "btree" ("status");



CREATE INDEX "idx_contacts_user" ON "public"."contacts" USING "btree" ("created_by");



CREATE INDEX "idx_documents_global" ON "public"."uploaded_documents" USING "btree" ("is_global") WHERE ("is_global" = true);



CREATE INDEX "idx_documents_project" ON "public"."uploaded_documents" USING "btree" ("project_id");



CREATE INDEX "idx_documents_type" ON "public"."uploaded_documents" USING "btree" ("doc_type");



CREATE INDEX "idx_documents_user" ON "public"."uploaded_documents" USING "btree" ("user_id");



CREATE INDEX "idx_objections_category" ON "public"."objections" USING "btree" ("category");



CREATE INDEX "idx_objections_project" ON "public"."objections" USING "btree" ("project_id");



CREATE INDEX "idx_perf_user_date" ON "public"."user_performance_snapshots" USING "btree" ("user_id", "snapshot_date" DESC);



CREATE INDEX "idx_project_members_project" ON "public"."project_members" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_user" ON "public"."project_members" USING "btree" ("user_id");



CREATE INDEX "idx_projects_company" ON "public"."projects" USING "btree" ("company_name");



CREATE INDEX "idx_projects_created" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_owner" ON "public"."projects" USING "btree" ("owner_id");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_questions_call_stage" ON "public"."discovery_questions" USING "btree" ("call_stage");



CREATE INDEX "idx_questions_category" ON "public"."discovery_questions" USING "btree" ("category_id");



CREATE INDEX "idx_questions_pos_stage" ON "public"."discovery_questions" USING "btree" ("pos_stage");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "call_reviews_tsvector_update" BEFORE INSERT OR UPDATE ON "public"."call_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_call_transcript_tsvector"();



CREATE OR REPLACE TRIGGER "on_ai_message_insert" AFTER INSERT ON "public"."ai_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_last_message"();



CREATE OR REPLACE TRIGGER "on_question_used" AFTER INSERT ON "public"."call_review_questions" FOR EACH ROW EXECUTE FUNCTION "public"."increment_question_usage"();



CREATE OR REPLACE TRIGGER "touch_ai_sessions" BEFORE UPDATE ON "public"."ai_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_call_reviews" BEFORE UPDATE ON "public"."call_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_contact_notes" BEFORE UPDATE ON "public"."contact_notes" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_contacts" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_documents" BEFORE UPDATE ON "public"."uploaded_documents" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_playbooks" BEFORE UPDATE ON "public"."playbooks" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_projects" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_questions" BEFORE UPDATE ON "public"."discovery_questions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "touch_users" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_call_review_id_fkey" FOREIGN KEY ("call_review_id") REFERENCES "public"."call_reviews"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cadence_steps"
    ADD CONSTRAINT "cadence_steps_cadence_id_fkey" FOREIGN KEY ("cadence_id") REFERENCES "public"."cadences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cadences"
    ADD CONSTRAINT "cadences_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cadences"
    ADD CONSTRAINT "cadences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cadences"
    ADD CONSTRAINT "cadences_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_review_questions"
    ADD CONSTRAINT "call_review_questions_call_review_id_fkey" FOREIGN KEY ("call_review_id") REFERENCES "public"."call_reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_review_questions"
    ADD CONSTRAINT "call_review_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."discovery_questions"("id");



ALTER TABLE ONLY "public"."call_review_tags"
    ADD CONSTRAINT "call_review_tags_call_review_id_fkey" FOREIGN KEY ("call_review_id") REFERENCES "public"."call_reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_reviews"
    ADD CONSTRAINT "call_reviews_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."call_reviews"
    ADD CONSTRAINT "call_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."call_reviews"
    ADD CONSTRAINT "call_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."contact_stage_entries"
    ADD CONSTRAINT "contact_stage_entries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_stage_entries"
    ADD CONSTRAINT "contact_stage_entries_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."contact_stage_entries"
    ADD CONSTRAINT "contact_stage_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_stage_entries"
    ADD CONSTRAINT "contact_stage_entries_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_last_called_by_fkey" FOREIGN KEY ("last_called_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discovery_questions"
    ADD CONSTRAINT "discovery_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."discovery_question_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discovery_questions"
    ADD CONSTRAINT "discovery_questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."uploaded_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."objections"
    ADD CONSTRAINT "objections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."objections"
    ADD CONSTRAINT "objections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playbook_sections"
    ADD CONSTRAINT "playbook_sections_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_performance_snapshots"
    ADD CONSTRAINT "user_performance_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_favourites"
    ADD CONSTRAINT "user_question_favourites_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."discovery_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_favourites"
    ADD CONSTRAINT "user_question_favourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_log_access" ON "public"."activity_log" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_project_member"("project_id")));



CREATE POLICY "activity_log_insert" ON "public"."activity_log" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_messages_own" ON "public"."ai_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."ai_sessions"
  WHERE (("ai_sessions"."id" = "ai_messages"."session_id") AND ("ai_sessions"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."ai_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_sessions_own" ON "public"."ai_sessions" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."cadence_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cadence_steps_access" ON "public"."cadence_steps" USING ((EXISTS ( SELECT 1
   FROM "public"."cadences"
  WHERE (("cadences"."id" = "cadence_steps"."cadence_id") AND "public"."is_project_member"("cadences"."project_id")))));



ALTER TABLE "public"."cadences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cadences_access" ON "public"."cadences" USING ("public"."is_project_member"("project_id"));



ALTER TABLE "public"."call_review_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_review_questions_own" ON "public"."call_review_questions" USING ((EXISTS ( SELECT 1
   FROM "public"."call_reviews"
  WHERE (("call_reviews"."id" = "call_review_questions"."call_review_id") AND ("call_reviews"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."call_review_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_review_tags_own" ON "public"."call_review_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."call_reviews"
  WHERE (("call_reviews"."id" = "call_review_tags"."call_review_id") AND ("call_reviews"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."call_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_reviews_own" ON "public"."call_reviews" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "chunks_access" ON "public"."document_chunks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."uploaded_documents" "d"
  WHERE (("d"."id" = "document_chunks"."document_id") AND (("d"."user_id" = "auth"."uid"()) OR ("d"."is_global" = true))))));



ALTER TABLE "public"."contact_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_notes_access" ON "public"."contact_notes" USING ((("user_id" = "auth"."uid"()) OR "public"."is_project_member"("project_id")));



ALTER TABLE "public"."contact_stage_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_stage_entries_access" ON "public"."contact_stage_entries" USING ("public"."is_project_member"("project_id"));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_access" ON "public"."contacts" USING ("public"."is_project_member"("project_id"));



ALTER TABLE "public"."discovery_question_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discovery_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_chunks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_access" ON "public"."uploaded_documents" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("is_global" = true) OR "public"."is_project_member"("project_id")));



CREATE POLICY "documents_update" ON "public"."uploaded_documents" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "documents_write" ON "public"."uploaded_documents" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."objections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "objections_read" ON "public"."objections" FOR SELECT USING ((("project_id" IS NULL) OR "public"."is_project_member"("project_id")));



CREATE POLICY "objections_write" ON "public"."objections" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "perf_own" ON "public"."user_performance_snapshots" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."pipeline_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pipeline_stages_access" ON "public"."pipeline_stages" USING ("public"."is_project_member"("project_id"));



ALTER TABLE "public"."playbook_sections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "playbook_sections_access" ON "public"."playbook_sections" USING ((EXISTS ( SELECT 1
   FROM "public"."playbooks"
  WHERE (("playbooks"."id" = "playbook_sections"."playbook_id") AND "public"."is_project_member"("playbooks"."project_id")))));



ALTER TABLE "public"."playbooks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "playbooks_access" ON "public"."playbooks" USING ("public"."is_project_member"("project_id"));



ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_members_access" ON "public"."project_members" USING ((("user_id" = "auth"."uid"()) OR "public"."is_project_member"("project_id")));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_access" ON "public"."projects" USING ((("owner_id" = "auth"."uid"()) OR "public"."is_project_member"("id")));



CREATE POLICY "question_categories_read" ON "public"."discovery_question_categories" FOR SELECT USING (true);



CREATE POLICY "question_favourites_own" ON "public"."user_question_favourites" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "questions_read" ON "public"."discovery_questions" FOR SELECT USING (true);



CREATE POLICY "questions_update" ON "public"."discovery_questions" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "questions_write" ON "public"."discovery_questions" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."uploaded_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_performance_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_question_favourites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_self" ON "public"."users" USING (("id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_question_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_question_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_question_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_member"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_member"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_member"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_call_transcript_tsvector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_call_transcript_tsvector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_call_transcript_tsvector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."cadence_steps" TO "anon";
GRANT ALL ON TABLE "public"."cadence_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."cadence_steps" TO "service_role";



GRANT ALL ON TABLE "public"."cadences" TO "anon";
GRANT ALL ON TABLE "public"."cadences" TO "authenticated";
GRANT ALL ON TABLE "public"."cadences" TO "service_role";



GRANT ALL ON TABLE "public"."call_review_questions" TO "anon";
GRANT ALL ON TABLE "public"."call_review_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."call_review_questions" TO "service_role";



GRANT ALL ON TABLE "public"."call_review_tags" TO "anon";
GRANT ALL ON TABLE "public"."call_review_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."call_review_tags" TO "service_role";



GRANT ALL ON TABLE "public"."call_reviews" TO "anon";
GRANT ALL ON TABLE "public"."call_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."call_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."contact_notes" TO "anon";
GRANT ALL ON TABLE "public"."contact_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_notes" TO "service_role";



GRANT ALL ON TABLE "public"."contact_stage_entries" TO "anon";
GRANT ALL ON TABLE "public"."contact_stage_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_stage_entries" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."discovery_question_categories" TO "anon";
GRANT ALL ON TABLE "public"."discovery_question_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."discovery_question_categories" TO "service_role";



GRANT ALL ON TABLE "public"."discovery_questions" TO "anon";
GRANT ALL ON TABLE "public"."discovery_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."discovery_questions" TO "service_role";



GRANT ALL ON TABLE "public"."document_chunks" TO "anon";
GRANT ALL ON TABLE "public"."document_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."document_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."objections" TO "anon";
GRANT ALL ON TABLE "public"."objections" TO "authenticated";
GRANT ALL ON TABLE "public"."objections" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."playbook_sections" TO "anon";
GRANT ALL ON TABLE "public"."playbook_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."playbook_sections" TO "service_role";



GRANT ALL ON TABLE "public"."playbooks" TO "anon";
GRANT ALL ON TABLE "public"."playbooks" TO "authenticated";
GRANT ALL ON TABLE "public"."playbooks" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."uploaded_documents" TO "anon";
GRANT ALL ON TABLE "public"."uploaded_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."uploaded_documents" TO "service_role";



GRANT ALL ON TABLE "public"."user_performance_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."user_performance_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."user_performance_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."user_question_favourites" TO "anon";
GRANT ALL ON TABLE "public"."user_question_favourites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_question_favourites" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









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































