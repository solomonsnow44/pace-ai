alter table public.contacts
  add column if not exists direct_dial text;

create index if not exists contacts_direct_dial_idx
  on public.contacts (organization_id, direct_dial)
  where direct_dial is not null and direct_dial <> '';

create index if not exists lead_contact_database_direct_dial_idx
  on public.lead_contact_database (organization_id, manual_direct_dial)
  where manual_direct_dial is not null and manual_direct_dial <> '';
