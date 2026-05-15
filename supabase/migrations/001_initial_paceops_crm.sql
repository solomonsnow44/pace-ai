-- PaceOps CRM initial clean schema
-- Build order:
-- 1. extensions
-- 2. users/teams/clients/workspaces
-- 3. companies/contacts/deals
-- 4. activities/tasks/notes/files
-- 5. lists/campaigns
-- 6. integrations/AI/enrichment
-- 7. RLS policies
-- 8. seed data

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Codex should build the full schema from:
-- .codex/agents/00-master-build-agent.md
-- docs/architecture/core-data-model.md
