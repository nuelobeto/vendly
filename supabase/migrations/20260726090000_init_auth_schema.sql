-- Vendly: initial auth schema
--
-- Registration collects email + password only. The onboarding flow that follows
-- fills in the profile (first/last name, phone, avatar) and then the store
-- (name, slug, logo, currency). Both tables are created here so onboarding has
-- somewhere to write, and `profiles.onboarding_step` tracks where a user is.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.onboarding_step as enum ('profile', 'store', 'complete');

create type public.currency as enum ('USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users row, created automatically by trigger
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  onboarding_step public.onboarding_step not null default 'profile',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_first_name_len check (
    first_name is null or char_length(first_name) between 1 and 80
  ),
  constraint profiles_last_name_len check (
    last_name is null or char_length(last_name) between 1 and 80
  ),
  -- E.164, validated again in the app layer.
  constraint profiles_phone_format check (
    phone is null or phone ~ '^\+[1-9]\d{7,14}$'
  )
);

comment on table public.profiles is
  'Merchant profile. Row is created by handle_new_user() on signup and filled in during onboarding.';

-- ---------------------------------------------------------------------------
-- stores — created during the store step of onboarding
-- ---------------------------------------------------------------------------

create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  currency public.currency not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stores_name_len check (char_length(name) between 2 and 120),
  -- Lowercase alphanumeric plus internal hyphens; becomes vendly.shop/<slug>.
  constraint stores_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$')
);

create index stores_owner_id_idx on public.stores (owner_id);

comment on table public.stores is
  'A merchant storefront. slug is globally unique and maps to vendly.shop/<slug>.';

-- ---------------------------------------------------------------------------
-- Reserved slugs — keeps store URLs from colliding with app routes
-- ---------------------------------------------------------------------------

create table public.reserved_slugs (
  slug text primary key
);

insert into public.reserved_slugs (slug) values
  ('admin'), ('api'), ('auth'), ('app'), ('about'), ('blog'), ('billing'),
  ('checkout'), ('dashboard'), ('docs'), ('help'), ('login'), ('logout'),
  ('onboarding'), ('pricing'), ('privacy'), ('register'), ('settings'),
  ('shop'), ('signin'), ('signup'), ('status'), ('store'), ('support'),
  ('terms'), ('vendly'), ('www');

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger stores_touch_updated_at
  before update on public.stores
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile whenever a user signs up
--
-- SECURITY DEFINER because the inserting role during signup is not the new
-- user. search_path is pinned to defeat search_path hijacking.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Slug availability, callable from the client during store onboarding
--
-- SECURITY DEFINER so anon can check availability without being able to read
-- the stores table itself (which would leak the full merchant list).
-- ---------------------------------------------------------------------------

create or replace function public.is_slug_available(candidate text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    candidate ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'
    and not exists (select 1 from public.reserved_slugs r where r.slug = candidate)
    and not exists (select 1 from public.stores s where s.slug = candidate);
$$;

grant execute on function public.is_slug_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Both tables are deny-by-default. Note there is no INSERT policy on profiles:
-- rows only ever come from handle_new_user(), which bypasses RLS.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.reserved_slugs enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Storefronts are public — anyone can read them to render a shop page.
create policy "Anyone can read stores"
  on public.stores for select
  to anon, authenticated
  using (true);

create policy "Owners can create their store"
  on public.stores for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their store"
  on public.stores for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their store"
  on public.stores for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- reserved_slugs is readable only through is_slug_available(); no policies.
