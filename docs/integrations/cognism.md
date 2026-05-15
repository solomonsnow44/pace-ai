# Cognism Integration

Purpose:
Use Cognism to search, preview, and enrich B2B contacts and accounts.

Flow:
1. User selects client/workspace.
2. User enters company names and target job titles.
3. Backend calls Cognism Search API.
4. System stores preview results.
5. User selects contacts to redeem.
6. Backend calls Cognism Redeem API.
7. System creates/updates companies and contacts.
8. System stores raw Cognism response.
9. System creates enrichment event and audit log.

Never expose Cognism API key in frontend.
