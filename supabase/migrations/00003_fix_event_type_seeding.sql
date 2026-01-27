-- Migration: Fix event type seeding to prevent duplicates when adding children
--
-- Problem: The handle_new_user trigger was seeding event types for ALL new auth users,
-- including child accounts. Since children are created via signUp() first as admin profiles
-- and then updated to child profiles, this caused event types to be seeded incorrectly.
--
-- Solution: Remove auto-seeding from the database trigger. Seeding should only happen
-- from the client-side when we can verify the user is a true admin signup, not a child creation.

-- Revert handle_new_user to the original version (without auto-seeding)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create profile with 'admin' role
  -- Note: For child accounts, the client will immediately update this to 'child' role
  -- with parent_id set. Event type seeding is handled client-side only for true admin signups.
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'admin');
  return new;
end;
$$;

-- Clean up any event_types that were incorrectly created for child accounts
-- These are event_types where admin_id references a profile with role='child'
delete from public.event_types
where admin_id in (
  select id from public.profiles where role = 'child'
);

-- Add comment for documentation
comment on function public.handle_new_user() is 'Creates initial admin profile for new auth users. Event type seeding is handled client-side to prevent duplicates during child account creation.';
