-- Migration: Add family structure for multi-parent support
-- This allows multiple parents to manage the same children and event types

-- 1. Create families table
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Моя семья',
  created_at timestamptz default now() not null,
  created_by uuid references auth.users on delete set null
);

-- Enable RLS on families
alter table public.families enable row level security;

-- 2. Add family_id to profiles
alter table public.profiles add column family_id uuid references public.families(id) on delete set null;

-- 3. Update role constraint to include 'owner'
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'child'));

-- 4. Add family_id to event_types (will replace admin_id)
alter table public.event_types add column family_id uuid references public.families(id) on delete cascade;

-- 5. Create function to get email by login (for child login, bypasses RLS)
create or replace function public.get_email_by_login(p_login text)
returns text
language sql
security definer
stable
as $$
  select email from public.profiles where login = p_login limit 1;
$$;

-- 6. Create families for existing admins and migrate data
do $$
declare
  admin_record record;
  new_family_id uuid;
begin
  -- For each existing admin, create a family
  for admin_record in
    select id, name from public.profiles where role = 'admin' and parent_id is null
  loop
    -- Create family
    insert into public.families (name, created_by)
    values (admin_record.name || ' семья', admin_record.id)
    returning id into new_family_id;

    -- Update admin to owner with family_id
    update public.profiles
    set role = 'owner', family_id = new_family_id
    where id = admin_record.id;

    -- Update children to have family_id
    update public.profiles
    set family_id = new_family_id
    where parent_id = admin_record.id;

    -- Update event_types to have family_id
    update public.event_types
    set family_id = new_family_id
    where admin_id = admin_record.id;
  end loop;
end;
$$;

-- 7. Update RLS policies for families

-- Families: members can view their family
create policy "Family members can view own family"
  on public.families for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.family_id = families.id
    )
  );

-- Only owner can update family
create policy "Owner can update family"
  on public.families for update
  using (created_by = auth.uid());

-- Anyone can create a family (when signing up)
create policy "Users can create family"
  on public.families for insert
  with check (created_by = auth.uid());

-- 8. Drop old RLS policies and create new ones for profiles

-- Drop old policies
drop policy if exists "Admin can view own profile" on public.profiles;
drop policy if exists "Admin can view children" on public.profiles;
drop policy if exists "Child can view own profile" on public.profiles;
drop policy if exists "Admin can update own profile" on public.profiles;
drop policy if exists "Admin can update children" on public.profiles;
drop policy if exists "Admin can insert children" on public.profiles;
drop policy if exists "Admin can delete children" on public.profiles;

-- New policies: family-based
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view family members"
  on public.profiles for select
  using (
    family_id is not null and
    family_id = (select family_id from public.profiles where id = auth.uid())
  );

create policy "Owner/Admin can update own profile"
  on public.profiles for update
  using (auth.uid() = id and role in ('owner', 'admin'));

create policy "Owner/Admin can update family children"
  on public.profiles for update
  using (
    role = 'child' and
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Owner/Admin can insert children"
  on public.profiles for insert
  with check (
    role = 'child' and
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Owner can insert admin"
  on public.profiles for insert
  with check (
    role = 'admin' and
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );

create policy "Owner can delete family members"
  on public.profiles for delete
  using (
    role in ('admin', 'child') and
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- 9. Drop old RLS policies and create new ones for event_types

drop policy if exists "Admin can view own event types" on public.event_types;
drop policy if exists "Admin can insert event types" on public.event_types;
drop policy if exists "Admin can update own event types" on public.event_types;
drop policy if exists "Admin can delete own event types" on public.event_types;
drop policy if exists "Child can view parent event types" on public.event_types;

-- New policies: family-based
create policy "Family members can view event types"
  on public.event_types for select
  using (
    family_id = (select family_id from public.profiles where id = auth.uid())
  );

create policy "Owner/Admin can insert event types"
  on public.event_types for insert
  with check (
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Owner/Admin can update event types"
  on public.event_types for update
  using (
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Owner/Admin can delete event types"
  on public.event_types for delete
  using (
    family_id = (
      select family_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- 10. Update RLS policies for events

drop policy if exists "Admin can view children events" on public.events;
drop policy if exists "Admin can insert events for children" on public.events;
drop policy if exists "Admin can update children events" on public.events;
drop policy if exists "Admin can delete children events" on public.events;
drop policy if exists "Child can view own events" on public.events;

-- New policies: family-based
create policy "Family members can view family events"
  on public.events for select
  using (
    exists (
      select 1 from public.profiles child
      where child.id = events.child_id
      and child.family_id = (select family_id from public.profiles where id = auth.uid())
    )
  );

create policy "Owner/Admin can insert events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.profiles child
      where child.id = events.child_id
      and child.family_id = (
        select family_id from public.profiles
        where id = auth.uid() and role in ('owner', 'admin')
      )
    )
    and created_by = auth.uid()
  );

create policy "Owner/Admin can update events"
  on public.events for update
  using (
    exists (
      select 1 from public.profiles child
      where child.id = events.child_id
      and child.family_id = (
        select family_id from public.profiles
        where id = auth.uid() and role in ('owner', 'admin')
      )
    )
  );

create policy "Owner/Admin can delete events"
  on public.events for delete
  using (
    exists (
      select 1 from public.profiles child
      where child.id = events.child_id
      and child.family_id = (
        select family_id from public.profiles
        where id = auth.uid() and role in ('owner', 'admin')
      )
    )
  );

-- 11. Update handle_new_user to create family for new owners
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family_id uuid;
begin
  -- Create a new family for the user
  insert into public.families (name, created_by)
  values (coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || ' семья', new.id)
  returning id into new_family_id;

  -- Create owner profile with family
  insert into public.profiles (id, email, name, role, family_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'owner',
    new_family_id
  );

  return new;
end;
$$;

-- 12. Create index for family_id
create index idx_profiles_family on public.profiles(family_id);
create index idx_event_types_family on public.event_types(family_id);
