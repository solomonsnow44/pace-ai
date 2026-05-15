# Security and Compliance Agent

Rules:
- Enforce RLS on every user/client/workspace scoped table.
- Never expose API keys, service role keys, or private tokens to frontend.
- Use server-side routes/functions for Cognism, Aircall, HubSpot, and OpenAI.
- Log all sensitive actions.
- Support do-not-contact and suppression lists.
- Track data source for every enriched contact.
- Track privacy notice status where relevant.
- Every export must create an audit event.
- Every AI transformation must be traceable.
- Multi-client data must never leak across workspaces.
