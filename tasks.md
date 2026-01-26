# Daily Rewards - План задач

## Архитектурные решения

### Почему выбран этот стек

| Технология | Причина выбора |
|------------|----------------|
| **React + TypeScript** | Единая кодовая база для web и mobile (через React Native) |
| **Vite** | Быстрая сборка, отличная поддержка TypeScript и PWA |
| **Zustand** | Простой state management, работает в React и React Native |
| **Dexie.js** | Удобная обёртка над IndexedDB, поддержка offline |
| **Tailwind + shadcn/ui** | Быстрая разработка UI, хорошая кастомизация |
| **date-fns** | Лёгкая библиотека для работы с датами |
| **Monorepo (pnpm workspaces)** | Переиспользование кода между web и mobile |

### Паттерны архитектуры

1. **Feature-based structure** - код организован по фичам, не по типам файлов
2. **Offline-first** - данные сначала сохраняются локально, потом синхронизируются
3. **Optimistic UI** - интерфейс обновляется мгновенно, ошибки обрабатываются отдельно

---

## Фаза 1: MVP Web (4-6 недель)

### Milestone 1: Инфраструктура
- [ ] Настройка monorepo (pnpm workspaces)
- [ ] Создание web приложения (Vite + React + TypeScript)
- [ ] Настройка Tailwind CSS
- [ ] Установка и настройка shadcn/ui
- [ ] Настройка ESLint + Prettier
- [ ] Настройка Dexie.js (IndexedDB)

### Milestone 2: Core пакет
- [ ] Типы данных (Child, EventType, Event)
- [ ] Сервис работы с детьми (ChildService)
- [ ] Сервис типов событий (EventTypeService)
- [ ] Сервис событий/транзакций (EventService)
- [ ] Сидинг дефолтных типов событий

### Milestone 3: State Management
- [ ] Zustand store для текущего ребёнка
- [ ] Zustand store для выбранной даты
- [ ] Zustand store для событий дня
- [ ] Хуки для работы с данными (useChildren, useEvents, etc.)

### Milestone 4: UI - Главный экран
- [ ] Layout с header (селектор ребёнка + баланс)
- [ ] Компонент навигации по датам
- [ ] Список событий дня
- [ ] Карточка события
- [ ] FAB кнопка "+"
- [ ] Свайп навигация между днями

### Milestone 5: UI - Добавление события
- [ ] Bottom sheet / Modal для добавления
- [ ] Селектор типа события
- [ ] Поле ввода баллов
- [ ] Поле примечания
- [ ] Валидация и сохранение

### Milestone 6: UI - Календарь
- [ ] Календарный вид (месяц)
- [ ] Календарный вид (неделя)
- [ ] Индикаторы событий на днях
- [ ] Навигация по месяцам/неделям
- [ ] Переход к конкретному дню

### Milestone 7: UI - Настройки
- [ ] Страница настроек
- [ ] CRUD для детей
- [ ] CRUD для типов событий
- [ ] Переключение темы

### Milestone 8: PWA и полировка
- [ ] Настройка PWA (manifest, service worker)
- [ ] Иконки и splash screens
- [ ] Анимации и переходы
- [ ] Тестирование offline режима
- [ ] Респонсивность на разных устройствах

---

## Фаза 2: Backend + Sync

### Milestone 9: Supabase
- [ ] Создание проекта Supabase
- [ ] Миграции базы данных
- [ ] Row Level Security (RLS)
- [ ] API для синхронизации

### Milestone 10: Авторизация
- [ ] Регистрация / вход
- [ ] Привязка данных к пользователю
- [ ] Восстановление пароля

### Milestone 11: Синхронизация
- [ ] Логика слияния данных
- [ ] Обработка конфликтов
- [ ] Индикатор синхронизации

---

## Фаза 3: Mobile

### Milestone 12: React Native
- [ ] Настройка Expo проекта
- [ ] Переиспользование core пакета
- [ ] Адаптация UI под mobile
- [ ] Сборка Android APK
- [ ] Публикация в Google Play

---

## Текущие задачи (Sprint 1)

### Сегодня
1. [x] Инициализация git репозитория
2. [x] Создание spec.md
3. [x] Создание tasks.md
4. [ ] Настройка monorepo
5. [ ] Создание базовой структуры web приложения
6. [ ] Настройка TypeScript и линтеров

### Следующие шаги
- Настройка Dexie.js и создание схемы БД
- Создание базовых компонентов UI
- Реализация главного экрана

---

## Полезные команды

```bash
# Установка зависимостей
pnpm install

# Запуск web приложения
pnpm --filter web dev

# Сборка
pnpm --filter web build

# Линтинг
pnpm lint
```

---

## Ссылки на документацию

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Dexie.js](https://dexie.org)
- [date-fns](https://date-fns.org)
- [React Native](https://reactnative.dev)
- [Expo](https://expo.dev)
