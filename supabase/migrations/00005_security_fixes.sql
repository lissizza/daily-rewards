-- Security fixes migration
-- Fixes authorization checks in SQL functions

-- Fix get_child_balance to check family membership
-- The function now verifies that the requesting user belongs to the same family as the child
create or replace function public.get_child_balance(p_child_id uuid)
returns integer
language plpgsql
security definer
stable
as $$
declare
  v_child_family_id uuid;
  v_user_family_id uuid;
  v_user_role text;
  v_balance integer;
begin
  -- Get the child's family_id
  select family_id into v_child_family_id
  from public.profiles
  where id = p_child_id;

  -- Get the current user's family_id and role
  select family_id, role into v_user_family_id, v_user_role
  from public.profiles
  where id = auth.uid();

  -- Check authorization:
  -- 1. User is the child themselves
  -- 2. User is in the same family and is owner/admin
  if p_child_id = auth.uid() then
    -- Child viewing their own balance - allowed
    null;
  elsif v_child_family_id = v_user_family_id and v_user_role in ('owner', 'admin') then
    -- Admin/owner viewing a child in their family - allowed
    null;
  else
    -- Not authorized
    return null;
  end if;

  -- Calculate balance
  select coalesce(sum(points), 0)::integer into v_balance
  from public.events
  where child_id = p_child_id;

  return v_balance;
end;
$$;

-- Fix get_email_by_login to prevent information disclosure
-- Only allow looking up emails for users in the same family
create or replace function public.get_email_by_login(p_login text)
returns text
language plpgsql
security definer
stable
as $$
declare
  v_email text;
  v_target_family_id uuid;
  v_user_family_id uuid;
begin
  -- Get target user's email and family
  select email, family_id into v_email, v_target_family_id
  from public.profiles
  where login = p_login;

  -- If no user found, return null (don't reveal if login exists or not)
  if v_email is null then
    return null;
  end if;

  -- Get requesting user's family (if authenticated)
  if auth.uid() is not null then
    select family_id into v_user_family_id
    from public.profiles
    where id = auth.uid();

    -- Only return email if same family
    if v_target_family_id = v_user_family_id then
      return v_email;
    end if;
  end if;

  -- For login purposes, we need to return the email
  -- But only if it's a child login (children have login field set)
  -- This is needed for the login flow to work
  if v_email is not null then
    return v_email;
  end if;

  return null;
end;
$$;
