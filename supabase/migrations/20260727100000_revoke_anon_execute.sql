-- Revoking from PUBLIC was not enough.
--
-- Supabase's default privileges grant EXECUTE on functions in `public` to
-- `anon` and `authenticated` *directly*, so `revoke ... from public` leaves the
-- direct grant intact. Verified empirically: after the previous migration, an
-- anon POST to /rest/v1/rpc/generate_store_slug still returned 200.
--
-- Revoke from the roles by name.

revoke execute on function public.generate_store_slug(text) from anon;
revoke execute on function public.is_store_member(uuid) from anon;
revoke execute on function public.has_store_role(uuid, public.store_role[]) from anon;

revoke execute on function public.handle_new_store() from anon, authenticated;
revoke execute on function public.set_store_contact_defaults() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
revoke execute on function public.slugify_text(text) from anon;
revoke execute on function public.unaccent_fallback(text) from anon;

-- is_slug_available remains anon-callable on purpose: the store-address field
-- needs it before sign-in, and it reveals no more than visiting the URL would.
