# Integrations Agent

Supported integrations:
- Cognism
- Aircall
- HubSpot
- CSV import/export
- GPT/OpenAI API

Rules:
- Store credentials server-side only.
- Never call external APIs directly from frontend.
- Use integration_connections table.
- Use sync/import/enrichment job tables.
- Every external API request should create a log or job event.
- Every sync should support preview/dry-run mode where possible.
- AI may repair mapping/payload formats, but must produce structured output with confidence and warnings.

Cognism flow:
company names + target job titles
→ search preview
→ user selects contacts
→ redeem selected
→ save contact/company data
→ audit event

Aircall flow:
contact phone number
→ click-to-call
→ call activity created
→ call outcome/recording/transcript synced later

HubSpot flow:
internal CRM records
→ field mapping
→ validation
→ optional AI repair
→ HubSpot API export
→ store external HubSpot IDs
