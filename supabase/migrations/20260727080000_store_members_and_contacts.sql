-- Store identity, contact details, and team membership.
--
-- Four changes:
--   1. Store names are unique (case-insensitively)
--   2. Stores carry their own contact email/phone, defaulted from the owner
--   3. Slugs can be generated from the name when left blank
--   4. store_members links users to stores with a role

-- ---------------------------------------------------------------------------
-- 1. Unique store names
--
-- Case-insensitive: "Atelier Nord" and "atelier nord" are the same brand to a
-- buyer, so treating them as distinct would make the constraint decorative.
-- ---------------------------------------------------------------------------

create unique index stores_name_lower_key on public.stores (lower(name));

-- ---------------------------------------------------------------------------
-- 2. Store contact details
--
-- Separate from the owner's personal profile: a merchant may well want orders
-- going to hello@shop.com rather than their own inbox.
-- ---------------------------------------------------------------------------

alter table public.stores
  add column contact_email text,
  add column contact_phone text;

alter table public.stores
  add constraint stores_contact_email_format check (
    contact_email is null
    or contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  add constraint stores_contact_phone_format check (
    contact_phone is null or contact_phone ~ '^\+[1-9]\d{7,14}$'
  );

/**
 * Fills blank contact details from the owner on insert.
 *
 * SECURITY DEFINER because auth.users is not readable by the merchant's role.
 * search_path is pinned to defeat search_path hijacking.
 */
create or replace function public.set_store_contact_defaults()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.contact_email is null then
    select u.email into new.contact_email
    from auth.users u where u.id = new.owner_id;
  end if;

  if new.contact_phone is null then
    select p.phone into new.contact_phone
    from public.profiles p where p.id = new.owner_id;
  end if;

  return new;
end;
$$;

create trigger stores_set_contact_defaults
  before insert on public.stores
  for each row execute function public.set_store_contact_defaults();

-- ---------------------------------------------------------------------------
-- 3. Slug generation
--
-- Mirrors slugify() on the client, then walks -2, -3, … until it finds a free
-- one. SECURITY DEFINER so it can see reserved_slugs and stores.
-- ---------------------------------------------------------------------------

-- The `unaccent` extension isn't guaranteed, so fold the common Latin marks by
-- hand. Client-side slugify() uses NFD normalisation for the same purpose.
create or replace function public.unaccent_fallback(input text)
returns text
language sql
immutable
as $$
  select translate(
    input,
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝÑÇ',
    'aaaaaaeeeeiiiiooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYNC'
  );
$$;

create or replace function public.slugify_text(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(unaccent_fallback(input)),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

create or replace function public.generate_store_slug(base_name text)
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
  base := left(public.slugify_text(base_name), 55);

  -- Below the 3-char minimum the CHECK would reject it, so pad deterministically.
  if length(base) < 3 then
    base := base || 'shop';
  end if;

  candidate := base;

  while not public.is_slug_available(candidate) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix;

    if suffix > 999 then
      -- Astronomically unlikely; fail loudly rather than loop forever.
      raise exception 'could not generate a unique slug for %', base_name;
    end if;
  end loop;

  return candidate;
end;
$$;

grant execute on function public.generate_store_slug(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Store members
-- ---------------------------------------------------------------------------

create type public.store_role as enum ('owner', 'admin', 'staff');

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.store_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One membership per person per store; change the role, don't add a row.
  constraint store_members_unique_membership unique (store_id, user_id)
);

create index store_members_user_id_idx on public.store_members (user_id);
create index store_members_store_id_idx on public.store_members (store_id);

create trigger store_members_touch_updated_at
  before update on public.store_members
  for each row execute function public.touch_updated_at();

comment on table public.store_members is
  'Who can act on a store, and in what capacity. The owner row is created automatically.';

/** Every new store gets its owner as the first member. */
create or replace function public.handle_new_store()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.store_members (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (store_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger on_store_created
  after insert on public.stores
  for each row execute function public.handle_new_store();

-- ---------------------------------------------------------------------------
-- Membership helpers
--
-- SECURITY DEFINER is essential here: a policy ON store_members that queries
-- store_members directly would recurse infinitely. Reading through a definer
-- function bypasses RLS and breaks the cycle.
-- ---------------------------------------------------------------------------

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = p_store_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_store_role(
  p_store_id uuid,
  p_roles public.store_role[]
)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.role = any(p_roles)
  );
$$;

grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.has_store_role(uuid, public.store_role[]) to authenticated;

-- ---------------------------------------------------------------------------
-- store_members RLS
-- ---------------------------------------------------------------------------

alter table public.store_members enable row level security;

create policy "Members can see their store's team"
  on public.store_members for select
  to authenticated
  using (public.is_store_member(store_id));

create policy "Owners and admins can add members"
  on public.store_members for insert
  to authenticated
  with check (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

create policy "Owners and admins can change roles"
  on public.store_members for update
  to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  )
  with check (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

create policy "Owners and admins can remove members"
  on public.store_members for delete
  to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

-- ---------------------------------------------------------------------------
-- Let admins manage the store too, not just the owner_id holder
-- ---------------------------------------------------------------------------

drop policy "Owners can update their store" on public.stores;

create policy "Owners and admins can update the store"
  on public.stores for update
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.has_store_role(id, array['owner', 'admin']::public.store_role[])
  )
  with check (
    (select auth.uid()) = owner_id
    or public.has_store_role(id, array['owner', 'admin']::public.store_role[])
  );
