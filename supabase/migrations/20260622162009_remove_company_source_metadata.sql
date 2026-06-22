update public.companies
set custom_fields = coalesce(custom_fields, '{}'::jsonb)
  - 'source'
  - 'source_file'
  - 'source_sheet'
  - 'source_row'
  - 'source_filename'
where coalesce(custom_fields, '{}'::jsonb) ?| array[
  'source',
  'source_file',
  'source_sheet',
  'source_row',
  'source_filename'
];
