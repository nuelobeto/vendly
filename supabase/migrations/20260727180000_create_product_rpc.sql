-- Transactional product creation.
--
-- A product, its options, images and variants span four tables. Doing that as
-- four PostgREST calls is not atomic: a rejected variant would leave an orphan
-- product with no way to sell it. The source contract said images were
-- "attached in the same transaction as the product" — this is what makes that
-- true here.
--
-- SECURITY INVOKER, not DEFINER: every insert should still go through the RLS
-- policies, so a caller without owner/admin on the store is refused by the same
-- rules that guard direct writes. The function exists for atomicity, not to
-- bypass authorisation.

create or replace function public.create_product(p_store_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_product_id uuid;
  v_handle text;
  v_option jsonb;
  v_image jsonb;
  v_variant jsonb;
  v_position smallint := 0;
  v_image_ids uuid[] := '{}';
  v_image_index integer;
begin
  v_handle := nullif(trim(coalesce(p_payload ->> 'handle', '')), '');

  if v_handle is null then
    v_handle := public.generate_product_handle(
      p_store_id, p_payload ->> 'title'
    );
  end if;

  insert into public.products (
    store_id, title, handle, description_html, vendor, product_type,
    status, is_gift_card, seo_title, seo_description, featured_image_url
  )
  values (
    p_store_id,
    p_payload ->> 'title',
    v_handle,
    p_payload ->> 'descriptionHtml',
    coalesce(p_payload ->> 'vendor', ''),
    p_payload ->> 'productType',
    coalesce((p_payload ->> 'status')::public.product_status, 'draft'),
    coalesce((p_payload ->> 'isGiftCard')::boolean, false),
    p_payload ->> 'seoTitle',
    p_payload ->> 'seoDescription',
    p_payload ->> 'featuredImageUrl'
  )
  returning id into v_product_id;

  -- Options first: the variant trigger counts them to validate each variant.
  for v_option in
    select * from jsonb_array_elements(coalesce(p_payload -> 'options', '[]'::jsonb))
  loop
    insert into public.product_options (product_id, name, values, position)
    values (
      v_product_id,
      v_option ->> 'name',
      (select array_agg(value::text) from jsonb_array_elements_text(v_option -> 'values') as value),
      v_position
    );
    v_position := v_position + 1;
  end loop;

  v_position := 0;

  for v_image in
    select * from jsonb_array_elements(coalesce(p_payload -> 'images', '[]'::jsonb))
  loop
    insert into public.product_images (product_id, url, alt_text, position, storage_key)
    values (
      v_product_id,
      v_image ->> 'url',
      v_image ->> 'altText',
      coalesce((v_image ->> 'position')::smallint, v_position),
      v_image ->> 'storageKey'
    );
    v_position := v_position + 1;
  end loop;

  -- Ordered, so a variant can reference an image by its index in the payload
  -- rather than an id the caller cannot know before this call.
  select array_agg(id order by position, created_at)
    into v_image_ids
  from public.product_images where product_id = v_product_id;

  for v_variant in
    select * from jsonb_array_elements(coalesce(p_payload -> 'variants', '[]'::jsonb))
  loop
    v_image_index := (v_variant ->> 'imageIndex')::integer;

    insert into public.product_variants (
      product_id, options, image_id, sku, barcode, price, compare_at_price,
      cost_per_item, inventory_quantity, continue_selling_when_out_of_stock,
      requires_shipping, weight, weight_unit, hs_code
    )
    values (
      v_product_id,
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(v_variant -> 'options') as value),
        '{}'
      ),
      case
        when v_image_index is not null
         and v_image_index >= 0
         and v_image_index < coalesce(cardinality(v_image_ids), 0)
        then v_image_ids[v_image_index + 1]
      end,
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
  end loop;

  -- Default the featured image to the first gallery image when none was given,
  -- so a product always has something to render in a list.
  update public.products p
     set featured_image_url = (
       select url from public.product_images
       where product_id = v_product_id order by position, created_at limit 1
     )
   where p.id = v_product_id and p.featured_image_url is null;

  return v_product_id;
end;
$$;

revoke execute on function public.create_product(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_product(uuid, jsonb) to authenticated;
