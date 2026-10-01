# Снимок файловой структуры на 2026-09-24 (архив)

> **АРХИВ (перенесено 2026-09-30, #100).** Снимок сделан в день миграции на PostgreSQL и **до** редизайна v2,
> поэтому список файлов ниже устарел (`src/api/client.ts` удалён на Шаге 3, `api/`, `e2e/`, `scripts/`,
> `server/db/migrate.ts` и многое другое появились позже). Актуальная структура — раздел
> «Directory structure» в [`../../AGENTS.md`](../../AGENTS.md).
>
> Источник: раздел «Текущее состояние» файла [`../../MEMORY.md`](../../MEMORY.md).

```
├── package.json              ✅ зависимости + скрипты
├── vite.config.ts            ✅ (vitest 4 + vite 6 — совместимы)
├── tsconfig.json             ✅
├── tailwind.config.js        ✅ shadcn/ui
├── postcss.config.js         ✅
├── eslint.config.js          ✅ flat config ESLint 9
├── .prettierrc               ✅
├── .gitignore                ✅
├── components.json           ✅ shadcn/ui
├── drizzle.config.ts         ✅
├── index.html                ✅
├── Dockerfile                ✅ multi-stage (builder + runtime)
├── .dockerignore             ✅
├── render.yaml               ✅ Render Blueprint (docker, free, frankfurt)
├── src/
│   ├── main.tsx              ✅
│   ├── App.tsx               ✅ маршруты (React Router): / (лендинг), /book/:slug, /dashboard, /cancel/:token, /reschedule/:token, *
│   ├── App.test.tsx          ✅ 3 smoke-теста (лендинг, бронь, 404)
│   ├── index.css             ✅ shadcn CSS-переменные + Tailwind
│   ├── lib/utils.ts          ✅ cn()
│   ├── lib/validation.ts     ✅ zod-схемы брони + правил доступности (зеркало server/validation.ts)
│   ├── types/booking.ts      ✅ TimeSlot, Booking, CreateBookingBody (+email)
│   ├── types/host.ts         ✅ HostSettings (зеркало server/types.ts)
│   ├── types/availability.ts ✅ AvailabilityRules (зеркало server/availability.ts)
│   ├── api/client.ts         ✅ fetchSlots, fetchHostSettings, fetchHostSlots, createBooking, fetchBookings, cancelBooking, cancelBookingByToken, fetch/updateAvailability
│   ├── hooks/use-availability.ts ✅ принимает slug, тянет /api/v1/hosts/:slug/slots (фильтр прошедших)
│   ├── hooks/use-availability.test.tsx ✅ 2 теста (фильтр, ошибка загрузки)
│   ├── utils/dates.ts        ✅ (toDateKey/parseDateKey/startOfDay)
│   ├── utils/calendar.ts     ✅ buildIcs / googleCalendarUrl / downloadIcs
│   ├── utils/timezone.ts     ✅ toDateKeyInZone / formatDateTimeInZone / timeZoneOptionLabel
│   ├── pages/landing-page.tsx ✅ главная (витрина, данные из /api/v1/hosts/:slug/settings)
│   ├── pages/landing-page.test.tsx ✅ 2 теста (данные из API, фолбэк на конфиг)
│   ├── pages/not-found-page.tsx ✅ 404 (неизвестный slug/маршрут)
│   ├── pages/home-page.tsx   ✅ страница бронирования (/book/:slug)
│   ├── pages/home-page.test.tsx ✅ 8 тестов (экран успеха, экспорт, назад, TZ, фильтр, мобильная)
│   ├── pages/dashboard-page.tsx ✅ панель организатора (список + отмена + настройки)
│   ├── pages/dashboard-page.test.tsx ✅ 6 тестов
│   ├── pages/cancel-page.tsx ✅ отмена брони по токену (/cancel/:token)
│   ├── pages/cancel-page.test.tsx ✅ 2 теста
│   ├── pages/reschedule-page.tsx ✅ перенос брони по токену (/reschedule/:token)
│   ├── pages/reschedule-page.test.tsx ✅ 2 теста
│   ├── components/bookings-list.tsx ✅ список броней по дням + отмена
│   ├── components/dashboard-sidebar.tsx ✅ сайдбар (скролл к #availability)
│   ├── components/dashboard-sidebar.test.tsx ✅ 1 тест (скролл)
│   ├── components/availability-form.tsx ✅ форма настроек доступности
│   ├── components/ui/button.tsx ✅ shadcn Button
│   └── test/setup.ts         ✅ jest-dom/vitest + jsdom-полифилы (safe для node)
├── server/
│   ├── index.ts              ✅ точка входа: buildApp() + listen + graceful shutdown
│   ├── app.ts                ✅ фабрика buildApp(): /health, /api/*, статика dist/ (SPA)
│   ├── app.test.ts           ✅ 11 интеграционных тестов (app.inject, in-memory БД)
│   ├── dashboard.test.ts     ✅ 7 интеграционных тестов (отмена, availability)
│   ├── validation.ts         ✅ zod createBookingSchema + availabilityRulesSchema
│   ├── availability.ts       ✅ AvailabilityRules, defaultAvailabilityRules, generateSlotStarts, rulesFromRow/ToRow
│   ├── rules.ts              ✅ load/save правил + regenerateFutureSlots
│   ├── types.ts              ✅ TimeSlot, Booking, CreateBookingBody (+email)
│   ├── db/schema.ts          ✅ Drizzle: slots, bookings (+email), availability_rules
│   ├── db/index.ts           ✅ клиент БД (DATABASE_PATH) + ALTER + авто-сид по правилам
│   └── README.md             ✅
├── docs/
│   ├── architecture.md       ✅
│   ├── conventions.md        ✅
│   ├── agent-principles.md   ✅
│   ├── Структура проекта.md  ✅ (теория агентов)
│   ├── Каркас приложения.md  ✅ (требования шага 2)
│   ├── adr/                  ✅ README + ADR-0001, ADR-0002 + template
│   ├── ci_cd.md              ✅ (план GCP — не используется)
│   ├── ci_cd_render.md       ✅ (план Render — основной)
│   ├── ai-tuning-plan.md     ✅ (тюнинг AI-агентов)
│   └── mcp.md                ✅ (MCP-серверы)
└── AGENTS.md                 ✅ (обновлён под финальный стек)
└── CONTEXT.md                ✅ словарь проекта (организатор, гость, слот, бронь, встреча, тип встречи, правило доступности, токен)
```

Что изменилось после этого снимка (кратко):

- `src/api/client.ts` удалён, фронт ходит в API через сгенерированный SDK (`src/api/sdk.ts` + `src/api/mappers.ts`).
- Появились каталоги `api/` (TypeSpec-контракт), `e2e/` (Playwright), `scripts/`, `docs/{adr,agents,artefacts,design,openapi,research,archive}/`.
- `server/db/`: `pg-core` вместо SQLite, добавлены `migrate.ts` (идемпотентные миграции) и `index.ts` (PGlite/`pg` по `DATABASE_URL`).
- `server/`: `bookings-v1.ts`, `hosts.ts`, `event-types.ts`, `time-blocks.ts`, `captcha.ts`, `rate-limit.ts`, `email.ts`, `email-templates.ts`, `notifications.ts`, `reminders.ts`, `env.ts` + соответствующие `*.test.ts`.
- Фронт: редизайн v2 «Мята и солнце» (мастер записи, виды «Дни»/«Неделя», стеклянные поверхности), страницы `/my`, `/booking/:uuid/*`, `/admin/*`, панель с разделами и управлением хостами.
