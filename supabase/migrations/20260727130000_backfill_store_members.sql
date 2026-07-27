-- Backfill owner memberships for stores created before handle_new_store().
--
-- The trigger only fires on INSERT into stores, so any store created before
-- 20260727080000 was applied has no store_members row. Its owner would then be
-- redirected out of /dashboard/team and get a 403 from the invite route, with
-- nothing on screen explaining why.
--
-- Idempotent: a no-op once every store has its owner membership.

insert into public.store_members (store_id, user_id, role)
select s.id, s.owner_id, 'owner'
from public.stores s
left join public.store_members m
  on m.store_id = s.id and m.user_id = s.owner_id
where m.id is null
on conflict (store_id, user_id) do nothing;
