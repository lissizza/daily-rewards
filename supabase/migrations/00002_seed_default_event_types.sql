-- Migration: Seed default event types for new admins
-- This migration adds a function to seed default event types and updates the handle_new_user trigger

-- Function to seed default event types for a new admin
create or replace function public.seed_default_event_types(p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if admin already has event types (prevent duplicates)
  if exists (select 1 from public.event_types where admin_id = p_admin_id) then
    return;
  end if;

  -- Insert default reward types
  insert into public.event_types (admin_id, name, default_points, is_deduction, icon, sort_order)
  values
    (p_admin_id, 'Посещение школы', 10, false, '🏫', 1),
    (p_admin_id, 'Хорошая оценка', 15, false, '⭐', 2),
    (p_admin_id, 'Запись ДЗ', 5, false, '📝', 3),
    (p_admin_id, 'Длинная прогулка', 10, false, '🚶', 4),
    (p_admin_id, 'Занятие спортом', 15, false, '⚽', 5),
    (p_admin_id, 'Бонус', 0, false, '🎁', 6),
    -- Insert default deduction types
    (p_admin_id, 'Вычет', 0, true, '➖', 100),
    (p_admin_id, 'Покупка', 0, true, '🛒', 101);
end;
$$;

-- Update the handle_new_user function to also seed default event types
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create admin profile
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'admin');

  -- Seed default event types for the new admin
  perform public.seed_default_event_types(new.id);

  return new;
end;
$$;

-- Grant execute permission on the seed function (for RPC calls if needed)
grant execute on function public.seed_default_event_types(uuid) to authenticated;

-- Add comment for documentation
comment on function public.seed_default_event_types(uuid) is 'Seeds default event types (rewards and deductions) for a new admin user';
