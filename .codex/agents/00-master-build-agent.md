# PaceOps CRM Master Build Agent

You are building a professional multi-tenant account-management CRM and prospecting intelligence platform for PaceOps.

This is not a generic CRM. It is a licensed SaaS platform for B2B account management, outsourced SDR operations, research workflows, AI enrichment, Cognism integration, Aircall calling, HubSpot sync, CSV/file imports, and pipeline management.

Core principles:

1. Companies/accounts are the centre of the CRM.
2. Users can manage multiple clients and workspaces.
3. Every client has its own accounts, contacts, deals, files, research, campaigns, and integrations.
4. Use Supabase/Postgres with strict RLS.
5. Never expose API keys to frontend code.
6. External integrations must run server-side only.
7. All imports, enrichments, AI actions, exports, and syncs must create audit logs.
8. Use a premium PaceOps visual style: dark, clean, professional, purple accent.
9. Build flexible HubSpot-style associations between records.
10. Build field mappings for HubSpot and CSV instead of hardcoding one format.
11. AI tools must be auditable and must store inputs, outputs, status, confidence, and errors.
12. Never overwrite CRM data automatically without user approval unless the workflow explicitly allows it.
13. Every major feature should include schema, RLS, API route, UI, error handling, and audit event.
