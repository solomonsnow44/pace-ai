# HubSpot Integration

Purpose:
Import/export companies, contacts, deals, and activities between PaceOps CRM and HubSpot.

Rules:
- Use field mappings.
- Validate payloads before sending.
- Use AI repair only as an assistive layer.
- Store HubSpot object IDs.
- Log sync jobs and sync errors.
- Support preview/dry-run mode before writing.

Never expose HubSpot private app token in frontend.
