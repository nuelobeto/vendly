-- Logo storage for the store step of onboarding.
--
-- Keyed <owner-id>/<filename> rather than <store-id>/… deliberately: the logo
-- is uploaded before the store row exists, so the store id isn't available yet.
-- Owner id is, and it's what the policy needs anyway.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-logos',
  'store-logos',
  true,                                   -- logos render on public storefronts
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Store logos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'store-logos');

create policy "Owners can upload their store logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can replace their store logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'store-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can delete their store logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
