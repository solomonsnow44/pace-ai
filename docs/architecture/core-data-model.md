# Core Data Model

Primary hierarchy:

organizations
→ users / teams
→ clients
→ workspaces
→ companies
→ contacts
→ deals
→ activities

Core tables:
- organizations
- users
- teams
- team_members
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
- custom_properties
- custom_property_values
- integration_connections
- integration_credentials
- import_jobs
- enrichment_jobs
- ai_jobs
- audit_logs
- suppression_entries

Companies are the centre of the CRM.
Contacts, deals, activities, files, tasks, research, and campaigns attach to companies.
Associations allow flexible HubSpot-style relationships.
