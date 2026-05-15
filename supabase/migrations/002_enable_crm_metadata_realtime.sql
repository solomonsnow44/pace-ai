-- Broadcast organization metadata updates so the shared CRM dataset syncs across open sessions.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'organizations'
  ) then
    alter publication supabase_realtime add table public.organizations;
  end if;
end $$;
