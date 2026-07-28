-- Products, options, variants and images.
--
-- Adapted from an existing storefront contract that ran against a .NET API with
-- Cloudinary. The shape is kept; the mechanics are moved onto Postgres:
--   * the API's authorisation becomes RLS keyed on store_members
--   * Cloudinary's public_id becomes a Supabase Storage object path
--   * derived fields the API computed (variant title) become triggers, so they
--     hold regardless of which client writes
--
-- Enum values are lowercase to match store_role and onboarding_step. The source
-- contract used "Draft"/"Active"/"Archived"; casing is normalised rather than
-- carried over, and the TypeScript type follows the database.

create type public.product_status as enum ('draft', 'active', 'archived');

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  title text not null,
  handle text not null,
  description_html text,
  vendor text not null default '',
  product_type text,
  status public.product_status not null default 'draft',
  is_gift_card boolean not null default false,
  seo_title text,
  seo_description text,
  featured_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_title_len check (char_length(title) between 1 and 255),
  -- Same shape as a store slug: this becomes /<store>/products/<handle>.
  constraint products_handle_format check (
    handle ~ '^[a-z0-9](?:[a-z0-9-]{0,253}[a-z0-9])?$'
  )
);

-- Handles are unique per store, not globally — two shops may both sell a "tote".
create unique index products_store_handle_key
  on public.products (store_id, handle);
create index products_store_status_idx on public.products (store_id, status);
create index products_store_created_idx on public.products (store_id, created_at desc);

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- product_options
--
-- An option's position is its index in the product's option list, and variants'
-- `options` arrays line up against that order — so position is explicit here
-- rather than left to insertion order.
-- ---------------------------------------------------------------------------

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  values text[] not null,
  position smallint not null,

  constraint product_options_name_len check (char_length(name) between 1 and 60),
  constraint product_options_values_present check (cardinality(values) > 0),
  -- Three is the ceiling the source contract set, and it's what keeps the
  -- variant matrix from exploding.
  constraint product_options_position_range check (position between 0 and 2)
);

create unique index product_options_product_position_key
  on public.product_options (product_id, position);
create unique index product_options_product_name_key
  on public.product_options (product_id, lower(name));

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_text text,
  position smallint not null default 0,
  -- Supabase Storage object path, standing in for Cloudinary's public_id.
  -- Kept so the object can be deleted when the row is; null for a remote image.
  storage_key text,
  created_at timestamptz not null default now()
);

create index product_images_product_idx
  on public.product_images (product_id, position);

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null default '',
  -- One value per product option, in the product's option order.
  options text[] not null default '{}',
  image_id uuid references public.product_images (id) on delete set null,
  sku text,
  barcode text,
  price numeric(12, 2) not null,
  compare_at_price numeric(12, 2),
  -- Wholesale cost. Readable only by owners and admins — see the column grants
  -- at the bottom of this file.
  cost_per_item numeric(12, 2),
  inventory_quantity integer not null default 0,
  continue_selling_when_out_of_stock boolean not null default false,
  requires_shipping boolean not null default true,
  weight numeric(10, 3) not null default 0,
  weight_unit text not null default 'kg',
  hs_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_variants_price_positive check (price >= 0),
  constraint product_variants_compare_positive check (
    compare_at_price is null or compare_at_price >= 0
  ),
  constraint product_variants_cost_positive check (
    cost_per_item is null or cost_per_item >= 0
  ),
  constraint product_variants_weight_positive check (weight >= 0),
  constraint product_variants_weight_unit check (
    weight_unit in ('kg', 'g', 'lb', 'oz')
  )
);

create index product_variants_product_idx on public.product_variants (product_id);
create unique index product_variants_sku_key
  on public.product_variants (product_id, sku) where sku is not null;

create trigger product_variants_touch_updated_at
  before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Derived variant title
--
-- The source API computed this. Doing it in a trigger means it holds no matter
-- which client writes, and there is no way for title and options to disagree.
-- ---------------------------------------------------------------------------

create or replace function public.set_variant_title()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_option_count integer;
begin
  select count(*) into v_option_count
  from public.product_options where product_id = new.product_id;

  -- A variant must carry exactly one value per product option, or the option
  -- order it is meant to line up against is meaningless.
  if cardinality(new.options) <> v_option_count then
    raise exception
      'variant_options_mismatch: product has % option(s), variant supplied %',
      v_option_count, cardinality(new.options)
      using errcode = '23514';
  end if;

  if v_option_count = 0 then
    -- Matches the source contract's sentinel for a product that doesn't vary.
    new.title := 'Default Title';
  else
    new.title := array_to_string(new.options, ' / ');
  end if;

  return new;
end;
$$;

create trigger product_variants_set_title
  before insert or update of options on public.product_variants
  for each row execute function public.set_variant_title();

-- A variant's image must belong to the same product.
create or replace function public.check_variant_image()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.image_id is not null and not exists (
    select 1 from public.product_images
    where id = new.image_id and product_id = new.product_id
  ) then
    raise exception 'variant_image_foreign: image belongs to another product'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger product_variants_check_image
  before insert or update of image_id on public.product_variants
  for each row execute function public.check_variant_image();

-- ---------------------------------------------------------------------------
-- Handle generation
-- ---------------------------------------------------------------------------

create or replace function public.generate_product_handle(
  p_store_id uuid,
  p_title text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base text;
  candidate text;
  suffix int := 1;
begin
  base := left(public.slugify_text(p_title), 200);
  if length(base) = 0 then
    base := 'product';
  end if;

  candidate := base;

  while exists (
    select 1 from public.products
    where store_id = p_store_id and handle = candidate
  ) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
    if suffix > 999 then
      raise exception 'could not generate a unique handle for %', p_title;
    end if;
  end loop;

  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Reads split two ways: the public storefront sees only `active` products, and
-- store members see everything belonging to their store. Writes are limited to
-- owners and admins — staff can work on orders, not the catalogue.
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;

create policy "Active products are public"
  on public.products for select
  to anon, authenticated
  using (status = 'active');

create policy "Members see their store's products"
  on public.products for select
  to authenticated
  using (public.is_store_member(store_id));

create policy "Owners and admins manage products"
  on public.products for all
  to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  )
  with check (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

/**
 * Child rows inherit their parent's visibility.
 *
 * SECURITY DEFINER so the check reads `products` without re-entering its RLS —
 * which would otherwise apply the public "active only" policy and hide a draft
 * product's own variants from the people editing it.
 */
create or replace function public.can_read_product(p_product_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.products p
    where p.id = p_product_id
      and (p.status = 'active' or public.is_store_member(p.store_id))
  );
$$;

create or replace function public.can_write_product(p_product_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.products p
    where p.id = p_product_id
      and public.has_store_role(
        p.store_id, array['owner', 'admin']::public.store_role[]
      )
  );
$$;

revoke execute on function public.can_read_product(uuid) from public, anon, authenticated;
revoke execute on function public.can_write_product(uuid) from public, anon, authenticated;
revoke execute on function public.generate_product_handle(uuid, text) from public, anon, authenticated;
grant execute on function public.can_read_product(uuid) to anon, authenticated;
grant execute on function public.can_write_product(uuid) to anon, authenticated;
grant execute on function public.generate_product_handle(uuid, text) to authenticated;

create policy "Read options with the product"
  on public.product_options for select
  to anon, authenticated
  using (public.can_read_product(product_id));

create policy "Write options with the product"
  on public.product_options for all
  to authenticated
  using (public.can_write_product(product_id))
  with check (public.can_write_product(product_id));

create policy "Read images with the product"
  on public.product_images for select
  to anon, authenticated
  using (public.can_read_product(product_id));

create policy "Write images with the product"
  on public.product_images for all
  to authenticated
  using (public.can_write_product(product_id))
  with check (public.can_write_product(product_id));

create policy "Read variants with the product"
  on public.product_variants for select
  to anon, authenticated
  using (public.can_read_product(product_id));

create policy "Write variants with the product"
  on public.product_variants for all
  to authenticated
  using (public.can_write_product(product_id))
  with check (public.can_write_product(product_id));

-- ---------------------------------------------------------------------------
-- cost_per_item is owner/admin only
--
-- RLS is row-level and cannot hide a column, so this uses Postgres column
-- privileges: revoke SELECT on the table, then grant it back on every column
-- except cost_per_item. A staff member selecting it gets "permission denied for
-- column", not a null they might mistake for "not set".
--
-- Reading the real value goes through get_variant_costs() below.
-- ---------------------------------------------------------------------------

revoke select on public.product_variants from anon, authenticated;

grant select (
  id, product_id, title, options, image_id, sku, barcode, price,
  compare_at_price, inventory_quantity, continue_selling_when_out_of_stock,
  requires_shipping, weight, weight_unit, hs_code, created_at, updated_at
) on public.product_variants to anon, authenticated;

-- Writes still need the column; the policies above decide who may write.
grant insert, update, delete on public.product_variants to authenticated;

/**
 * Wholesale cost for a product's variants, for owners and admins only.
 *
 * Returns no rows for anyone else rather than nulls, so "you may not see this"
 * is distinguishable from "not set" — the ambiguity the source contract called
 * out as a wart.
 */
create or replace function public.get_variant_costs(p_product_id uuid)
returns table (variant_id uuid, cost_per_item numeric)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select v.id, v.cost_per_item
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.product_id = p_product_id
    and public.has_store_role(
      p.store_id, array['owner', 'admin']::public.store_role[]
    );
$$;

revoke execute on function public.get_variant_costs(uuid) from public, anon, authenticated;
grant execute on function public.get_variant_costs(uuid) to authenticated;

comment on table public.products is
  'Catalogue items. Public reads see only active products; members see all of their store''s.';
comment on column public.product_variants.cost_per_item is
  'Wholesale cost. Not SELECT-able by anon/authenticated directly — use get_variant_costs().';
