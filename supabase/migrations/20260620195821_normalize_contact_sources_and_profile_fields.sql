alter table public.contacts
  add column if not exists summary text,
  add column if not exists tagline text,
  add column if not exists skills jsonb not null default '[]'::jsonb;

update public.contacts
set data_source = 'cognism',
    source_note = case
      when data_source in ('imported_csv', 'folder_crm_workbook_import', 'sample_appointment_import') then 'Cognism import'
      else coalesce(nullif(source_note, ''), 'Cognism search result')
    end
where data_source in ('cognism_preview', 'cognism_redeem')
  or data_source in ('imported_csv', 'folder_crm_workbook_import', 'sample_appointment_import')
  or (
    cognism_contact_id is not null
    and trim(cognism_contact_id) <> ''
    and coalesce(data_source, '') in ('', 'paceops_db', 'data_portal')
  );

update public.lead_lists list
set leads = coalesce((
  select jsonb_agg(
    case
      when lead.value ->> 'dataSource' in ('cognism_preview', 'cognism_redeem', 'imported_csv', 'folder_crm_workbook_import', 'sample_appointment_import')
        then jsonb_set(lead.value, '{dataSource}', '"cognism"'::jsonb, true)
      else lead.value
    end
    order by lead.ordinality
  )
  from jsonb_array_elements(list.leads) with ordinality as lead(value, ordinality)
), '[]'::jsonb)
where exists (
  select 1
  from jsonb_array_elements(list.leads) as lead(value)
  where lead.value ->> 'dataSource' in ('cognism_preview', 'cognism_redeem', 'imported_csv', 'folder_crm_workbook_import', 'sample_appointment_import')
);

do $$
begin
  if to_regclass('public.lead_contact_database') is not null then
    alter table public.lead_contact_database
      add column if not exists summary text,
      add column if not exists tagline text,
      add column if not exists skills jsonb not null default '[]'::jsonb;

    alter table public.lead_contact_database
      drop constraint if exists lead_contact_database_data_source_check;

    alter table public.lead_contact_database
      add constraint lead_contact_database_data_source_check
      check (
        data_source in (
          'manual',
          'linkedin_manual',
          'paceops_db',
          'imported_csv',
          'cognism_preview',
          'cognism_redeem',
          'cognism',
          'lemlist',
          'google_places_location',
          'location_finder',
          'locker_finder'
        )
      );

    update public.lead_contact_database
    set data_source = 'cognism',
        source_note = case
          when data_source in ('imported_csv', 'folder_crm_workbook_import', 'sample_appointment_import') then 'Cognism import'
          else coalesce(nullif(source_note, ''), 'Cognism search result')
        end
    where data_source in ('cognism_preview', 'cognism_redeem')
      or data_source in ('imported_csv', 'folder_crm_workbook_import', 'sample_appointment_import')
      or (
        cognism_contact_id is not null
        and trim(cognism_contact_id) <> ''
        and coalesce(data_source, '') in ('', 'paceops_db', 'data_portal')
      );
  end if;
end $$;
