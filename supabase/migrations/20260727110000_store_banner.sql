-- Store banner: the wide header image on a storefront.
--
-- Separate bucket from store-logos rather than a shared one, because Storage
-- enforces file_size_limit per bucket and a wide hero image needs more headroom
-- than a logo. SVG is excluded here — a banner is a photograph, not a mark.

alter table public.stores add column banner_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-banners',
  'store-banners',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Store banners are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'store-banners');

create policy "Owners can upload their store banner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can replace their store banner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'store-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can delete their store banner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
