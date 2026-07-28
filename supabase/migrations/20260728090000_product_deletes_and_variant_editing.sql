-- Two changes:
--   1. Deleting a product is owner/admin only. Members may build the catalogue;
--      destroying part of it is a different kind of act.
--   2. save_product_variants() — atomically replace a product's options and
--      reconcile its variants.

-- ---------------------------------------------------------------------------
-- 1. Split the blanket policy so DELETE can differ from the rest
-- ---------------------------------------------------------------------------

drop policy if exists "Members manage products" on public.products;

drop policy if exists "Members create products" on public.products;
create policy "Members create products"
  on public.products for insert
  to authenticated
  with check (public.is_store_member(store_id));

drop policy if exists "Members update products" on public.products;
create policy "Members update products"
  on public.products for update
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists "Owners and admins delete products" on public.products;
create policy "Owners and admins delete products"
  on public.products for delete
  to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

-- ---------------------------------------------------------------------------
-- 2. Replacing options and variants together
--
-- The source contract excluded options from PATCH because "an options edit
-- would have to rewrite every variant to match, which isn't a PATCH". That is
-- exactly right — so this isn't a patch. It takes the whole desired state and
-- reconciles in one transaction.
--
-- SECURITY INVOKER: RLS still decides who may write. Atomicity is the only
-- reason this is a function.
-- ---------------------------------------------------------------------------

create or replace function public.save_product_variants(
  p_product_id uuid,
  p_options jsonb,
  p_variants jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_option jsonb;
  v_variant jsonb;
  v_position smallint := 0;
  v_keep uuid[];
  v_variant_id uuid;
  v_option_count integer;
begin
  if jsonb_array_length(coalesce(p_variants, '[]'::jsonb)) = 0 then
    raise exception 'variants_required: a product needs at least one variant'
      using errcode = '23514';
  end if;

  -- Ids the caller intends to keep. Anything else belonging to this product is
  -- being removed.
  select coalesce(array_agg((value ->> 'id')::uuid), '{}')
    into v_keep
  from jsonb_array_elements(p_variants) as value
  where value ->> 'id' is not null;

  delete from public.product_variants
   where product_id = p_product_id
     and not (id = any(v_keep));

  /*
   * Options are replaced wholesale. Existing variants briefly hold arrays that
   * no longer match — harmless, because set_variant_title() only fires on
   * variant writes, and every surviving variant is rewritten below.
   */
  delete from public.product_options where product_id = p_product_id;

  for v_option in
    select * from jsonb_array_elements(coalesce(p_options, '[]'::jsonb))
  loop
    insert into public.product_options (product_id, name, values, position)
    values (
      p_product_id,
      v_option ->> 'name',
      (select array_agg(value::text)
         from jsonb_array_elements_text(v_option -> 'values') as value),
      v_position
    );
    v_position := v_position + 1;
  end loop;

  select count(*) into v_option_count
  from public.product_options where product_id = p_product_id;

  for v_variant in select * from jsonb_array_elements(p_variants)
  loop
    v_variant_id := nullif(v_variant ->> 'id', '')::uuid;

    if v_variant_id is not null then
      update public.product_variants set
        -- Always assigned, so the title trigger re-derives against the new
        -- option set rather than leaving a stale "Small / Red" behind.
        options = coalesce(
          (select array_agg(value::text)
             from jsonb_array_elements_text(v_variant -> 'options') as value),
          '{}'
        ),
        sku = nullif(v_variant ->> 'sku', ''),
        barcode = nullif(v_variant ->> 'barcode', ''),
        price = (v_variant ->> 'price')::numeric,
        compare_at_price = (v_variant ->> 'compareAtPrice')::numeric,
        -- cost_per_item is deliberately absent here. Preserving it would mean
        -- reading it (coalesce(new, cost_per_item)), and SELECT on that column
        -- is revoked from authenticated — so the whole UPDATE would fail with
        -- "permission denied". It is written blind below, only when supplied.
        inventory_quantity = coalesce(
          (v_variant ->> 'inventoryQuantity')::integer, inventory_quantity
        ),
        continue_selling_when_out_of_stock = coalesce(
          (v_variant ->> 'continueSellingWhenOutOfStock')::boolean,
          continue_selling_when_out_of_stock
        ),
        requires_shipping = coalesce(
          (v_variant ->> 'requiresShipping')::boolean, requires_shipping
        ),
        weight = coalesce((v_variant ->> 'weight')::numeric, weight),
        weight_unit = coalesce(nullif(v_variant ->> 'weightUnit', ''), weight_unit),
        hs_code = nullif(v_variant ->> 'hsCode', '')
      where id = v_variant_id and product_id = p_product_id;

      -- Blind write: assigning needs UPDATE on the column, not SELECT. Omitting
      -- the key leaves the stored cost untouched, which is what lets a staff
      -- member (who cannot read it) edit a variant without clobbering it.
      if v_variant ? 'costPerItem' then
        update public.product_variants
           set cost_per_item = (v_variant ->> 'costPerItem')::numeric
         where id = v_variant_id and product_id = p_product_id;
      end if;
    else
      insert into public.product_variants (
        product_id, options, sku, barcode, price, compare_at_price,
        cost_per_item, inventory_quantity, continue_selling_when_out_of_stock,
        requires_shipping, weight, weight_unit, hs_code
      )
      values (
        p_product_id,
        coalesce(
          (select array_agg(value::text)
             from jsonb_array_elements_text(v_variant -> 'options') as value),
          '{}'
        ),
        nullif(v_variant ->> 'sku', ''),
        nullif(v_variant ->> 'barcode', ''),
        (v_variant ->> 'price')::numeric,
        (v_variant ->> 'compareAtPrice')::numeric,
        (v_variant ->> 'costPerItem')::numeric,
        coalesce((v_variant ->> 'inventoryQuantity')::integer, 0),
        coalesce((v_variant ->> 'continueSellingWhenOutOfStock')::boolean, false),
        coalesce((v_variant ->> 'requiresShipping')::boolean, true),
        coalesce((v_variant ->> 'weight')::numeric, 0),
        coalesce(nullif(v_variant ->> 'weightUnit', ''), 'kg'),
        nullif(v_variant ->> 'hsCode', '')
      );
    end if;
  end loop;

  -- A caller could pass ids that don't belong to this product; if the updates
  -- matched nothing we'd silently end up with no variants at all.
  if not exists (
    select 1 from public.product_variants where product_id = p_product_id
  ) then
    raise exception 'variants_required: a product needs at least one variant'
      using errcode = '23514';
  end if;

  perform 1 from public.products where id = p_product_id;
end;
$$;

revoke execute on function public.save_product_variants(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_product_variants(uuid, jsonb, jsonb)
  to authenticated;
