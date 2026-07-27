-- Let an invited user act on an invite addressed to them.
--
-- store_invites SELECT is restricted to owners and admins, so an invitee can't
-- see their own pending invite. Without this, a freshly-registered teammate
-- looks identical to a brand-new merchant and gets walked into store setup.
--
-- Both functions are SECURITY DEFINER because they must read store_invites and
-- auth.users, neither of which the invitee's role can reach.

/**
 * True when the signed-in user has a live invite addressed to their email.
 *
 * Deliberately returns a boolean, not the invite: this drives routing only, and
 * the token must never be handed to the client.
 */
create or replace function public.has_pending_invite()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.store_invites i
    join auth.users u on u.id = auth.uid()
    where lower(i.email) = lower(u.email)
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now()
  );
$$;

/**
 * Accepts every live invite addressed to the signed-in user's email, and
 * returns how many were accepted.
 *
 * Called from the profile step once a freshly-invited user finishes onboarding,
 * so they land in the store they were invited to rather than being asked to
 * create one of their own.
 *
 * Matching is by email, which is only meaningful because the address is
 * verified at signup — an unconfirmed account cannot reach this.
 */
create or replace function public.accept_my_invites()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
  v_count integer := 0;
  v_invite public.store_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  if v_email is null then
    return 0;
  end if;

  for v_invite in
    select * from public.store_invites
    where lower(email) = lower(v_email)
      and accepted_at is null
      and revoked_at is null
      and expires_at > now()
    for update
  loop
    insert into public.store_members (store_id, user_id, role)
    values (v_invite.store_id, auth.uid(), v_invite.role)
    on conflict (store_id, user_id) do nothing;

    update public.store_invites
       set accepted_at = now(),
           accepted_by = auth.uid()
     where id = v_invite.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Revoking from PUBLIC alone is not enough on Supabase: default privileges
-- grant EXECUTE to anon and authenticated directly.
revoke execute on function public.has_pending_invite() from public, anon, authenticated;
revoke execute on function public.accept_my_invites() from public, anon, authenticated;

grant execute on function public.has_pending_invite() to authenticated;
grant execute on function public.accept_my_invites() to authenticated;
