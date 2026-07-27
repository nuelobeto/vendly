-- Backfill profiles for users who signed up before handle_new_user() existed.
--
-- The trigger in 20260726090000 only fires on INSERT into auth.users, so any
-- account created before that migration was applied has no profiles row and
-- would hit a null profile on its first onboarding read.
--
-- Idempotent: safe to re-run, and a no-op once every user has a profile.

insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
