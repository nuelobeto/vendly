-- Let teammates see each other's names on the team page.
--
-- profiles SELECT is "own row only", so joining profiles from store_members
-- returns null for everyone but the caller — which is why the team list showed
-- every other member as "Teammate".
--
-- Fixed with a curated SECURITY DEFINER projection rather than by widening the
-- profiles policy. Broadening that policy would also expose `phone`, which is
-- personal and has nothing to do with showing a name in a roster.

create or replace function public.get_store_team(p_store_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  member_role public.store_role,
  first_name text,
  last_name text,
  avatar_url text,
  email text,
  joined_at timestamptz
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    m.id,
    m.user_id,
    m.role,
    p.first_name,
    p.last_name,
    p.avatar_url,
    u.email,
    m.created_at
  from public.store_members m
  left join public.profiles p on p.id = m.user_id
  left join auth.users u on u.id = m.user_id
  -- The caller must belong to the store they're asking about. Without this the
  -- function would hand any authenticated user any store's roster.
  where m.store_id = p_store_id
    and public.is_store_member(p_store_id)
  order by
    -- Owner first, then admins, then staff, then by join order.
    case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    m.created_at;
$$;

-- Revoking from PUBLIC alone is not enough on Supabase: default privileges
-- grant EXECUTE to anon and authenticated directly.
revoke execute on function public.get_store_team(uuid) from public, anon, authenticated;
grant execute on function public.get_store_team(uuid) to authenticated;
