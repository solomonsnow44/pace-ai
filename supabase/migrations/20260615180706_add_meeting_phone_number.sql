alter table public.meetings
  add column if not exists phone_number text;

create index if not exists meetings_phone_number_idx
  on public.meetings (organization_id, phone_number)
  where phone_number is not null and trim(phone_number) <> '';
