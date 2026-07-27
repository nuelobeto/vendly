-- Least privilege on SECURITY DEFINER functions.
--
-- Postgres grants EXECUTE to PUBLIC by default, and an explicit
-- `grant ... to authenticated` does NOT revoke that. So the grants in the
-- previous migration were additive no-ops and every definer function was
-- callable by anon. Verified: an anon POST to /rest/v1/rpc/generate_store_slug
-- returned 200 with a generated slug.
--
-- Each function below is revoked from PUBLIC first, then granted only to the
-- roles that actually need it.

revoke execute on function public.generate_store_slug(text) from public;
grant execute on function public.generate_store_slug(text) to authenticated;

revoke execute on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;

revoke execute on function public.has_store_role(uuid, public.store_role[]) from public;
grant execute on function public.has_store_role(uuid, public.store_role[]) to authenticated;

-- Trigger functions are never called directly by a client.
revoke execute on function public.handle_new_store() from public;
revoke execute on function public.set_store_contact_defaults() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.touch_updated_at() from public;

-- is_slug_available stays callable by anon on purpose: the store-address field
-- needs it, and it reveals no more than visiting the storefront URL would.
revoke execute on function public.is_slug_available(text) from public;
grant execute on function public.is_slug_available(text) to anon, authenticated;
