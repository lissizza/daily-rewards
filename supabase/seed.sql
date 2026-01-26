-- Seed default event types for a new admin
-- This is called when admin first logs in (via application code)

-- Example: Insert default event types for admin with id = $1
-- This will be called from the application after admin registration

/*
Usage in application:
After admin signs up, call this to seed their default event types:

insert into event_types (admin_id, name, default_points, is_deduction, icon, sort_order) values
  ($1, 'Посещение школы', 10, false, '🏫', 1),
  ($1, 'Хорошая оценка', 15, false, '⭐', 2),
  ($1, 'Запись ДЗ', 5, false, '📝', 3),
  ($1, 'Длинная прогулка', 10, false, '🚶', 4),
  ($1, 'Занятие спортом', 15, false, '⚽', 5),
  ($1, 'Бонус', 0, false, '🎁', 6),
  ($1, 'Вычет', 0, true, '➖', 100),
  ($1, 'Покупка', 0, true, '🛒', 101);
*/
