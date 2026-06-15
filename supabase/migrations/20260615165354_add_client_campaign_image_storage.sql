insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-campaign-images',
  'client-campaign-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "client_campaign_images_public_read" on storage.objects;
create policy "client_campaign_images_public_read"
on storage.objects
for select
using (bucket_id = 'client-campaign-images');

drop policy if exists "client_campaign_images_workspace_insert" on storage.objects;
create policy "client_campaign_images_workspace_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'client-campaign-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "client_campaign_images_workspace_update" on storage.objects;
create policy "client_campaign_images_workspace_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'client-campaign-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'client-campaign-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "client_campaign_images_workspace_delete" on storage.objects;
create policy "client_campaign_images_workspace_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'client-campaign-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id::text = (storage.foldername(name))[1]
  )
);
