# Архитектура приложения

## Обзор

«Календарь звонков» — сервис бронирования звонков. Приложение состоит из двух частей, которые разрабатываются и запускаются в одном репозитории:

- **Фронтенд** — React 18 + TypeScript (strict) + Vite. UI строится на Tailwind CSS и компонентах shadcn/ui.
- **Бэкенд** — Fastify 5 на Node.js, порт **3000**. Данные хранятся в **PostgreSQL** (в проде — Neon, доступ через **Drizzle ORM** и драйвер `pg`); без `DATABASE_URL` используется PGlite в памяти. См. [ADR-0013](adr/0013-postgres-migration.md).

Общий язык проекта — TypeScript в strict-режиме: и клиент, и сервер типизированы, проверка типов выполняется командой `npm run typecheck`.

## Слои фронтенда

Код фронтенда живёт в `src/`. Каждая директория — отдельный слой со своей зоной ответственности:

| Директория | Назначение |
|---|---|
| `src/components/` | UI-компоненты приложения (функциональные, с типизацией пропсов) |
| `src/components/ui/` | Компоненты shadcn/ui — базовые примитивы (кнопки, инпуты, диалоги) |
| `src/pages/` | Маршруты/страницы; только здесь разрешены default-экспорты |
| `src/hooks/` | Кастомные хуки (например `use-availability.ts` → `useAvailability`) |
| `src/api/` | Клиентский слой API-вызовов: инстанс сгенерированного SDK и `call()`/`ApiError` в `sdk.ts`, маппинг контрактных моделей в UI-типы — `mappers.ts`; сам SDK — в `src/api/generated/` |
| `src/utils/`, `src/lib/` | Утилиты; в `src/lib/utils.ts` живёт хелпер `cn()`, в `src/lib/validation.ts` — zod-схемы формы |
| `src/types/` | UI-модели (`booking.ts`, `availability-settings.ts`); контрактные типы приходят из `src/api/generated/` |
| `src/main.tsx` | Точка входа приложения |

Во всём проекте настроен path alias: **`@` → `./src`** (в `vite.config.ts` и `tsconfig.json`). Импорты пишутся через алиас, а не через относительные пути вида `../../`.

```ts
import { Button } from '@/components/ui/button'
import { api } from '@/api/sdk'
import type { Host } from '@/api/generated'
```

## Бэкенд

Код сервера отделён от фронтенда и лежит в `server/`:

- `server/index.ts` — точка входа: создаёт приложение через `buildApp()` и слушает порт 3000. Запуск в dev-режиме — `npm run server:dev` (через `tsx watch`).
- `server/app.ts` — фабрика `buildApp()`: регистрирует `/health`, маршруты легаси `/api/*`, маршруты `/api/v1/*` и раздачу собранного фронтенда из `dist/`. Панель организатора и админские API открыты без логина ([ADR-0028](adr/0028-dashboard-access-without-login.md)). Фабрика позволяет тестам поднять изолированный инстанс без `listen()` (`app.inject()`).
- `server/env.ts` — валидация переменных окружения через zod: `NODE_ENV`, `PORT`, `DATABASE_URL`, `TURNSTILE_*` (CAPTCHA), `RATE_LIMIT_*`, `EMAIL_*`, `ORGANIZER_EMAIL`, `REMINDER_LEAD_MINUTES`, `REMINDERS_SECRET`, `APP_ORIGIN`/`RENDER_EXTERNAL_URL`; там же `normalizeSslMode` (любой входящий `sslmode` → `verify-full`).
- `server/bookings-v1.ts` — логика броней v1: проверка слота, `minNotice`, статус, гости, `Idempotency-Key`, отмена/перенос.
- `server/event-types.ts`, `server/time-blocks.ts` — CRUD типов встреч и блокировок времени ([ADR-0014](adr/0014-time-blocks.md)).
- `server/validation.ts` — zod-схемы API-контракта (`createBookingSchema`, `availabilityRulesSchema`); зеркало для фронтенда — `src/lib/validation.ts`. См. [ADR-0002](adr/0002-zod-api-validation.md).
- `server/availability.ts` — правила доступности (`AvailabilityRules`), дефолт и чистая генерация слотов `generateSlotStarts`; конверсия строк таблицы `availability_rules`. См. [ADR-0004](adr/0004-slot-generation-rules.md), [ADR-0005](adr/0005-dashboard-availability-and-cancellation.md), [ADR-0024](adr/0024-slots-in-host-timezone.md).
- `server/rules.ts` — персистентные правила per-host: `loadAvailabilityRules(hostId)` / `saveAvailabilityRules(hostId, rules)` / `regenerateFutureSlots(hostId, rules)` (пересборка свободных будущих слотов, занятые не трогаются). См. [ADR-0020](adr/0020-per-host-availability-rules.md).
- `server/hosts.ts` — слой хостов API v1: `findHost` по slug **или** UUID, `GET /api/v1/hosts/:ref/settings|slots` (404 на неизвестный хост). См. [ADR-0009](adr/0009-hosts-and-api-v1.md), [ADR-0018](adr/0018-multi-host-model.md).
- `server/email.ts` — транспорт писем через Brevo HTTP API (`sendEmail`); без `EMAIL_API_KEY` — no-op, внешняя сеть не задействуется. См. [ADR-0026](adr/0026-email-notifications.md).
- `server/email-templates.ts` — тексты писем (`text` + `html`) гостю и организатору: подтверждение, перенос, отмена, напоминание.
- `server/notifications.ts` — отправка писем по событиям брони (`notifyBookingConfirmed/Cancelled/Rescheduled/Reminder`); ошибки провайдера не ломают бронь.
- `server/reminders.ts` — ленивая проверка due-напоминаний (`sendDueReminders`, идемпотентность через `bookings.reminderSentAt`) и `scheduleLazyReminderCheck`; внешний cron дёргает `POST /api/internal/reminders` с секретом. См. [ADR-0026](adr/0026-email-notifications.md).
- `server/captcha.ts`, `server/rate-limit.ts` — проверка Cloudflare Turnstile (fail-closed) и лимиты по IP с ключом `CF-Connecting-IP` → `request.ip` ([ADR-0025](adr/0025-captcha-and-rate-limit.md)).
- `server/db/schema.ts` — схема БД в терминах Drizzle ORM (`pg-core`): `hosts`, `event_types`, `slots`, `bookings`, `availability_rules`, `availability_ranges`, `time_blocks`.
- `server/db/index.ts` — клиент Drizzle: `pg` при заданном `DATABASE_URL` (Neon), иначе **PGlite в памяти** (тесты и локальный dev без переменной).
- `server/db/migrate.ts` — идемпотентные миграции (`ALTER TABLE … IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS`) и бэкфиллы; выполняются при старте сервера.

drizzle-kit (`npm run db:generate` / `db:push`, `drizzle.config.ts`) в проде **не используется**: реальная схема создаётся и обновляется идемпотентным `server/db/migrate.ts`, а drizzle-kit нужен только для генерации SQL-файлов.

Маршруты фронтенда (React Router, `src/App.tsx`): `/` — лендинг гостя (`LandingPage`), `/book/:slug` — бронирование (`HomePage`), `/my` — «Мои встречи», `/booking/:uuid/confirmed` — shareable-экран подтверждения, `/booking/:uuid/{cancel,reschedule}` (алиасы `/cancel/:token`, `/reschedule/:token`) — self-service (`ManageBookingPage`), `/dashboard` и `/admin/{bookings,availability,event-types,blocks,hosts}` — панель организатора (`DashboardPage`), `*` — 404. См. [ADR-0010](adr/0010-landing-and-booking-routes.md), [ADR-0019](adr/0019-my-bookings-on-device.md), [ADR-0023](adr/0023-redesign-v2-mint.md).

Интеграционные тесты API лежат в `server/**/*.test.ts` (21 файл на 2026-09-30: `app`, `dashboard`, `dashboard-access` — панель без логина, `contract`, `static`, `bookings-v1`, `event-types`, `hosts`, `host-availability`, `multi-host`, `availability`, `availability-settings`, `time-blocks`, `slot-regeneration`, `captcha`, `rate-limit`, `env`, `email`, `email-templates`, `email-notifications`, `db/migrate`) и работают через `app.inject()` на PGlite в памяти (`DATABASE_URL=''` в `vite.config.ts` → `test.env`). Всего вместе с фронтенд-тестами — 56 файлов, 336 тестов.

## Контракт API (TypeSpec)

Контракт `/api/v1` описывается в `api/main.tsp` (TypeSpec) и генерируется одной командой:

```bash
npm run api:generate   # tsp compile api/main.tsp + openapi-typescript
```

Артефакты (сгенерированные файлы коммитятся и вручную не правятся):
- `docs/openapi/openapi.yaml` — OpenAPI 3.
- `src/api/generated/` — клиентский SDK (TypeScript).
- `server/generated/api-types.ts` — серверные типы из OpenAPI.

Обоснование и toolchain — `docs/research/typespec-toolchain.md`; спецификация — `docs/spec.md`.

## Поток данных

В dev-режиме фронтенд открывается на порту Vite (5173), а все запросы к API идут через **прокси**: Vite перенаправляет пути `/api/*` (включая `/api/v1/*`) на Fastify (`http://127.0.0.1:3000`, настроено в `vite.config.ts`). Поэтому клиентский код всегда обращается к относительному пути `/api/...` и не знает ни про порт сервера, ни про CORS.

Цепочка: **браузер → vite dev proxy `/api` → Fastify :3000 → Drizzle → PostgreSQL (Neon) / PGlite**. Гостевые страницы используют `/api/v1` (типы, слоты, брони из контракта), легаси-слой `/api/*` сохранён для панели, скриптов и тестов.

Пример на двух эндпоинтах:

1. `GET /api/v1/hosts/:slug/slots` — страница календаря вызывает `call(api.listSlots(slug, { eventTypeId }))` из `src/api/sdk.ts` (результат мапится в UI-модель в `src/api/mappers.ts`) → запрос уходит на `/api/v1/...` → прокси Vite передаёт его Fastify → маршрут через Drizzle читает таблицу слотов (прошедшие слоты и окно `minNotice` отсекаются на бэке) → JSON со слотами возвращается на фронтенд и кладётся в состояние хука `useAvailability`.
2. `POST /api/v1/hosts/:slug/bookings` — форма бронирования вызывает `api.hostBookingsClient.createBooking` с данными формы → Fastify валидирует тело zod-схемой (`clientName`, `clientEmail`, `slotId`, `consentAccepted`, опциональные `clientPhone`, `clientNotes`, `guests`) → Drizzle вставляет запись в таблицу `bookings` (уникальный индекс по `slotId` даёт `409 SLOT_TAKEN`) → клиент получает бронь и показывает экран успеха.

## Диаграмма потока запроса

```
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│     Браузер      │  HTTP    │   Vite dev :5173 │  proxy   │   Fastify :3000  │
│  React-компонент │ ───────► │  proxy '/api'    │ ───────► │  server/app.ts   │
│  → src/api/*     │ ◄─────── │                  │ ◄─────── │  маршруты /api/* │
└──────────────────┘   JSON   └──────────────────┘          └────────┬─────────┘
                                                                      │ Drizzle ORM
                                                                      ▼
                                                             ┌──────────────────┐
                                                             │    PostgreSQL    │
                                                             │  Neon (прод) /   │
                                                             │  PGlite (тесты)  │
                                                             └──────────────────┘
```

## Команды разработки

| Команда | Что делает |
|---|---|
| `npm run dev` | Запуск dev-сервера Vite (фронтенд, :5173, с прокси `/api`) |
| `npm run server:dev` | Запуск бэкенда Fastify с перезагрузкой (`tsx watch server/index.ts`, :3000) |
| `npm run dev:all` | Оба процесса сразу (`scripts/dev-all.mjs`) |
| `npm run start` | Продакшн-режим: Fastify + раздача `dist/` |
| `npm test` | Прогон тестов (Vitest + React Testing Library) |
| `npm run test:e2e` | Сквозные сценарии Playwright (отдельный гейт, job `e2e` в CI) |
| `npm run lint` | Проверка ESLint |
| `npm run typecheck` | Проверка типов (`tsc --noEmit`) |
| `npm run build` | Продакшн-сборка (`tsc --noEmit && vite build`) |
| `npm run api:generate` | Генерация OpenAPI, клиентского SDK и серверных типов из `api/main.tsp` |
| `npm run db:generate` / `npm run db:push` | drizzle-kit; в проде не используются (миграции — `server/db/migrate.ts` при старте) |

Для полноценной локальной работы нужны два процесса: `npm run server:dev` и `npm run dev` — бэкенд и фронтенд запускаются параллельно (или одной командой `npm run dev:all`).

