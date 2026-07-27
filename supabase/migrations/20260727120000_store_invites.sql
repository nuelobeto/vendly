-- Store invitations.
--
-- Invites are our own records, not Supabase auth invites. That keeps the
-- existing register/confirm flow as the single auth path and avoids needing a
-- service_role key in the app. See walkthrough/store-invites-design.md.
--
-- Tokens are generated and hashed in the application (Node crypto, sha256) and
-- only the hash is stored — a leaked backup must not hand over live invites.
-- Hashing deliberately does NOT use pgcrypto: on Supabase that lives in the
-- `extensions` schema and would not be on the default search_path, the same
-- trap that broke uuid_generate_v4() in the first migration.

create table public.store_invites (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  email text not null,
  role public.store_role not null default 'staff',
  token_hash text not null unique,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),

  constraint store_invites_email_format check (
    email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  -- Ownership transfer is a separate, deliberate act — never an invite.
  constraint store_invites_role_not_owner check (role <> 'owner')
);

create index store_invites_store_id_idx on public.store_invites (store_id);

-- At most one live invite per address per store. Partial, so accepting or
-- revoking frees the address to be invited again.
create unique index store_invites_pending_unique
  on public.store_invites (store_id, lower(email))
  where accepted_at is null and revoked_at is null;

comment on table public.store_invites is
  'Pending invitations to join a store. Only the token hash is stored.';

-- ---------------------------------------------------------------------------
-- RLS: only owners and admins of the store can see or manage its invites.
-- The invitee never reads this table directly — they go through the two
-- SECURITY DEFINER functions below.
-- ---------------------------------------------------------------------------

alter table public.store_invites enable row level security;

create policy "Owners and admins can read invites"
  on public.store_invites for select
  to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

create policy "Owners and admins can create invites"
  on public.store_invites for insert
  to authenticated
  with check (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
    and invited_by = (select auth.uid())
  );

create policy "Owners and admins can revoke invites"
  on public.store_invites for update
  to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  )
  with check (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
  );

-- ---------------------------------------------------------------------------
-- Public preview
--
-- Deliberately narrow: store name, logo, role and inviter only. No contact
-- details, no member list, no revenue. Anyone holding the link sees this, so it
-- returns the minimum needed to decide whether to accept.
-- ---------------------------------------------------------------------------

create or replace function public.get_store_invite(p_token_hash text)
returns table (
  invite_id uuid,
  store_name text,
  store_slug text,
  store_logo_url text,
  invite_role public.store_role,
  invite_email text,
  invited_by_name text,
  status text
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    i.id,
    s.name,
    s.slug,
    s.logo_url,
    i.role,
    i.email,
    nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at <= now() then 'expired'
      else 'pending'
    end
  from public.store_invites i
  join public.stores s on s.id = i.store_id
  left join public.profiles p on p.id = i.invited_by
  where i.token_hash = p_token_hash;
$$;

-- ---------------------------------------------------------------------------
-- Acceptance
--
-- SECURITY DEFINER is required, not a convenience: the store_members INSERT
-- policy demands the caller already be an owner or admin, which an invitee by
-- definition is not. This function is the only sanctioned way in.
--
-- Distinct exceptions per failure so the UI can explain what went wrong.
-- ---------------------------------------------------------------------------

create or replace function public.accept_store_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.store_invites%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_invite
  from public.store_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'invite_revoked' using errcode = 'P0002';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'invite_already_accepted' using errcode = 'P0002';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'invite_expired' using errcode = 'P0002';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  -- The invite is for a specific address; never silently join the wrong one.
  if lower(v_email) is distinct from lower(v_invite.email) then
    raise exception 'invite_email_mismatch' using errcode = '42501';
  end if;

  insert into public.store_members (store_id, user_id, role)
  values (v_invite.store_id, auth.uid(), v_invite.role)
  on conflict (store_id, user_id) do nothing;

  update public.store_invites
     set accepted_at = now(),
         accepted_by = auth.uid()
   where id = v_invite.id;

  return v_invite.store_id;
end;
$$;

-- Least privilege. Revoking from PUBLIC alone is not enough on Supabase:
-- default privileges grant EXECUTE to anon and authenticated directly.
revoke execute on function public.get_store_invite(text) from public, anon, authenticated;
revoke execute on function public.accept_store_invite(text) from public, anon, authenticated;

-- The preview is intentionally anon-readable: the invitee may not have an
-- account yet, and must be able to see who is inviting them before signing up.
grant execute on function public.get_store_invite(text) to anon, authenticated;

-- Accepting requires a session.
grant execute on function public.accept_store_invite(text) to authenticated;
