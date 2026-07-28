-- Product image storage.
--
-- Keyed <store-id>/<product-or-temp>/<file> rather than by user: a catalogue
-- image belongs to the store, and any owner or admin must be able to replace
-- one an colleague uploaded. The avatar/logo buckets key by user because those
-- are personal; this one deliberately does not.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Product images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

/**
 * The first path segment is the store id, and writes require owner/admin on
 * that store. `::uuid` would throw on a malformed path, so the comparison is
 * done as text against the role check's own cast.
 */
create policy "Store managers can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.has_store_role(
      nullif((storage.foldername(name))[1], '')::uuid,
      array['owner', 'admin']::public.store_role[]
    )
  );

create policy "Store managers can replace product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.has_store_role(
      nullif((storage.foldername(name))[1], '')::uuid,
      array['owner', 'admin']::public.store_role[]
    )
  );

create policy "Store managers can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.has_store_role(
      nullif((storage.foldername(name))[1], '')::uuid,
      array['owner', 'admin']::public.store_role[]
    )
  );
