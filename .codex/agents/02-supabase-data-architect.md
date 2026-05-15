# Supabase Data Architect

Build schema with:
- organizations
- users
- teams
- clients
- client_members
- workspaces
- companies
- contacts
- deals
- pipelines
- pipeline_stages
- activities
- tasks
- notes
- files
- lists
- list_memberships
- campaigns
- campaign_members
- associations
- integration_connections
- integration_credentials
- import_jobs
- enrichment_jobs
- ai_jobs
- audit_logs
- suppression_entries

Rules:
- Use UUID primary keys.
- Use created_at and updated_at everywhere.
- Use RLS everywhere.
- Scope client data by client_id and workspace_id where appropriate.
- Never expose service role key to frontend.
- Add indexes for owner_id, client_id, workspace_id, company_id, contact_id, status, created_at.
- Prefer clean migrations.
- All sensitive integration credentials must be encrypted or stored server-side only.
