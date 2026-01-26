-- Initial schema for Daily Rewards

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  login text unique,
  name text not null,
  avatar_url text,
  role text not null check (role in ('admin', 'child')),
  parent_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,

  constraint admin_has_email check (role != 'admin' or email is not null),
  constraint child_has_login check (role != 'child' or login is not null),
  constraint child_has_parent check (role != 'child' or parent_id is not null)
);

-- Event Types table
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  default_points integer not null default 0,
  is_deduction boolean not null default false,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Events table (transactions)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.profiles(id) on delete cascade not null,
  event_type_id uuid references public.event_types(id) on delete set null,
  custom_name text,
  points integer not null,
  note text default '' not null,
  date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Indexes
create index idx_profiles_parent on public.profiles(parent_id);
create index idx_profiles_login on public.profiles(login);
create index idx_event_types_admin on public.event_types(admin_id);
create index idx_events_child on public.events(child_id);
create index idx_events_date on public.events(date);
create index idx_events_child_date on public.events(child_id, date);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.event_types enable row level security;
alter table public.events enable row level security;

-- RLS Policies for profiles

-- Admin can see own profile
create policy "Admin can view own profile"
  on public.profiles for select
  using (auth.uid() = id and role = 'admin');

-- Admin can see their children
create policy "Admin can view children"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid()
      and admin.role = 'admin'
      and public.profiles.parent_id = admin.id
    )
  );

-- Child can see own profile
create policy "Child can view own profile"
  on public.profiles for select
  using (auth.uid() = id and role = 'child');

-- Admin can update own profile
create policy "Admin can update own profile"
  on public.profiles for update
  using (auth.uid() = id and role = 'admin');

-- Admin can update children profiles
create policy "Admin can update children"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid()
      and admin.role = 'admin'
      and public.profiles.parent_id = admin.id
    )
  );

-- Admin can insert children (via function, not direct)
create policy "Admin can insert children"
  on public.profiles for insert
  with check (
    role = 'admin' and auth.uid() = id
    or
    role = 'child' and parent_id = auth.uid()
  );

-- Admin can delete children
create policy "Admin can delete children"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid()
      and admin.role = 'admin'
      and public.profiles.parent_id = admin.id
    )
  );

-- RLS Policies for event_types

-- Admin can manage own event types
create policy "Admin can view own event types"
  on public.event_types for select
  using (admin_id = auth.uid());

create policy "Admin can insert event types"
  on public.event_types for insert
  with check (admin_id = auth.uid());

create policy "Admin can update own event types"
  on public.event_types for update
  using (admin_id = auth.uid());

create policy "Admin can delete own event types"
  on public.event_types for delete
  using (admin_id = auth.uid());

-- Children can view event types (for display)
create policy "Child can view parent event types"
  on public.event_types for select
  using (
    exists (
      select 1 from public.profiles child
      where child.id = auth.uid()
      and child.role = 'child'
      and child.parent_id = public.event_types.admin_id
    )
  );

-- RLS Policies for events

-- Admin can manage events for their children
create policy "Admin can view children events"
  on public.events for select
  using (
    exists (
      select 1 from public.profiles child
      where child.id = public.events.child_id
      and child.parent_id = auth.uid()
    )
  );

create policy "Admin can insert events for children"
  on public.events for insert
  with check (
    exists (
      select 1 from public.profiles child
      where child.id = public.events.child_id
      and child.parent_id = auth.uid()
    )
    and created_by = auth.uid()
  );

create policy "Admin can update children events"
  on public.events for update
  using (
    exists (
      select 1 from public.profiles child
      where child.id = public.events.child_id
      and child.parent_id = auth.uid()
    )
  );

create policy "Admin can delete children events"
  on public.events for delete
  using (
    exists (
      select 1 from public.profiles child
      where child.id = public.events.child_id
      and child.parent_id = auth.uid()
    )
  );

-- Child can only view own events
create policy "Child can view own events"
  on public.events for select
  using (child_id = auth.uid());

-- Function to get balance for a child
create or replace function public.get_child_balance(p_child_id uuid)
returns integer
language sql
security definer
stable
as $$
  select coalesce(sum(points), 0)::integer
  from public.events
  where child_id = p_child_id;
$$;

-- Function to handle new user signup (create admin profile)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'admin');
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
