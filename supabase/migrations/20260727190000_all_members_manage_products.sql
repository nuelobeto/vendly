-- All store members can manage the catalogue.
--
-- Products were owner/admin-only, mirroring store settings. Staff are hired to
-- work the catalogue, so product writes move to plain membership. Store
-- settings, team management and invites are unchanged — those stay owner/admin.
--
-- cost_per_item stays owner/admin-readable. That is deliberate but does create
-- a wrinkle worth naming: staff can WRITE a cost (the column grant is
-- table-level for INSERT/UPDATE) and then never read it back. The editor hides
-- the field for staff so they aren't typing into a box they can't see again.

drop policy "Owners and admins manage products" on public.products;

create policy "Members manage products"
  on public.products for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- Child rows follow the parent, so only this helper needs to change.
create or replace function public.can_write_product(p_product_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.products p
    where p.id = p_product_id and public.is_store_member(p.store_id)
  );
$$;

-- Product image uploads follow the same rule.
drop policy "Store managers can upload product images" on storage.objects;
drop policy "Store managers can replace product images" on storage.objects;
drop policy "Store managers can delete product images" on storage.objects;

create policy "Members can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_store_member(nullif((storage.foldername(name))[1], '')::uuid)
  );

create policy "Members can replace product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_member(nullif((storage.foldername(name))[1], '')::uuid)
  );

create policy "Members can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_member(nullif((storage.foldername(name))[1], '')::uuid)
  );
