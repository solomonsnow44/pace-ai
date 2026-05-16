alter table public.lead_contact_database
  add column if not exists hubspot_contact_id text,
  add column if not exists hubspot_exported_at timestamptz,
  add column if not exists hubspot_export_status text,
  add column if not exists hubspot_export_error text;

create index if not exists lead_contact_database_hubspot_contact_idx
  on public.lead_contact_database (organization_id, hubspot_contact_id)
  where hubspot_contact_id is not null and hubspot_contact_id <> '';
