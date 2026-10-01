# MEMORY.md — Состояние проекта «Календарь звонков»

> Дата последнего обновления: 2026-09-30 ([#100](https://github.com/frostiks777/ai-for-developers-project-386/issues/100) — актуализация документации: выполненные планы перенесены в [`docs/archive/`](docs/archive/README.md) с `README`-каноном, битые ссылки исправлены, `MEMORY.md` и `docs/todo.md` пересобраны; прогон 336/336 тестов). До этого: 2026-09-29 — закрыты [#97](https://github.com/frostiks777/ai-for-developers-project-386/issues/97) «отменённые брони держат слоты вне сетки» и [#99](https://github.com/frostiks777/ai-for-developers-project-386/issues/99) «апгрейд `@fastify/static` 8.3.0 → 10.1.5», [ADR-0029](docs/adr/0029-audit-fastify-static-upgrade-deferred.md) обновлён; ревью #88–#93 закрыто; email-уведомления [#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83), [ADR-0026](docs/adr/0026-email-notifications.md). Открытых issues нет.
> Все шаги курса закрыты. Продуктовый backlog — `docs/todo.md` («Backlog продукта»): уведомления ✅, далее регистрация/аккаунты, интеграции с календарями, повторяющиеся события, аналитика.
> **Итог ревью проверяющего (2026-09-29):** все шесть замечаний оформлены как issues [#88](https://github.com/frostiks777/ai-for-developers-project-386/issues/88)–[#93](https://github.com/frostiks777/ai-for-developers-project-386/issues/93) и **закрыты**: #88 (панель без логина, [ADR-0028](docs/adr/0028-dashboard-access-without-login.md)), #89 (сетка слотов 30 мин, [ADR-0027](docs/adr/0027-slot-grid-step-independent-of-buffers.md)), #90 (CI на каждый push), #91 (npm audit), #92 (Conventional Commits), #93 (привязка коммитов к issue).

> **Актуальный стек:** PostgreSQL (Neon) + Drizzle ORM (`pg`), PGlite в тестах и локальном dev без `DATABASE_URL`; миграции — идемпотентный `server/db/migrate.ts` при старте сервера; контракт — TypeSpec `api/main.tsp` → OpenAPI + клиентский SDK (`src/api/generated/`) + серверные типы (`server/generated/api-types.ts`); фронт ходит в API через `src/api/sdk.ts` (ручной `src/api/client.ts` удалён на Шаге 3, T7).
> Упоминания SQLite, `DATABASE_PATH`, `better-sqlite3`, `server/data/app.db` ниже — **история** до [ADR-0013](docs/adr/0013-postgres-migration.md) (2026-09-24).

## Текущее состояние

**Все 4 шага курса закрыты** (2026-09-24), включая Шаг 3 (реализация тикетов T1–T9, #19–#27). Шаг 2 (проектирование бронирования): карта решений [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) с тикетами #11–#18 закрыта, утверждена спецификация `docs/spec.md`, контракт `api/main.tsp`, конвейер `npm run api:generate` (OpenAPI + клиентский SDK + серверные типы).
Скелет: бэкенд (Fastify + Drizzle ORM + PostgreSQL/Neon, PGlite в тестах), фронтенд (React 18 + TypeScript + Vite + shadcn/ui), документация, конфиги.
Сверх курса реализовано: мульти-хост, открытая панель организатора без логина (ADR-0028), блокировки времени, раздельные буферы как фильтр занятости (ADR-0027), «Мои встречи» на устройстве, список броней в панели, редизайн v2 «Мята и солнце», CAPTCHA + rate-limit (ADR-0025), email-уведомления (ADR-0026), контракт-тесты + e2e Playwright (в т.ч. в CI).

### Файловая структура

Актуальный состав каталогов — раздел «Directory structure» в [`AGENTS.md`](AGENTS.md) (обновлён 2026-09-28, пункт 72). Исторический снимок скелета на 2026-09-24 (до миграции на PostgreSQL и до редизайна v2) вынесен в [`docs/archive/memory-file-tree-2026-09-24.md`](docs/archive/memory-file-tree-2026-09-24.md) — там же список того, что изменилось после него.

## Исправленные ошибки

| Что | Ошибка | Исправление |
|---|---|---|
| `npm install` | `better-sqlite3@11` — нет пресборки под Node 26 | Обновлён до `^13.0.3` |
| `npm install` | `drizzle-orm@0.38`, `drizzle-kit@0.30` — устарели | Обновлены до `^0.45.3` / `^0.31.11` |
| `npm install` | `@types/better-sqlite3@7` — не соответствует v13 | Обновлён до `^9.6.0` |
| `typecheck` | Конфликт типов `vitest/config` vs `vite` (vitest 2 bundled свой vite) | vitest обновлён до ^3.2.7 — конфликт устранён |
| `typecheck` | `@ts-expect-error` стал неиспользуемым после обновления vitest | Директива удалена |
| `lint` | `no-unsafe-finally` в `use-availability.ts` | Убран `finally`, логика перенесена после try/catch |
| `lint` | `react-refresh/only-export-components` warning в `button.tsx` | Предупреждение (не ошибка) — допустимо для shadcn |
| `test` | `src/test/setup.ts` падал в node-окружении (`Element is not defined`) | jsdom-полифилы обёрнуты в `typeof Element !== 'undefined'` |
| `test` | `App.test.tsx` — фикстура слота с прошедшей датой ломалась о новый фильтр | `startAt` генерируется как `now + 1h` |
| CI | `lint-and-test (20)`: `Channel closed` (`ERR_IPC_CHANNEL_CLOSED`, tinypool) — баг vitest 3.x ([vitest#8201](https://github.com/vitest-dev/vitest/issues/8201)) | vitest `3.2.7 → 4.1.11` (пул переписан без tinypool) + Node 20 (EOL) убран из матрицы: `[22, 24]` |
| API/БД | check-then-insert: гонка при параллельных бронированиях; после отказа от предпроверки дубль давал `500` | [ADR-0003](docs/adr/0003-unique-slot-booking.md): `UNIQUE`-индекс `bookings_slotId_unique` + перехват `SQLITE_CONSTRAINT_UNIQUE` → `409` |
| `docs sync` | `opencode/mimo-v2.5-free` удалён из каталога моделей, заменён на `opencode/mimo-v2.6-flash-free` | Обновлено во всех 4 файлах: `docs/model-usage.md`, `AGENTS.md`, `opencode.jsonc`, `docs/archive/ai-tuning-plan.md` (на тот момент — `docs/ai-tuning-plan.md`) |

## Версии зависимостей (финальные)

> Снято из `package.json` 2026-09-30. Полный список — в самом `package.json`; здесь только опорные пакеты.

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "^6.0.7",
  "vitest": "^4.1.11",
  "typescript": "~5.7.2",
  "fastify": "^5.2.0",
  "pg": "^8.23.0",
  "@electric-sql/pglite": "^0.5.8",
  "drizzle-orm": "^0.45.3",
  "drizzle-kit": "^0.31.11",
  "@fastify/static": "^10.1.5",
  "@fastify/rate-limit": "^11.2.0",
  "tsx": "^4.23.15",
  "tailwindcss": "^3.4.17",
  "react-router-dom": "^7.18.4",
  "zod": "^4.6.5",
  "sonner": "^2.0.8",
  "lucide-react": "^0.469.0",
  "@typespec/compiler": "^1.16.0",
  "@typespec/http": "^1.16.0",
  "@typespec/openapi3": "^1.16.0",
  "@typespec/http-client-js": "0.16.2",
  "@typespec/ts-http-runtime": "^0.2.1",
  "openapi-typescript": "^7.13.0",
  "@playwright/test": "^1.63.0",
  "ajv": "^8.20.0",
  "ajv-formats": "^3.0.1",
  "yaml": "^2.9.1"
}
```

## Результаты проверок

> Актуальный прогон — 2026-09-30 (`npm test` в рамках #100). Блок ниже в комментарии `// 2026-09-25 (эпоха SQLite)` — история.

```
✅ test: 336/336 passed (56 файлов: фронтенд RTL + server/*), PGlite в памяти
✅ typecheck: tsc --noEmit — чисто (без изменений кода с 2026-09-29)
✅ lint: 0 ошибок, 0 warnings (без изменений кода с 2026-09-29)
✅ e2e: playwright — 3/3 (прогон 2026-09-29)
```

Исторический прогон 2026-09-25 (до миграции на PostgreSQL, см. [ADR-0013](docs/adr/0013-postgres-migration.md)):

```
✅ typecheck: tsc --noEmit — чисто
✅ lint: 0 ошибок, 0 warnings
✅ test: 230/230 passed (40 файлов: фронтенд RTL + server/*)
✅ e2e: playwright — 2/2 (сквозной сценарий гостя + конфликт слотов), собранное приложение на :3100, DATABASE_PATH=:memory:
✅ build: vite v6.4.3 — 439.64 kB JS (gzip 134.53), 43.15 kB CSS
✅ smoke (prod): PORT=3100 + DATABASE_PATH=temp, /health 200, / 200 (index.html), SPA fallback 200,
   /api/slots 200 (6 слотов, прошедших нет), POST booking с email 201, POST с невалидным email 400,
   GET /api/bookings 200 (бронь с startAt/durationMin)
```

## Что сделано (полный список)

1. ✅ package.json — зависимости + скрипты
2. ✅ Конфиги сборки: vite, tsconfig, tailwind, postcss, eslint, prettier, gitignore, components.json
3. ✅ Фронтенд-скелет src/ (12 файлов)
4. ✅ Бэкенд server/ (Fastify + Drizzle + SQLite, 6 файлов)
5. ✅ Документация docs/ (5 файлов)
6. ✅ npm install — 426 пакетов
7. ✅ Проверки: typecheck, lint, test, build
8. ✅ Исправление ошибок (better-sqlite3 v13, vitest 3, no-unsafe-finally)
9. ✅ GitHub Actions: CI workflow (lint+test на push)
10. ✅ GitHub Actions: release-please workflow
11. ✅ AGENTS.md — обновлён под финальный стек
12. ✅ Тюнинг AI-агентов по плану (ныне [`docs/archive/ai-tuning-plan.md`](docs/archive/ai-tuning-plan.md), выполнен полностью):
    - ADR-хранилище: [`docs/adr/`](docs/adr/README.md) (README + ADR-0001 + template)
    - Процессные скиллы: `.agents/skills/{interview,plan,ponytail,tdd,verify}` (5 файлов)
    - AGENTS.md: добавлены разделы `## Hygiene of context window`, `## Long-term memory`, `## Safety gates`; обновлены `## Documentation`, `## Skills (OpenCode)`, `## Directory structure`
    - MCP: shadcn MCP подключён в `opencode.jsonc` → блок `mcp`; read-only permission установлена для субагента `explore`; документировано в [`docs/mcp.md`](docs/mcp.md)
    - `docs/agent-principles.md` дополнен ссылками на новые скиллы, ADR и правило 2 итераций
13. ✅ Деплой на Render.com по [`docs/ci_cd_render.md`](docs/ci_cd_render.md):
    - `server/index.ts` — `PORT` из env, раздача `dist/` через `@fastify/static`, SPA fallback
    - `package.json` — скрипт `start` (tsx), `@fastify/static` в dependencies, `tsx` перенесён в dependencies
    - `Dockerfile` — multi-stage (python3/make/g++ для better-sqlite3, non-root), `.dockerignore`
    - `render.yaml` — docker, plan free, region frankfurt, branch main, healthCheck `/health`
    - Коммиты `aa22fb0`, `1202442`, `7c5a1ba`, `ed95bf7` запушены в `main`
14. ✅ Синхронизация документации с каталогом моделей (`tools.opencode.models`):
    - **Sync #1:** `docs/model-usage.md`, `AGENTS.md`, `opencode.jsonc`, `docs/ai-tuning-plan.md` (ныне архив) — открытый ID `opencode/mimo-v2.5-free` заменён на `opencode/mimo-v2.6-flash-free`. Добавлен OpenRouter как «справочно».
    - **Sync #2 (текущий):** каталог вырос с 16 до 133 моделей. Обновлено:
      - `docs/model-usage.md`: opencode — добавлена 5-я бесплатная `big-pickle` (теперь 5 из 18); openrouter — таблица переразбита на 3 группы (универсальные 7, роутеры 5, специализированные 1) итого 12 из 115; добавлены `fusion`, `pareto-code`, `bodybuilder`, `auto`, `lyria-3-clip-preview`; удалены 4 устаревших free-модели (`qwen3.8-27b:free`, `laguna-xs:free`, `glm-5.2:free`, `gemma-4-31b-it:free`); список платных opencode-моделей для справки.
      - `AGENTS.md`: добавлен `opencode/big-pickle` в список бесплатных ID.
      - `opencode.jsonc`, архивный `ai-tuning-plan.md`: без изменений (sync #1 уже закрыл `mimo-v2.5-free → v2.6`).
      - Сводная статистика: **133 модели всего, 17 бесплатных, 116 платных**.
15. ⚠️ **Плагин superpowers — в репозитории НЕ подключён.** Запись 2026-09-25 утверждала, что в `opencode.jsonc` добавлен ключ `plugins: ["superpowers@git+…"]`; фактически в конфиге ключ **`plugin`** со значением `["opencode-notify"]` (уведомления opencode), а `obra/superpowers` отсутствует. Процессные скиллы работают из `.agents/skills/` — этого достаточно. Если superpowers понадобится: добавить в `plugin` (синтаксис плагинов opencode 1.18.x — `plugin`, не `plugins`) и проверить `skill`-лист.
16. ✅ Обязательный email ([ADR-0002](docs/adr/0002-zod-api-validation.md)):
    - zod 4: `server/validation.ts` + зеркало `src/lib/validation.ts`
    - форма: поле Email, inline-ошибка «Неверный email», submit заблокирован
    - API: 400 с сообщением из zod; БД: колонка `email` + `ALTER TABLE` для старых БД
17. ✅ Фильтр прошедших слотов:
    - SQL: `GET /api/slots` возвращает только `startAt >= now`
    - фронт: `useAvailability` дополнительно фильтрует
    - `POST /api/bookings` на прошедший слот → 400 «Слот уже прошёл»
    - ре-сид 8 слотов, если будущих слотов не осталось
18. ✅ Интеграционные тесты API: `server/app.ts` (`buildApp()`), `server/app.test.ts` — 11 тестов через `app.inject()` на `DATABASE_PATH=:memory:`
19. ✅ Валидация телефона (zod `refine`): цифры + разделители, 10–15 цифр; inline-ошибка «Неверный номер телефона» в форме, 400 на бэке
19. ✅ Импорт 37 upstream-скилов в `.agents/skills/` (по требованию — доступны всем агентам, не только OpenCode):
    - **Single-skill репо (5):** `open-code-review` (alibaba), `i-have-adhd` (ayghri), `security-audit` (cloudflare, +references/ +scripts/), `archify-review` (tt-a1i), `browser-skill` (Tencent: CLI body + DSH variant section, объединено из двух SKILL.md в один).
    - **Каталог tech-leads-club/agent-skills (32):** только категории `(development)` — 18 шт. (`codenavi`, `coding-guidelines`, `confluence-assistant`, `docs-writer`, `gh-address-comments`, `harness-eval`, `jira-assistant`, `nestjs-modular-monolith`, `not-your-babysitter`, `rails-dev`, `react-native-expert`, `shopify-developer`, `spec-driven-eval`, `tlc-discover`, `tlc-implement`, `tlc-plan`, `tlc-spec-driven`, `tlc-spec-lean`) — и `(architecture)` — 14 шт. (`component-common-domain-detection`, `component-flattening-analysis`, `component-identification-sizing`, `coupling-analysis`, `decomposition-planning-roadmap`, `domain-analysis`, `domain-identification-grouping`, `evolutionary-modular-architecture`, `frontend-blueprint`, `legacy-migration-planner`, `modular-decomposition`, `modular-design-principles`, `react-composition-patterns`, `tactical-ddd`).
    - **Имена → из frontmatter `name:`**, директории = `name` в kebab-case. Никаких переименований/префиксов.
    - **Vitest exclude:** добавлен `.agents/skills/**` в `vite.config.ts` → `test.exclude`, чтобы исключить upstream-ские `.cjs` test-файлы из `npm test`.
    - **Проверки:** `npm run lint` ✓ (0 err, 1 допустимый warn в `button.tsx`), `npm run typecheck` ✓, `npm test` 20/20 ✓, валидация frontmatter 43/43 (все SKILL.md имеют `--- ---`, `name:`, `description:`).
    - **Известные мелочи:** 3 скила имеют description чуть выше рекомендованных 1024 chars (`evolutionary-modular-architecture` ~1069, `not-your-babysitter` ~1066, `tlc-spec-driven` ~1060 — описания upstream-а, не правлены).
20. ✅ CI зелёный (High): vitest `3.2.7 → 4.1.11` — устранён `ERR_IPC_CHANNEL_CLOSED`/`Channel closed` (баг tinypool, [vitest#8201](https://github.com/vitest-dev/vitest/issues/8201)); матрица CI `node-version: [20, 22] → [22, 24]` (Node 20 EOL). Проверки: 25/25 тестов, typecheck, lint, build — зелёные. Запушено (`d5954e7`); CI run [35885094173](https://github.com/frostiks777/ai-for-developers-project-386/actions/runs/35885094173): оба job (22, 24) — success. Release-please выпустил v1.1.0.
21. ✅ `GET /api/bookings` (High): список броней с данными слота (`BookingWithSlot extends Booking` + `startAt`, `durationMin`), `innerJoin(slots)`, сортировка по `startAt`; типы-зеркала в `server/types.ts` и `src/types/booking.ts`; 2 интеграционных теста (TDD: red → green). Фронтовых потребителей пока нет.
22. ✅ README (High): стек, требования (Node 22/24), установка, запуск dev/prod, таблица env, таблица API + curl-примеры, скрипты, структура, тесты, деплой; добавлен `.env.example` (PORT, DATABASE_PATH). Asciinema — заглушка + TODO.
23. ✅ Race condition (Medium #1): `UNIQUE`-индекс `bookings_slotId_unique` (`CREATE UNIQUE INDEX IF NOT EXISTS` в `server/db/index.ts` + `.unique()` в Drizzle-схеме), предпроверка дубля удалена, `SQLITE_CONSTRAINT_UNIQUE` → `409`; тест на уровне БД + существующий API-тест 409. [ADR-0003](docs/adr/0003-unique-slot-booking.md).
24. ✅ Экран успеха (Medium #2): `src/components/booking-success.tsx` — «Встреча успешно запланирована!», сводка (дата/время, длительность, имя, email), кнопка «Выбрать другое время» (сброс + refetch); `useBooking.bookSlot` возвращает `Booking | null`, `onBooked(booking)`; HomePage рендерит экран вместо списка. 2 RTL-теста (`src/pages/home-page.test.tsx`).
25. ✅ Комментарий (Medium #3): колонка `comment TEXT` (+ALTER при старте), zod `max(1000)` с пустым → `null`, зеркала схем и типов обновлены, `Textarea` (`src/components/ui/textarea.tsx`) в диалоге, `comment` в `POST`/`GET /api/bookings`; 5 серверных + 1 RTL-тест. Билд-объём CSS 16.47 kB, JS 341.48 kB (gzip 106.10).
26. ✅ Месячная сетка (Medium #4): `src/components/month-calendar.tsx` (навигация по месяцам, метки дней со слотами, прошлые/пустые/занятые дни disabled, `aria-label=YYYY-MM-DD`), `src/utils/dates.ts` (`toDateKey`/`parseDateKey`/`startOfDay`); HomePage фильтрует список по выбранному дню на клиенте (activeDate = earliest slot, если выбранного дня больше нет). 3 теста компонента + интеграционный; API `?date=` сознательно отложен к генерации/TZ.
27. ✅ Генерация слотов (Medium #5): `server/availability.ts` — `defaultAvailabilityRules` (Пн–Пт, 10:00–18:00 UTC, 30 мин, буфер 10, minNotice 120 мин, горизонт 14 дней) и чистая `generateSlotStarts(now, rules)`; сид в `server/db/index.ts` заменён генератором; `GET /api/slots` фильтрует `now + minNotice`; `POST /api/bookings` → 400 «Слот уже недоступен» в пределах minNotice. [ADR-0004](docs/adr/0004-slot-generation-rules.md). 4 unit + 2 API-теста.
28. ✅ Таймзоны (Medium #6, последний): `src/utils/timezone.ts` (`toDateKeyInZone` через en-CA, `formatDateTimeInZone`, `timeZoneOptionLabel` с GMT-offset), `TimeZoneSelect` (нативный select, browser TZ по умолчанию + 6 популярных), `timeZone` прокинут в MonthCalendar (группировка дней), BookingDialog, BookingSuccess и список слотов; хранение — по-прежнему UTC ISO. 4 unit + 2 RTL-теста.
29. ✅ Телефон опциональный (по спеке): zod `optional` + `transform` (пустой/`undefined` → не задан) + `refine` (валиден только если задан) в `server/validation.ts` ↔ `src/lib/validation.ts`; колонка `phone` стала nullable в Drizzle-схеме, миграция старых БД через пересборку таблицы (SQLite не умеет снимать `NOT NULL`); контракт `phone?: string` (вход) / `phone: string | null` (выход); в форме пометка «необязательно»; в экране успеха телефон показывается только если указан. 2 API + 1 RTL-тест.
30. ✅ ESLint полностью чистый: `buttonVariants` перестал экспортироваться из `src/components/ui/button.tsx` (внутренний, потребителей нет) — убран warning `react-refresh/only-export-components`.
31. ✅ Деплой на Render подтверждён как живой: https://calendar-slots-app.onrender.com (см. `docs/ci_cd_render.md`). Проверено: `/health` 200, `/` 200 (SPA), `/api/slots` 200, `/api/bookings` 200; собранный JS-хеш совпадает с локальным. В README исправлен неверный URL (`ai-for-developers-project-386.onrender.com` → `calendar-slots-app.onrender.com`).
32. ✅ Панель организатора `/dashboard` (Low): `react-router-dom` 7 (`BrowserRouter` в `main.tsx`, `/` и `/dashboard`); `DashboardPage` + `BookingsTable` (список броней с отменой) + `AvailabilityForm` (чекбоксы дней, числовые поля, zod до отправки). Бэкенд: таблица `availability_rules` (одна строка `id=1`), `server/rules.ts` (`load`/`save`/`regenerateFutureSlots` — свободные будущие слоты пересобираются, занятые не трогаются), `GET/PUT /api/availability`, `DELETE /api/bookings/:id` (`204/404/400`), `minNotice` читается из правил. Схемы/типы-зеркала (`availabilityRulesSchema`, `src/types/availability.ts`). [ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md). 7 API + 6 RTL-тестов.
33. ✅ Кнопка «Назад» на экране успеха (`BookingSuccess`): `Button variant="ghost"` с иконкой `ArrowLeft` вверху карточки, вызывает `onReset` → возврат к списку слотов; +1 RTL-тест.
34. ✅ Экспорт брони в календарь (Экран 3 спеки): `src/utils/calendar.ts` (`buildIcs` — VCALENDAR/VEVENT с UTC `DTSTART/DTEND`, CRLF, экранирование переводов строк; `googleCalendarUrl` — шаблон события; `downloadIcs` — Blob-скачивание). Кнопки «Скачать .ics» и «Добавить в Google Календарь» на экране успеха. 3 unit + 1 RTL-теста. Ссылка отмены отложена (нужен токен/API).
35. ✅ Отмена брони по токену-ссылке (Экран 3): колонка `bookings.cancelToken` (nullable + unique; миграция `ALTER`+индекс после колонки), токен `crypto.randomUUID()` в ответе `201` (`CreatedBooking`), `POST /api/bookings/cancel` (`204/404/400`), ссылка `${origin}/cancel/:token` с копированием на экране успеха, страница `/cancel/:token` (отмена по явной кнопке, не при открытии). [ADR-0006](docs/adr/0006-cancellation-by-token.md). 4 API + 3 RTL-теста.
36. ✅ Перенос брони по токену (Экран 3): `GET /api/bookings/by-token/:token` (capability, 404), `POST /api/bookings/reschedule` — `UPDATE bookings.slotId` (старый слот свободен, новый занят; `200/400/404/409`, no-op на тот же слот), страница `/reschedule/:token` (текущее время + календарь + свободные слоты), ссылка «Перенести» на экране успеха. Схема БД не менялась. [ADR-0008](docs/adr/0008-reschedule-by-token.md). 6 API + 2 RTL-теста.
37. ✅ `422` вместо `400` на невалидное тело (спека): zod-ошибки в `POST /api/bookings`, `POST /api/bookings/cancel`, `PUT /api/availability` → `422 Unprocessable Entity`; бизнес-ошибки (прошедший слот, `minNotice`, некорректный `:id`) остаются `400`. Тесты и доки обновлены.
38. ✅ Визуальный редизайн, **Этап 1** (`3c97980`): токены в `src/index.css`, шрифты (`@fontsource/golos-text`, `@fontsource/lora`), `ThemeProvider`/`useTheme`/`ThemeToggle`, `useMediaQuery`, анти-флеш-скрипт в `index.html`, стабы `matchMedia`/`localStorage` в `src/test/setup.ts`. [ADR-0007](docs/adr/0007-visual-redesign-and-themes.md) (Proposed).
39. ✅ Визуальный редизайн, **Этап 2** (`14df808`): Desktop-раскладка страницы бронирования — `AppHeader`, `HostInfo` (слот-карточка хоста), `SlotGrid`, `MonthCalendar`/`TimeZoneSelect` обновлены, `src/config/host.ts`, `src/utils/plural.ts`. `minNoticeMin` поднят из `HostInfo` в `HomePage` (порядок `fetch` важен для контрактного `App.test`). 91/91 тестов зелёные.
40. ✅ Скиллы и агентная среда (шаг курса, `6aa21ce`): установлен набор [mattpocock/skills](https://github.com/mattpocock/skills) в `.agents/skills/` (`npx skills@latest add mattpocock/skills --agent '*' -y`; сейчас в `.agents/skills/` **83 директории**: ~11 проектных + upstream-набор, манифест — `skills-lock.json`) + настроено через `setup-matt-pocock-skills`: трекер — GitHub Issues, метки — дефолтные, домен — single-context. Записано в `docs/agents/{issue-tracker,triage-labels,domain}.md`, в `AGENTS.md` добавлен раздел `## Agent skills`. Лишние `.claude/`/`agent/` удалены (конвенция `.agents/skills/`).
41. ✅ Хосты + API v1 (`server/hosts.ts`, аддитивно): таблица `hosts` (UUID PK, unique slug), сид дефолтного хоста (`slug=default`), `GET /api/v1/hosts/:slug/settings` и `GET /api/v1/hosts/:slug/slots?date=&timezone=` (`404` unknown slug, `400` дата/пояс); `selectFutureSlots()` переиспользован; `/api/*` без изменений. [ADR-0009](docs/adr/0009-hosts-and-api-v1.md). 7 API-тестов. Итог: 98/98 тестов.
42. ✅ Визуальный редизайн, **Этап 3** (`b163d03`): мобильная раскладка D — `src/components/date-strip.tsx` (лента доступных дат, `aria-pressed`, прокрутка к выбранной), `src/components/booking-bar.tsx` (sticky-панель снизу с выбранным временем), `HomePage` при `useMediaQuery('(min-width: 1024px)') === false` (`AppHeader variant="mobile"`, кнопка «Весь месяц» с `aria-expanded`, `SlotGrid columns={3}`). Тесты: `date-strip.test.tsx` + тест страницы с `matchMedia → false`.
43. ✅ Визуальный редизайн, фикс (`5a4e95e`): `ThemeToggle` добавлен в панель организатора до этапа 6 (переключатель темы доступен на обеих страницах).
44. ✅ Визуальный редизайн, **Этап 4** (`8d0513a`): рестайл формы брони — `DialogContent` с пропом `hideClose`, заголовок Lora, сводка с иконкой `Calendar`, порядок полей Имя → Email → Телефон → Комментарий, счётчик «N / 1000» под комментарием, на телефоне — панель снизу с ручкой и кнопкой во всю ширину, фокус на поле «Имя» при открытии; ошибка 409/400 из API: toast + закрыть диалог + `refetch` + снять выбор в `home-page.tsx`.
45. ✅ Визуальный редизайн, **Этап 5** (`db5aec2`): рестайл экрана успеха — `src/components/booking-success.tsx` по `design-spec.md` §3.4 (десктоп — карточка 600 px, телефон — колонка с кнопками внизу), кнопка «Назад» — ghost со стрелкой.
46. ✅ Визуальный редизайн, **Этап 6** (`7293469`): редизайн панели организатора — `src/components/dashboard-sidebar.tsx` (десктопный сайдбар: лого-`h1`, «Встречи» со счётчиком, «Доступность» → `#availability`, `ThemeToggle`), `src/components/bookings-list.tsx` вместо `bookings-table.tsx` (группировка по дню через `toDateKeyInZone`, карточки `<li>`, пустое состояние «Пока нет ни одной брони»; старый файл удалён), `src/components/booking-filter.tsx` (сегменты «Все / Неделя / Сегодня», `role="tablist"`, фильтр на клиенте), `src/components/availability-form.tsx` (дни-«таблетки», select часов, подсказка «≈ N слотов в рабочий день», кнопка «Сохранить» во всю ширину; `id` полей и zod-схема сохранены). Тесты: `closest('tr') → closest('li')` + новые (группировка, фильтр «Сегодня», подсказка «≈ 12 слотов»).
47. ✅ Внешний бэклог Gemini: добавлен бэклог Gemini (спека от внешнего ревью, ныне [`docs/archive/gemini-code-1790192589378.md`](docs/archive/gemini-code-1790192589378.md)) + раздел «Backlog из внешней спеки» в `docs/todo.md` (только MISSING/PARTIAL, P0/P1); сгенерирован `roadmap.html` (ныне архив). Итог: 105/105 тестов (17 файлов).
48. ✅ Визуальный редизайн, **Этап 7** (документация, текущий): [ADR-0007](docs/adr/0007-visual-redesign-and-themes.md) переведён в **Accepted** (ветка `feat/redesign-a-d-themes` смержена в `main`), индекс `docs/adr/README.md` обновлён; `README.md` упоминает светлую/тёмную тему и десктоп/мобильные раскладки; `MEMORY.md` и `docs/todo.md` отмечают завершение этапов 1–7.
49. ✅ Шаг 1 курса (главная страница): `CONTEXT.md` — словарь проекта (русские каноны + англ. алиасы); [ADR-0010](docs/adr/0010-landing-and-booking-routes.md); маршруты — `/` = новый `LandingPage` (витрина гостя: hero, «Как это работает», карточка организатора, CTA; данные из `GET /api/v1/hosts/:slug/settings`, фолбэк на `src/config/host.ts`), `/book/:slug` = `HomePage`, `*` = `NotFoundPage`; `host.slug = 'default'`; фронт брони переведён на API v1 (`fetchHostSettings`/`fetchHostSlots`, `useAvailability(slug)`), легаси `/api/*` сохранён; ссылки дашборда/отмены/переноса → `/book/${host.slug}`; фикс бага сайдбара (`scrollIntoView`); 3 теста лендинга + 3 smoke `App` + обновлены `home-page`/`use-availability`. Итог: 109/109 тестов, lint/typecheck/build — зелёные.
50. ✅ Шаг 2 курса (проектирование бронирования, карта решений): карта [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) с тикетами #11–#18, все закрыты. Артефакты:
    - `docs/spec.md` — утверждённая спецификация v1 (роли, user stories, правила, доменная модель, API, тестирование, соответствие критериям).
    - `api/main.tsp` + `api/tspconfig.yaml` — TypeSpec-контракт `/api/v1` (типы встреч, слоты, брони, availability, ошибки).
    - `npm run api:generate` (`scripts/api-generate.mjs`) → `docs/openapi/openapi.yaml`, `src/api/generated/` (клиентский SDK), `server/generated/api-types.ts` (серверные типы через `openapi-typescript`).
    - [ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md) — типы встреч, статусы брони, диапазоны доступности; `CONTEXT.md` дополнен терминами.
    - Правки: `@service(#{ title })` (TypeSpec 1.16), `src/api/generated` и `server/generated` вне ESLint, `tsp-output/` в `.gitignore`; повторная генерация детерминирована. Проверки: lint/typecheck/test (109)/build — зелёные.
51. ⏳ **Шаг 3 курса, T7** ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)): фронт переведён на сгенерированный SDK. Ручной `src/api/client.ts` удалён; добавлены `src/api/sdk.ts` (инстанс `ApiV1Client` + `call()` + `ApiError`) и `src/api/mappers.ts` (контрактные модели → UI-типы). Все страницы/хуки/компоненты ходят через `api.*`. Технические решения:
    - SDK сконфигурирован `endpoint: window.location.origin`, `allowInsecureConnection: true`, `retryOptions: { maxRetries: 0 }`, кастомный `httpClient` поверх глобального `fetch` — иначе в Node-тестах `@typespec/ts-http-runtime` резолвит nodeHttpClient и не перехватывается `vi.stubGlobal('fetch')`.
    - Удалены `src/types/{host,availability,event-type}.ts`; `src/types/booking.ts` оставлен как UI-модели; типы `AvailabilitySettings`/`EventType`/`Booking` из `@/api/generated`.
    - Тестовый хелпер `src/test/http.ts` (`requestPath` + `jsonResponse`); моки обновлены (абсолютный URL SDK, обязательный `Content-Type: application/json`). `dashboard` собирает `eventTypeTitle` из `listEventTypes`.
    - Проверки: lint 0, typecheck чисто, **137/137 тестов**, build ✓ (JS 510.78 kB / gzip 155.12 — предупреждение о размере чанка).
52. ⏳ **Шаг 3 курса, T8** ([#26](https://github.com/frostiks777/ai-for-developers-project-386/issues/26)): контракт-тесты + e2e Playwright ([ADR-0012](docs/adr/0012-contract-tests-and-e2e.md)).
    - Контракт приведён к реальности и реализация — к контракту: `api/main.tsp` — optional-поля `? : T | null` (`EventType.description`, `AvailabilityDay.date`, `Booking.clientPhone/clientNotes`), перегенерировано; сервер `toBooking(row, slug, timeZone)` теперь отдаёт `timeZone`, `/api/v1/hosts/:slug/settings` возвращает контрактные `{slug,name,timeZone}` (убрана легаси-форма `{...host, availability}`). `server/types.ts`: удалён устаревший `HostSettings`.
    - `server/contract.test.ts`: все маршруты `/api/v1/*` из `docs/openapi/openapi.yaml` зарегистрированы (`app.hasRoute`); ключевые ответы (HostSettings, AvailabilityDay, Booking, EventType[]) валидируются `ajv` + `ajv-formats`; `nullable: true` нормализуется в JSON Schema `anyOf`.
    - `playwright.config.ts` + `e2e/guest-booking.spec.ts`: `webServer` = `npm run build && npm start`, `PORT=3100`, `DATABASE_PATH=:memory:`; сценарии — сквозной путь гостя и конфликт слотов (`409 SLOT_TAKEN`, в т.ч. другим типом). Скрипт `npm run test:e2e` (вне `npm test` и CI); `e2e/**` исключён из vitest.
    - devDeps: `ajv`, `ajv-formats`, `yaml`, `@playwright/test` (Chromium 153). README дополнен разделом про e2e. Проверки: lint 0, typecheck чисто, **141/141 тестов**, e2e 2/2, build ✓.
53. ⏳ **Шаг 3 курса, T9** ([#27](https://github.com/frostiks777/ai-for-developers-project-386/issues/27)): финальная сверка со спецификацией и контрактом.
    - Контракт приведён к реальности: скаляр `LocalDateTime` (`@format date-time-local`) → `UtcDateTime` (`@format date-time`); ошибки описаны конвертом `model ErrorResponse { error: ApiError }`, все операции возвращают `T | ErrorResponse`. Перегенерировано; `src/api/sdk.ts` использует `ErrorResponse`.
    - `docs/spec.md`: §3 (типы встреч: создать/вкл-выкл/удалить), §4 (длительность из типа, сетка по `slotDurationMin`), §5 (фактические колонки camelCase), §6 (UTC ISO + `{error: ApiError}`, `listHostBookings` — все брони), §9 → «Закрытые вопросы Шага 3».
    - `docs/course-steps.md`: Шаг 3 отмечен выполненным; `docs/todo.md`: критерии Шага 3 = ✅. Проверки: lint/typecheck/141 тестов/build + e2e 2/2 — зелёные.
54. ✅ Пост-редизайн доработки + синхронизация (2026-09-24):
    - `HostInfo` и мобильный заголовок брони берут название выбранного типа встречи (`selectedType.title`) вместо статичного `host.meetingTitle`; формат — из `locationType` (`Онлайн-звонок`/`Очная встреча`/`Телефонный звонок`). Коммит `b676f72`.
    - `BookingSuccess` прокидывает название типа встречи в Google Calendar и `.ics` (`eventTypeTitle` ← `HomePage`; `title` в `buildIcs`/`googleCalendarUrl`); тесты `calendar.test.ts` + `home-page.test.tsx`. Коммит `0c10fe2`.
    - Фикс переполнения колонки «Доступность» (360 px): кнопка «Убрать» → компактная иконка-крестик (`aria-label`), тайм-инпуты `flex-1 min-w-0`; тест `availability-settings-form.test.tsx`.
    - Ветка `feat/redesign-a-d-themes` удалена (local + remote; была полностью смержена в `main`).
55. ✅ План `docs/todo.md`, Фазы D → A (2026-09-25): редизайн блока «Доступность» и UI-фиксы панели.
    - **Фаза D** (`src/components/availability-settings-form.tsx`): тоггл дня `role="switch"` вместо чекбокса; иконка `+` (`Добавить интервал: <день>`, новый интервал ставится после последнего без пересечения); копирование дня на другие дни (`Copy` + `Dialog`); пресеты `Пн–Пт 10–18`, `Пн–Пт 9–18`, `Каждый день 10–20`, `Очистить всё` с Undo-toast; индикатор «Часовой пояс: <IANA>»; real-time валидация (хронология, пересечение, мин. длительность по `slotDurationMin`) с блокировкой «Сохранить»; подсказка о пересечении. Тесты `availability-settings-form.test.tsx` (9) + обновлены `dashboard-page.test.tsx`.
    - **Фаза A**: сайдбар `/dashboard` — ссылка «Блокировки» `#blocks` (`CalendarOff`, `BLOCKS_SECTION_ID`); аудит меню (все секции скроллят, при отсутствии — тихий выход; мобилка на табах); фикс обрезки слотов верифицирован (`home-page.tsx:249-292`, коммиты `4e4ddb6`/`edb3dc7`). Тесты `dashboard-sidebar.test.tsx` (3). `docs/todo.md` синхронизирован.
    - Проверки: lint 0, typecheck чисто, **165/165 тестов**, build ✓.
56. ✅ План `docs/todo.md`, **Фаза B, B1+B2** (2026-09-25): P0-пункты публичного флоу.
    - **B1** (`495f7a9`): имя `min 2`; `comment`/`notes` `max 500`; маска телефона (`src/utils/phone.ts`, RU `+7 (900) 000-00-00`, иностранные — цифры с `+`); 409 → inline-алерт `role="alert"` в диалоге (`BookSlotResult` в `use-booking`); прямая кнопка «Отменить встречу» в `BookingSuccess`.
    - **B2** ([ADR-0015](docs/adr/0015-booking-guests-consent-idempotency.md)): контракт `api/main.tsp` расширен — `CreateBookingRequest.guests?`, `consentAccepted`, `Booking.clientGuests?`, `@header("Idempotency-Key")`; регенерация `npm run api:generate`. БД: `bookings.guests` (JSON), `consentAccepted`, `idempotencyKey` (UNIQUE), аддитивные `ALTER … IF NOT EXISTS` ([migrate.ts](server/db/migrate.ts)). Сервер: v1 отклоняет без согласия (`422`), повтор по ключу возвращает ту же бронь. Клиент: чипы гостей (Enter), чекбокс согласия, `options.idempotencyKey` в SDK. Тесты: серверные (гости, согласие, идемпотентность) + RTL (гости, согласие, маска).
    - Инфра: `vite.config.ts` → `testTimeout: 15000` (RTL-тесты под параллельной нагрузкой изредка превышали дефолт).
    - Проверки: lint 0, typecheck чисто, **176/176 тестов** (2 прогона зелёные), build ✓. Осталось (B3): S5 `/events` + табы, `/booking/:uuid/confirmed`.
57. ✅ План `docs/todo.md`, **Фаза B, B3** (2026-09-25): публичная витрина событий и shareable-экран подтверждения.
    - `src/pages/events-page.tsx` — маршрут `/events` (S5): карточки (имя, email, `Слот: YYYY-MM-DD-HH:mm`, `Создано: DD.MM.YYYY, HH:mm`) из `GET /api/v1/hosts/:slug/bookings`, только `confirmed` + будущие, сортировка, пустое состояние; 2 RTL-теста.
    - `AppHeader` — проп `tabs` (pill-навигация «Записаться / Предстоящие события», `aria-current`); применён на лендинге, `/book/:slug`, `/events`.
    - `src/pages/confirmed-page.tsx` — маршрут `/booking/:uuid/confirmed`: `GET /api/v1/bookings/:id`, название типа встречи, аватар/имя организатора, дата/время с поясом, способ связи, GCal/.ics, ссылки «Перенести»/«Отменить»; 2 RTL-теста.
    - Проверки: lint 0, typecheck чисто, **180/180 тестов** (31 файл), build ✓. Фаза B (B1+B2+B3) завершена.
58. ✅ План `docs/todo.md`, **хвосты P0** (2026-09-25): поиск по IANA и формат 12/24.
    - `TimeZoneSelect` → combobox (`role="combobox"`/`listbox`, `searchTimeZones` через `Intl.supportedValuesOf`, при фокусе — популярные пояса, при вводе — фильтр по подстроке). `src/utils/timezone.ts`: `allTimeZones`, `searchTimeZones`; `formatTimeInZone`/`formatDateTimeInZone`/`formatTimeRange` принимают `hour12?`.
    - `src/hooks/use-time-format.ts` (context) + `src/components/time-format-provider.tsx` + `src/components/time-format-toggle.tsx` (24 ч / 12 ч, localStorage `call-calendar-hour12`); `App` обёрнут в провайдер; тоггл в `HostInfo` и мобильной шапке. Формат времени учитывают `SlotGrid`, `BookingBar`, `BookingDialog`, `BookingSuccess`.
    - Инфра: `vite.config.ts` → `testTimeout: 30000` (стабильность параллельных RTL-прогонов).
    - Проверки: lint 0, typecheck чисто, **187/187 тестов** (32 файла), build ✓. Дальше — Фаза C (P1 self-service/dashboard).
59. ✅ План `docs/todo.md`, **Фаза C, часть 1** (2026-09-25): self-service маршруты и дашборд.
    - Маршруты-алиасы `/booking/:uuid/cancel` и `/booking/:uuid/reschedule` (старые `/cancel/:token`, `/reschedule/:token` сохранены); `CancelPage`/`ReschedulePage` читают `token ?? uuid`. Страница отмены показывает детали встречи (`GET /api/v1/bookings/:id`).
    - `/admin/{availability,event-types,bookings}` — маршруты ведут на панель организатора.
    - Дашборд: `BookingFilter` → табы «Предстоящие / Прошедшие / Отменённые» (отмена только для предстоящих), поиск по имени/email (`applySelection`), счётчик «Встречи · N» = будущие подтверждённые.
    - Доступность: пресеты горизонта 14/30/60 рядом с `horizonDays`.
    - Инфра: `vite.config.ts` → `retry: 1` (редкие тайминговые флаки RTL под нагрузкой).
    - Проверки: lint 0, typecheck чисто, **190/190 тестов**, build ✓. Осталось в C: `buffer_before/after` (контракт/БД), отдельный `EventForm` с `description`.
60. ✅ Хвосты P1 + Фаза 4 (2026-09-25):
    - **Раздельные буферы** `bufferBeforeMin`/`bufferAfterMin` — [ADR-0016](docs/adr/0016-split-buffers.md) (коммиты `4640244`, `f205bc2`).
    - **Deep-link `/admin/*`** (`f6abc4f`): `DashboardPage` принимает `initialSection` — прокрутка к секции на десктопе, стартовый таб на телефоне; маршруты `/admin/{availability,event-types,bookings,blocks}`; 2 RTL-теста.
    - **Basic-auth панели организатора** — [ADR-0017](docs/adr/0017-dashboard-basic-auth.md): `/dashboard` и `/admin/*` под HTTP Basic Auth, пароль из `ADMIN_PASSWORD` (`server/env.ts` + `onRequest`-хук, `timingSafeEqual`); если переменная не задана (dev/тесты/e2e) — гейт выключен. Демо-пароль `call-calendar-admin` — в README, `.env.example`, `render.yaml`. Гейт также закрывает **административные API** (`PUT availability`, мутации `event-types`/`blocks`, легаси `/api/availability`/`/api/bookings`); публичные чтения гостя (`GET availability/event-types/bookings`) остаются открытыми. Фикс: вход в панель из SPA — полной навигацией (`AppHeader` → `<a href>` для `/dashboard`/`/admin/*`). 8 серверных + 3 RTL-теста (`server/admin-auth.test.ts`, `src/components/app-header.test.tsx`).
    - **README синхронизирован**: стек БД (Postgres/Neon + PGlite вместо SQLite), таблица env (`DATABASE_URL`, `ADMIN_PASSWORD` вместо `DATABASE_PATH`), раздел «Доступ организатора».
    - **Логотип сайдбара** `/dashboard` — ссылка на главную `/` (в мобильной шапке логотип уже вёл на `/`); +1 RTL-тест.
    - Проверки: lint 0, typecheck чисто, **206/206 тестов** (34 файла), build ✓.
61. ✅ **Мульти-хост-модель** (2026-09-25) — [ADR-0018](docs/adr/0018-multi-host-model.md):
    - Схема: `slots.hostId`/`bookings.hostId` (`NOT NULL REFERENCES hosts`), аддитивная миграция с бэкфиллом на дефолтный хост (`bookings` — через `event_types.hostId`), индексы.
    - Генерация/чтение слотов per-host: `selectFutureSlots(hostId)`, `regenerateFutureSlots(hostId, …)`, `regenerateFutureSlotsForSettings(hostId, …)`, сид для дефолтного хоста.
    - `findHost(ref)` — по slug **или** UUID; все `/api/v1/hosts/:ref/*` принимают UUID (сохранена совместимость со slug).
    - CRUD: `GET/POST /api/v1/hosts` (под Basic-auth), `409` дубликат slug, `422` неверный пояс; `POST /api/v1/hosts/:ref/bookings` пишет `hostId`, списки/слоты скоупятся по хосту.
    - Фронт: `/book/:slug` принимает slug или UUID (regex). Осталось: per-host скаляры расписания (buffer/minNotice/horizon) и UI управления хостами.
    - Проверки: lint 0, typecheck чисто, **тесты** (11 серверных файлов + `server/multi-host.test.ts`), build ✓.
62. ✅ **«Мои встречи» на устройстве** (2026-09-25) — [ADR-0019](docs/adr/0019-my-bookings-on-device.md):
    - `src/utils/my-bookings.ts` — `localStorage` (`call-calendar-my-bookings`), дедуп по id, лимит 50; `src/pages/my-bookings-page.tsx` — страница `/my` с «Перенести»/«Отменить»/«Убрать» и бейджем «Прошла».
    - `HomePage.handleBooked` сохраняет `{ id: cancelToken, startAt, durationMin, eventTypeTitle, hostSlug }`; вкладка «Мои встречи» в шапке (лендинг, `/book/:slug`, `/events`, `/confirmed`, `/my`).
    - Тесты: `my-bookings.test.ts` (4), `my-bookings-page.test.tsx` (3), +1 в `home-page.test.tsx`. Проверки: lint 0, typecheck чисто, build ✓.
63. ✅ **Asciinema-демо** (2026-09-25): записан и опубликован каст сквозного пути гостя — https://asciinema.org/a/mpuvYnckvG7iKlH4 (`docs/demo.cast` в репозитории), README обновлён (бейдж + инструкция, в т.ч. PowerSession для Windows). Попутный фикс `scripts/demo.sh`: кириллица в `curl -d` на Windows-curl ломала `Content-Length` → `--data-binary @-` (работает и на Linux). Прод-`.env` (Neon) не затрагивался — сервер поднимался на PGlite с пустым `DATABASE_URL`.
64. ✅ **Per-host скаляры расписания** (2026-09-25) — [#41](https://github.com/frostiks777/ai-for-developers-project-386/issues/41), [ADR-0020](docs/adr/0020-per-host-availability-rules.md):
    - `availability_rules` больше не глобальная строка `id=1`: ключ — `hostId` (+ `UNIQUE(hostId)`, legacy-колонка `id` удаляется идемпотентной миграцией, существующая строка бэкфиллится на дефолтный хост).
    - `loadAvailabilityRules(hostId)` / `saveAvailabilityRules(hostId, rules)` (upsert по `hostId`); `availability-settings.ts` прокидывает `hostId`; сид слотов в `db/index.ts` — по правилам дефолтного хоста; `minNoticeMs(hostId)` во всех проверках слотов; легаси `/api/availability` — на дефолтном хосте; `POST /api/v1/hosts` сидирует новому хосту `defaultAvailabilityRules`.
    - Тесты: `server/host-availability.test.ts` (4). Проверки: lint 0, typecheck чисто, **223/223 тестов** (38 файлов), build ✓.
    - **Осталось (отдельная задача [#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)):** UI управления хостами — селектор в шапке панели (`localStorage`), список/создание, скоупинг секций, динамический `host.slug`.
65. ✅ **Активный организатор на клиенте + UI управления хостами** (2026-09-25) — [#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42), [ADR-0021](docs/adr/0021-active-host-and-hosts-ui.md):
    - Контракт: `api/main.tsp` + `Host`/`CreateHostRequest`, `GET/POST /api/v1/hosts`; регенерация `npm run api:generate`. `GET /api/v1/hosts` — публичное чтение, `POST` — Basic-auth.
    - `HostProvider` (`src/components/host-provider.tsx`) тянет список хостов, хранит `activeSlug` в `localStorage` (`call-calendar-active-host`); хук `useActiveHost` (`src/hooks/use-active-host.ts`) — с дефолтом для тестов без провайдера.
    - Весь фронт на `activeSlug`: `src/config/host.ts` без `slug` (только брендинг); `App` (`/book/:slug` — хост известен, если есть в списке), лендинг, `/events`, `/my`, confirmed/cancel/reschedule, панель.
    - Панель: `HostSelect` в шапке, секция «Организаторы» (`HostsEditor`) + маршрут `/admin/hosts`, мобильный таб «Хосты»; все секции перезагружаются при смене хоста.
    - Тесты: `host-select.test.tsx` (2), `hosts-editor.test.tsx` (3), обновлён `App.test.tsx`, `server/admin-auth.test.ts` (GET hosts публичный / POST 401). Проверки: lint 0, typecheck чисто, **228/228 тестов**, build ✓, e2e 2/2.
66. ✅ **Фикс: кнопка «Забронировать» не работала для хоста без типов встреч** (2026-09-25) — [#45](https://github.com/frostiks777/ai-for-developers-project-386/issues/45):
    - Причина: `POST /api/v1/hosts` сидировал только правила доступности, без типа встречи; `BookingDialog` требовал `eventTypeId`, которого не было, и `handleSubmit` молча выходил (кнопка выглядела активной).
    - Фикс: `POST /api/v1/hosts` создаёт дефолтный тип (`consultation`); при старте хостам без типов сидируется дефолтный (идемпотентный бэкфилл в `server/db/index.ts`); `BookingDialog` блокирует submit без `eventTypeId`/слота и показывает сообщение.
    - Тесты: `server/multi-host.test.ts`, `src/components/booking-dialog.test.tsx`. Проверки: lint 0, typecheck чисто, **230/230 тестов**, build ✓.
67. 📌 **Backlog: защита от ботов (CAPTCHA) в окне брони** — [#46](https://github.com/frostiks777/ai-for-developers-project-386/issues/46): публичный `POST .../bookings` + поле «Гости» (произвольные email) → CAPTCHA, серверная верификация и rate-limit по IP; выбор провайдера — отдельным ADR. Зафиксировано в `docs/todo.md` (Backlog).
68. ✅ **AGENTS.md:** добавлен обязательный пункт «задачи и баги — только через GitHub Issue» (метка `bug` для багов, номер в коммите, закрытие после пуша).
69. ✅ **Аудит мобильной вёрстки (2026-09-28)** — [#49](https://github.com/frostiks777/ai-for-developers-project-386/issues/49) (метка `bug`, P1): Playwright-прогон 9 маршрутов × 2 темы × 2 ширины (390×844, 360×800) + интерактивные состояния; скриншоты и замеры в `docs/artefacts/` (коммит `ee63b9e`). Найденные дефекты: шапка шире экрана (~535 px), наложение табов панели, пересечение текста/кнопки в «Блокировках», обрезка ленты дат, блоки успеха за краем, `/my` без токенов оформления, ландшафтная шапка-«островок». Часть перекрывается редизайном v2.
70. ✅ **Редизайн v2 «Мята и солнце»** — [#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48), ветка `feat/redesign-v2-mint` (смержена, закрыта):
    - **Этап 0** (`6e7e54d`): пакет в `docs/design/v2/`, ADR-0022…0024 в `docs/adr/` (Proposed), скилл `apply-design-v2` в `.agents/skills/` и в `AGENTS.md`.
    - **Этап 1** (`e3328f5`, `335c8e1`): `fix(api): require admin auth for bookings list and redirect /events` + `feat(web): move upcoming events into organizer panel` ([ADR-0022](docs/adr/0022-private-bookings-list.md)); `GET /api/v1/hosts/:slug/bookings` под Basic-auth, `/events` → 302 на `/admin/bookings`, `events-page` и вкладка удалены, ADR-0017 п.6 помечен заменённым.
    - **Этап 2** (`2f4e6de`): `fix(web): correct weekday labels and show cancel time in guest zone` — `formatWeekdayShort` (TDD: падающий тест на 2026-09-28 → Пн), `formatZoneShort`/`formatZoneOffsetLabel` (словарь предложного падежа), `date-strip` и `cancel-page` обновлены.
    - **Этапы 3–12** (`e023cc4`, `4c6ffd5`, `47f2deb`, `d69d90a`, `dcb5d52`, `eec5a16`, `7189747`, `e7da573`, `92074b4`, `b356ea8`): токены/фон/стекло/шапка; десктоп «Дни»; «Неделя»; мобильный мастер; экран успеха; 409 + подсказки; страница управления встречей; панель-разделы + «Обзор»; пояс правил доступности ([ADR-0024](docs/adr/0024-slots-in-host-timezone.md)); лендинг (имя без дубля, CTA `bg-highlight`, блок «Форматы встречи» `/book/:slug?type=…`) и «Мои встречи» (`glass`).
    - **Этап 13** (`82c9c73`): ADR-0022…0024 → **Accepted** (2026-09-28), ADR-0007 дополнен ADR-0023, `docs/adr/README.md` обновлён; `docs/design/README.md` — v2 как текущий дизайн, v1 как история; «Отклонения» в `docs/design/v2/README.md`.
    - **Итог:** этапы 0–13 влиты в `main` (PR [#54](https://github.com/frostiks777/ai-for-developers-project-386/pull/54), merge `e7a56ba`), issue #48 закрыт. Визуальная приёмка со `screenshots/` — за человеком (см. «Актуальный план» в `docs/todo.md`).
    - Проверки: lint 0, typecheck чисто, **266/266 тестов** (47 файлов), build ✓.
71. ✅ **Мобильные правки приёмки (2026-09-28)** — issues #56–#62 (PR [#63](https://github.com/frostiks777/ai-for-developers-project-386/pull/63), merge `4124ff6`) и #65–#66 (PR [#67](https://github.com/frostiks777/ai-for-developers-project-386/pull/67), merge `976f1f2`); релизы v1.21.0:
    - #52/#53 (`ac2e9cc`, `ae1543a`): «Неделя глазами гостя» в панели показывает встречи (`AvailabilityPreview` принимает `slots`, `bg-primary`, `data-state=meeting`; `weekdayAndMinuteInZone`); `dev-all.mjs` ждёт `GET /health` API до старта Vite (гонка ECONNREFUSED).
    - #56/#62: мобильный мастер листает только доступные даты; выбранное время на любой дате открывает шаг анкеты (`selectedSlot` ищется среди всех слотов).
    - #57: превью доступности показывает занятые окна (`DashboardPage` грузит слоты и передаёт в форму).
    - #58: табы разделов мобильной панели переносятся (`flex-wrap`).
    - #59: кнопка «Скопировать текст об отмене».
    - #60: у прошедших встреч в `/my` скрыта «Отменить».
    - #61: «Тема» доступна в мобильной шапке (`AppHeader` больше не прячет `ThemeToggle`) — отклонение от §1.2 зафиксировано.
    - #65: мастер сохраняет поля при смене даты (шаги смонтированы, неактивные скрыты атрибутом `hidden`).
    - #66: поля формы «Хосты» на всю ширину на мобильных (`lg:grid-cols-2` вместо `sm:`).
    - Проверки: lint 0, typecheck чисто, **271/271 тестов** (47 файлов), build ✓, CI/e2e — зелёные.
72. ✅ **Синхронизация документации с кодом (2026-09-28)** — [#72](https://github.com/frostiks777/ai-for-developers-project-386/issues/72). Аудит ~55 расхождений (SQLite/`DATABASE_PATH`/`src/api/client`/легаси-API вместо v1) → правки:
    - `AGENTS.md`: стек (PostgreSQL/Neon + PGlite, миграции `server/db/migrate.ts`, TypeSpec-контракт, ~12 серверных тест-файлов), «Directory structure» (реальные `src/`, `server/`, `api/`, `e2e/`, `scripts/`, `docs/*`), «Commands» (`dev:all`, `start`, `preview`, `test:e2e` — job в CI, `api:generate`), скиллы (83 директории, `apply-design`/`telegram-bridge`), метки `bug`/`enhancement`.
    - `README.md`: роуты (`/my`, `/booking/:uuid/*`, `/admin/*`), таблица API — публичные и админские (Basic-auth) маршруты `/api/v1/*` + легаси, форматы ошибок (конверт v1 vs плоский legacy, `400` у legacy-reschedule), комментарий `max(500)`, слоты в поясе хоста, e2e в CI, деплой Neon + `ADMIN_PASSWORD`, `src/api/sdk.ts` вместо `client.ts`.
    - `docs/architecture.md`: БД, слои фронта, `server/db/*`, полные роуты и тесты, поток данных и диаграмма (Neon/PGlite), команды.
    - `docs/ci_cd_render.md` пересобран под Neon (Environment Group `DB`, `ADMIN_PASSWORD`, отсутствие `db:seed`); `docs/ci_cd.md` помечен DEPRECATED (GCP не используется; ныне архив).
    - `docs/spec.md` помечен снимком Шага 2; §5 — фактические таблицы (PostgreSQL, `time_blocks`, `guests`/`consentAccepted`/`idempotencyKey`, раздельные буферы, `UNIQUE(hostId)`).
    - `docs/todo.md`: S5 `/events` помечен отменённым ([ADR-0022](docs/adr/0022-private-bookings-list.md)), «Ключевые расхождения» — «закрыты», `23505` вместо `SQLITE_CONSTRAINT`, `max(500)`, PR #9/1.8.0 заменён актуальным релиз-процессом, «Актуальный план» перестроен (#72 → #49 → #46).
    - `MEMORY.md`: шапка (курс закрыт, открытые #49/#46/SSL, актуальный стек), результаты проверок **272/272** (47 файлов) + исторический блок 230/230, версии зависимостей из `package.json` (`pg`/`pglite` вместо `better-sqlite3`), плагин superpowers помечен неподключённым (в `opencode.jsonc` ключ `plugin: ["opencode-notify"]`), «83 скила» вместо «38», устаревшие строки «Ключевых решений» помечены историей.
    - `drizzle.config.ts`: `dialect: 'sqlite'` → `'postgresql'`, `dbCredentials.url` из `DATABASE_URL`.
    - Ссылки: `docs/model-usage.md` (`../MEMORY.md`), `docs/agents/domain.md` (примеры ADR), `docs/agents/triage-labels.md` (`bug`/`enhancement`), `docs/agent-principles.md` (список скиллов), `docs/design/v2/adr/0022…0024` — черновики помечены «заморожен, канон в `docs/adr/`», ссылки на ADR-0017/0007 исправлены.
    - Удалена мусорная директория `design/` в корне репозитория (108 файлов, дубли пакета v2 с висящими ссылками; содержимое восстановимо `git checkout HEAD -- design/` до коммита).
    - Проверки: lint 0, typecheck чисто, **272/272 тестов** (47 файлов), build ✓.
73. ✅ **Мобильный аудит после v2 (#49)** (2026-09-28): 14 экранов × 2 ширины (360×800, 390×844) × 2 темы = 56 проверок; из 11 дефектов issue 9 закрыты редизайном v2, осталось два в панели — оба починены:
    - `availability-settings-form.tsx`: строка дня — группа полей времени держит `min-w-[208px]` и переносится целиком, кнопки `+`/копирования переносятся на вторую строку с `max-sm:ml-auto`; на десктопе `sm:`-варианты сохраняют прежнюю раскладку (было: 53 px переполнения на 360 px).
    - `blocks-editor.tsx`: описание и кнопка «Заблокировать время» в столбик на мобильном (`sm:flex-row` на десктопе) — текст больше не сжимается в колонку из 2–3 слов.
    - Регресс-тесты: `availability-settings-form.test.tsx` (+1), `blocks-editor.test.tsx` (+1). Артефакты: `docs/artefacts/mobile-audit-v2/` (report.json + скриншоты 360 px + контроль 1280×820).
    - Проверки: lint 0, typecheck чисто, **274/274 тестов** (47 файлов), build ✓.
74. ✅ **Фиксы и гигиена (2026-09-29):**
    - **#76, пункт 3 — «Перенести» у прошедших встреч.** Кнопки переноса в панели нет вообще (`bookings-list.tsx` умеет только «Скопировать текст об отмене» и «Отменить»); место с багом — гостевая страница `/my`, `src/pages/my-bookings-page.tsx:83`. Теперь «Перенести» и «Отменить» рендерятся под `!isPast`, «Убрать» остаётся; тест `my-bookings-page.test.tsx` обновлён (было «оставляет перенос» — стало «скрывает перенос и отмену»). Суббота в переносе разобрана ранее (в правилах хоста были включены выходные; превью недели исправлено `885a073`).
    - **#79 — тайм-бомба теста `TwoWeekGrid`.** `src/components/two-week-grid.test.tsx` был захардкожен на `2026-09-28`; 29-го дата стала прошедшей (`isPast` в `two-week-grid.tsx:75`) → `10 окон` превращалось в `28—`. Дата понедельника (и субботы) теперь вычисляется от `new Date()`.
    - **#46 — верификация CAPTCHA:** ADR-0025 Accepted, `server/captcha.test.ts` + `server/rate-limit.test.ts` — 16/16 зелёные, `TURNSTILE_*` в проде заданы (подтверждено пользователем); issue закрыт.
    - **`AGENTS.md`:** старт работы над задачей — обязательное уведомление в Telegram-чат (тост — по-прежнему только блокер/релиз).
    - **Решения пользователя:** `ADMIN_PASSWORD` в Render не менять; TLS-проверку БД не трогать (`docs/todo.md`, «Актуальный план»).
    - Проверки: lint 0, typecheck чисто, **303/303 тестов** (51 файл), build ✓.
75. ✅ **Техдолг и продуктовый backlog (2026-09-29):**
    - [#81](https://github.com/frostiks777/ai-for-developers-project-386/issues/81) — code-split бандла: `vite.config.ts` → `build.rollupOptions.output.manualChunks` (`vendor-react` 143 kB, `vendor` 157 kB, `vendor-zod` 87 kB, `vendor-router` 39 kB, app `index` 156 kB); warning «чанк >500 kB» исчез.
    - [#82](https://github.com/frostiks777/ai-for-developers-project-386/issues/82) — e2e `e2e/manage-booking.spec.ts`: гостевой перенос и отмена по ссылке управления; 3/3 локально и в CI.
    - `docs/todo.md`: сняты стухшие чекбоксы (#76, приёмка v2), добавлен раздел «Backlog продукта (сверх курса)»: сделаны расписание/буферы/таймзоны/перенос-отмена; осталось — аккаунты, интеграции с внешними календарями, уведомления, повторяющиеся события, аналитика (предложенный порядок захода в файле).
    - `pg` v9 не выпущен (latest 8.23.0) — перепроверка SSL-режима отложена до релиза v9.
    - Проверки: lint 0, typecheck чисто, **303/303 тестов** (51 файл), build ✓, e2e 3/3.
76. ✅ **Email-уведомления** (2026-09-29) — [#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83), [ADR-0026](docs/adr/0026-email-notifications.md), исследование — [`docs/research/email-notifications.md`](docs/research/email-notifications.md):
    - Провайдер — **Brevo HTTP API** (free 300/день, свой домен не нужен; SMTP на Render Free заблокирован, Render Cron платный). Включение по `EMAIL_API_KEY`: без ключа отправка — no-op, тесты/CI/e2e без сети. Env: `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ORGANIZER_EMAIL`, `REMINDER_LEAD_MINUTES`, `REMINDERS_SECRET`, `APP_ORIGIN`.
    - Модули: `server/email.ts` (Brevo-транспорт, `appOrigin`), `server/email-templates.ts` (text+html, экранирование), `server/notifications.ts` (письма по событиям брони — гость и организатор), `server/reminders.ts` (идемпотентные due-напоминания за 24 ч + `POST /api/internal/reminders` под `X-Reminders-Secret`).
    - Схема: `bookings.reminderSentAt` + идемпотентная миграция. Планировщик: проверка при старте + ленивая в `onRequest` (в тестах выключена) + внешний cron-job.org.
    - Тесты: `email.test.ts` (5), `email-templates.test.ts` (8), `email-notifications.test.ts` (7). Попутно: e2e-порт 3100→3210 (конфликт с чужим dev-сервером), `scripts/dev-all.mjs` падает с подсказкой при занятых портах, README/env-таблица/AGENTS/architecture синхронизированы.
    - Пошаговая инструкция прода (Brevo sender + API key → env в Render → проверка → cron-job.org) — [`docs/email-setup-brevo.md`](docs/email-setup-brevo.md), [#85](https://github.com/frostiks777/ai-for-developers-project-386/issues/85).
    - Фикс [#86](https://github.com/frostiks777/ai-for-developers-project-386/issues/86): cron-job.org получал `415` на `/api/internal/reminders` (Fastify принимал только `json`/`text`) — scoped `addContentTypeParser('*')` для этого маршрута; тест на `x-www-form-urlencoded`/`text/plain`.
    - Проверки: lint 0, typecheck чисто, **323/323 тестов** (54 файла), build ✓, e2e 3/3.
77. ✅ **Актуализация документации** (2026-09-30) — [#100](https://github.com/frostiks777/ai-for-developers-project-386/issues/100):
    - Выполненные планы и снятые документы перенесены в [`docs/archive/`](docs/archive/README.md): `ai-tuning-plan.md` (внедрён полностью), `archi-scheme.md` (снапшот на `1959b89`), `ci_cd.md` (DEPRECATED, GCP не используется), `gemini-code-1790192589378.md` (P0/P1 закрыты), `Инструкция по редизайну блока Доступность.md` (все 8 пунктов сделаны), `roadmap.html`. В архиве — `README.md`-канон с таблицей «почему в архиве / актуальная замена» и правилом «новые планы сюда не кладут».
    - Ссылки на перенесённые файлы обновлены в `AGENTS.md`, `MEMORY.md`, `README.md`, `docs/todo.md`, `docs/adr/{0005,0010,0015,0016}`, `docs/ci_cd_render.md`; исправлены битые относительные ссылки в черновиках `docs/design/v2/adr/*` (`../../adr/` → `../../../adr/`). Проверка скриптом по `docs/`, `AGENTS.md`, `MEMORY.md`, `README.md`, `CONTEXT.md` — битых ссылок нет.
    - Устаревшие утверждения вычищены: `README.md` (пароль/`ADMIN_PASSWORD` в деплое, несуществующий якорь «Доступ организатора (пароль)», e2e-порт 3100 → 3210, описание auth-столбца), `docs/todo.md` (Basic-auth как текущее состояние — заменено на [ADR-0028](docs/adr/0028-dashboard-access-without-login.md)), `docs/spec.md` (сноска про Basic-auth).
    - `MEMORY.md`: устаревший файловый снимок вынесен в `docs/archive/memory-file-tree-2026-09-24.md` (со списком изменений после него), версии зависимостей пересобраны по `package.json` (добавлены `@fastify/rate-limit`, `ajv-formats`, `yaml`, `lucide-react`), результаты проверок — 336/336 (56 файлов), «Что осталось» перестроено: открыто 3 пункта, закрытое — под заголовком «Закрыто ранее».
    - Проверки: `npm test` **336/336** (56 файлов); правки только в документации.
    - Продолжение — issue [#101](https://github.com/frostiks777/ai-for-developers-project-386/issues/101): README пересобран для наставника — одна строка плашек shields.io (React, TypeScript, Vite, Fastify, PostgreSQL, Tailwind, Docker, Vitest, Playwright), новый раздел «Продукты и сервисы» (Neon, Render, Brevo, Turnstile, cron-job.org, GitHub Actions, asciinema — везде бесплатные тарифы), «Куда смотреть в документации». Попутно исправлены фактические устаревания: «контакты видны только организатору» (неверно после ADR-0028), дефолты буферов (ADR-0027 — 0 и не двигают сетку), коды ошибок v1 (`UNAUTHORIZED` → `CAPTCHA_FAILED` 422 + `RATE_LIMITED` 429), «rate-limit/backoff» (backoff не реализован), прошедшие даты в curl-примерах, CAPTCHA в описании `POST .../bookings`.

## Что осталось (следующие шаги)

**Открыто сейчас (2026-09-30):**

- [ ] **Продуктовый backlog (сверх курса)** — 4 пункта, порядок захода: **регистрация и аккаунты** (сейчас один заранее заданный владелец, разделения нет — нужен ADR по аутентификации) → **интеграции с внешними календарями** (сейчас только экспорт `.ics`/GCal) → **повторяющиеся события** → **аналитика по записям**. Детали и что уже сделано — `docs/todo.md`, «Backlog продукта». Перед каждым пунктом: issue → `interview` → ADR → `plan` → реализация.
- [ ] **Перепроверить SSL-режим `pg`** после выхода `pg` v9 (сейчас latest 8.23.0) — в v9 `sslmode=require` начнёт вести себя как в libpq. Сейчас режим нормализован в `server/env.ts` на `verify-full`, предупреждений в логах нет ([ADR-0013](docs/adr/0013-postgres-migration.md), разбор в `docs/todo.md`).
- [ ] **`esbuild` 0.18.20 в дереве dev-зависимостей** (moderate, `npm audit`) — тянется через `drizzle-kit`, в контейнер не попадает. Решение при обновлении `drizzle-kit`; зафиксировано в [ADR-0029](docs/adr/0029-audit-fastify-static-upgrade-deferred.md).

Открытых GitHub Issues нет. Ниже — закрытые пункты (история, чтобы не искать по Issues).

**Закрыто ранее:**

- [x] **#49 — мобильная вёрстка** (P1, bug): повторный аудит после v2 — 56 проверок (14 экранов × 2 ширины × 2 темы), 0 overflow/наложений после двух правок панели. Закрыт 2026-09-28.
- [x] **#46 — CAPTCHA** (enhancement): Cloudflare Turnstile + rate-limit по IP, [ADR-0025](docs/adr/0025-captcha-and-rate-limit.md).
- [x] **SSL-режим `pg`** (мелкое, закрыто 2026-09-28): `pg-connection-string@2.14.0` печатает предупреждение только из-за `sslmode=require`. Проверено живым соединением: `require`/`verify-full`/`prefer` дают **тот же** конфиг `ssl: {}`, а сервер TLS требует (без `sslmode` → `28000 connection is insecure`); `uselibpqcompat=true&require` отклонён (даёт `rejectUnauthorized: false`). **Ручная правка строки не нужна** — её формируют Neon/Render: режим нормализуется в `server/env.ts: normalizeSslMode` (меняется только значение параметра, без пересборки URL, чтобы не перекодировать пароль). 7 тестов — `server/env.test.ts`. Перепроверить после апгрейда `pg` до v9.
- [x] **Визуальная приёмка v2** (человек): пройдена 2026-09-28, расхождений нет.
- [x] **Email-уведомления** — Brevo HTTP API: гостю подтверждение/перенос/отмена/напоминание за 24 ч, организатору новая бронь/отмена, внешний cron-endpoint. [ADR-0026](docs/adr/0026-email-notifications.md), [#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83).
- [x] **Продуктовый backlog, первый пункт** — уведомления (email): ✅ 2026-09-29. Остальные три пункта — в списке «Открыто сейчас» выше.

- [x] **План курса (процессы)** — сохранён в [`docs/course-steps.md`](docs/course-steps.md): 4 шага — (1) главная страница — **✅ выполнено 2026-09-24** ([ADR-0010](docs/adr/0010-landing-and-booking-routes.md)); (2) проектирование бронирования (wayfinder → спека → тикеты, Design First) — **✅ выполнено 2026-09-24** (карта #10, `docs/spec.md`, `api/main.tsp`, `npm run api:generate`); (3) реализация тикетов через `implement` + Playwright — **✅ выполнено 2026-09-24** (T1–T9, #19–#27); (4) Docker/деплой — **✅ уже выполнено**. Все шаги курса закрыты. Подробные критерии приёмки — в том же файле (см. также [`docs/archive/gemini-code-1790192589378.md`](docs/archive/gemini-code-1790192589378.md) — внешний backlog (сверка закрыта)).
- [x] **Шаг 3 курса** ✅ завершён 2026-09-24: тикеты T1–T9 (#19–#27) закрыты, `docs/spec.md` сверена с реализацией и контрактом, `docs/course-steps.md` отмечает шаг выполненным. CI + hexlet-check на `main` — success (коммит `807d4e0`).
- [x] **Фаза 0 — гигиена/синхронизация (2026-09-24):** фикс UI-бага «Доступность», заметки в `docs/todo.md` (несколько интервалов — сделано), это обновление `MEMORY.md`.
- [x] Записать asciinema для README — ✅ **записано 2026-09-25**: публикация https://asciinema.org/a/mpuvYnckvG7iKlH4, каст в репозитории [`docs/demo.cast`](docs/demo.cast). На Windows asciinema не поддерживается → запись через [PowerSession](https://github.com/Watfaq/PowerSession-rs). По ходу исправлен баг `scripts/demo.sh`: кириллица в `curl -d` ломала `Content-Length` (`FST_ERR_CTP_INVALID_CONTENT_LENGTH`) — заменено на `--data-binary @-`.
- [x] **Фаза 1 — новые формы (2026-09-24):** причина отмены (`cancellation_reason` + модалка подтверждения, `bcd7f15`) и блокировка дат/часов (`time_blocks` + `BlocksEditor`/`BlockTimeModal`, [ADR-0014](docs/adr/0014-time-blocks.md)).
- [x] **Миграция на PostgreSQL/Neon (2026-09-24):** Drizzle `pg-core` + `pg` по `DATABASE_URL`, PGlite в тестах, async-сервер, zod-валидация env, Playwright в CI. [ADR-0013](docs/adr/0013-postgres-migration.md). Прод: Render + Neon (Environment Group `DB`).
- [x] **Фикс (2026-09-24):** счётчик «Встречи · N» в панели считал все брони, включая отменённые — теперь только активные (`075cad2`).
- [x] **Фаза 2 — P0 публичный флоу** ✅ **выполнено 2026-09-25** (пункты 56, 57): имя `min 2`, `notes` max 500, маска телефона, чекбокс согласия, `guests` (мульти-email), `Idempotency-Key`, спец-алерт 409, прямой «Отменить», публичная «Предстоящие события» (S5 из `docs/calendar_agent_spec.md`, табы в шапке) / `/booking/:uuid/confirmed`; поиск по IANA и формат 12/24 — пункт 58.
- [x] **Фаза 3 — P1 self-service/dashboard** ✅ **выполнено 2026-09-25** (пункты 59, 60): роуты `/booking/:uuid/{cancel,reschedule,confirmed}`, `/admin/{availability,event-types,bookings}`, табы Upcoming/Past/Canceled, поиск, пресеты horizon, «Скопировать пн на будни», `buffer_before/after`.
- [x] **Фаза 4 — Low/архитектура** ✅ **выполнено 2026-09-25**: авторизация `/dashboard` ([ADR-0017](docs/adr/0017-dashboard-basic-auth.md), пункт 60) и мульти-хост-модель ([ADR-0018](docs/adr/0018-multi-host-model.md), пункт 61) — `hostId` в `slots`/`bookings`, `/book/:uuid`.
- [x] **Остаток Low из [ADR-0018](docs/adr/0018-multi-host-model.md)** — ✅ **выполнено 2026-09-25**: per-host скаляры расписания ([ADR-0020](docs/adr/0020-per-host-availability-rules.md), [#41](https://github.com/frostiks777/ai-for-developers-project-386/issues/41)) и UI управления хостами + активный организатор на всём фронте ([ADR-0021](docs/adr/0021-active-host-and-hosts-ui.md), [#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)). Открытого бэклога нет.
- [x] **Ревью проверяющего, незначительные правки (2026-09-29, вечер):** из замечаний созданы issues [#88](https://github.com/frostiks777/ai-for-developers-project-386/issues/88)–[#93](https://github.com/frostiks777/ai-for-developers-project-386/issues/93).
  - [#90](https://github.com/frostiks777/ai-for-developers-project-386/issues/90) (CI на каждый push) — ✅ закрыто: убран фильтр `branches: [main]` у `push` в `.github/workflows/ci.yml`; `hexlet-check.yml` не тронут; CI на `main` — success.
  - [#93](https://github.com/frostiks777/ai-for-developers-project-386/issues/93) (привязка к issue) — ✅ закрыто: правило `##NN` зафиксировано в `AGENTS.md` и скилле `commit-push` (Issue → коммит с `(#NN)` → закрытие; chore-подобные — без метки типа); commitlint не внедряли (осознанно, без новой зависимости).
  - [#91](https://github.com/frostiks777/ai-for-developers-project-386/issues/91) (npm audit) — ✅ закрыто: `npm audit fix` (без `--force`) обновил транзитивный `@scalar/json-magic` → находки по `undici` ушли (7 → 5: 1 high, 4 moderate). Остались `@fastify/static` (high, фикс только мажорный 10.1.5) и `esbuild` через `drizzle-kit` (moderate, только dev-CLI, в проде не используется) — решение: не обновлять сейчас, обоснование в issue.
  - [#89](https://github.com/frostiks777/ai-for-developers-project-386/issues/89) — ✅ закрыто: сетка слотов 30 мин ([ADR-0027](docs/adr/0027-slot-grid-step-independent-of-buffers.md)). `stepMin = slotDurationMin` в `generateSlotStarts` и `generateSlotStartsFromRanges`; буферы перестали двигать сетку и применяются фильтром занятости — новая `conflictsWithBuffers` в `selectFutureSlots` и в `POST .../bookings` (`409`); дефолт `bufferAfterMin` 10 → 0; UI (`AvailabilityPreview`, «≈ N слотов») считает сетку по `slotDurationMin`. Горизонт 30 дней был значением в БД, а не кодом — снят настройкой в панели. Коммит `a86150b`.
  - [#88](https://github.com/frostiks777/ai-for-developers-project-386/issues/88) — ✅ закрыто: панель организатора без логина ([ADR-0028](docs/adr/0028-dashboard-access-without-login.md)). Удалены `requiresAdminAuth`, `isAuthorizedAdmin`, хук `onRequest` с Basic-auth; `ADMIN_PASSWORD` убрана из `server/env.ts`, `.env.example`, `render.yaml`, README, `scripts/demo.sh`. Тест `server/admin-auth.test.ts` → `server/dashboard-access.test.ts`. ADR-0017 помечен Superseded, п. 1 ADR-0022 заменён (список броней снова открыт — отмечено как последствие). Защищены: cron-endpoint по `X-Reminders-Secret`, Turnstile + rate-limit, capability-токены. Коммит `be47ce4`.
  - [#92](https://github.com/frostiks777/ai-for-developers-project-386/issues/92) — ✅ закрыто (по апруву владельца): три ранних коммита переписаны в Conventional Commits через `filter-branch --msg-filter` + `--force-with-lease` push в `main`; содержимое не менялось, новый HEAD `ba6756e`, CI/hexlet-check/Release Please — success.
  - [#97](https://github.com/frostiks777/ai-for-developers-project-386/issues/97) — ✅ закрыто: отменённые брони больше не закрепляют слоты вне сетки. `purgeUnpinnedFutureSlots` в `server/rules.ts` считает закреплённым только слот с `confirmed`-бронью (не-confirmed брони снимаются в одной транзакции — FK `NO ACTION`), `regenerateAllHostsSlots` вызывается при старте (`server/index.ts`), в `selectFutureSlots` (`server/app.ts`) добавлена верхняя граница горизонта. Тесты `server/slot-regeneration.test.ts` (3). Прод вычищен регенерацией приложения после деплоя (сырым SQL — нет: удалил бы сло­ты без пересоздания); проверено на живой Neon — свободных слотов вне сетки 0. Коммиты `4a75322`, `2f6a580`, `98b2895`.
  - [#99](https://github.com/frostiks777/ai-for-developers-project-386/issues/99) — ✅ закрыто: апгрейд `@fastify/static` 8.3.0 → 10.1.5, `high`-находка `npm audit` (path traversal) ушла. Кода приложения менять не пришлось (единственное ломающее v10 — `setHeaders`, не используется), e2e 3/3, раздача `dist/` совпала с baseline, бандл побайтово тот же. Добавлен `server/static.test.ts` (5 тестов, `skipIf` без сборки); в `.github/workflows/ci.yml` шаг `Build` перенесён перед `Test`, чтобы smoke-тест раздачи выполнялся в CI. [ADR-0029](docs/adr/0029-audit-fastify-static-upgrade-deferred.md) обновлён.

## Ключевые решения

> Таблица содержит историю решений. Строки, помеченные «(история)», описывают состояние до [ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md)/[ADR-0013](docs/adr/0013-postgres-migration.md) и заменены более поздними решениями ниже.

| Решение | Выбор | Причина |
|---|---|---|
| Бэкенд | Fastify 5 | Современный, быстрый, встроенная валидация |
| ORM | Drizzle ORM | TypeScript-first, SQL-подобный, лёгкий |
| ~~БД (история)~~ | ~~SQLite (better-sqlite3)~~ → **заменено**: PostgreSQL (Neon) + PGlite | товарная БД в облаке, тот же диалект в тестах ([ADR-0013](docs/adr/0013-postgres-migration.md)) |
| UI | shadcn/ui + Tailwind v3.4 | Хорошая поддержка coding-агентами |
| Тесты | Vitest 4 + React Testing Library | Нативная интеграция с Vite 6; пул без tinypool — фикс `Channel closed` |
| CI | GitHub Actions: lint + typecheck + test + build + job `e2e` на Node 22 и 24 | Node 20 EOL (апрель 2026); vitest 4 требует Node ^20 \|\| ^22 \|\| >=24 |
| `GET /api/bookings` | Плоский массив `BookingWithSlot`, сортировка по `startAt` | Потребитель — `/dashboard` (`BookingsTable`); контракт простой |
| Защита от двойных броней | Частичный уникальный индекс `UNIQUE(slotId) WHERE status != 'cancelled'` + `409` из перехвата `23505` | [ADR-0003](docs/adr/0003-unique-slot-booking.md), [ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md) |
| Фильтр слотов по дате | Клиентский (группировка по локальной дате в календаре) | Серверный `?date=` не нужен, пока слотов ≤ ~112 (14 дней) |
| Генерация слотов | Правила-константы в `server/availability.ts`, материализация в `slots` при старте, **в поясе хоста** | [ADR-0004](docs/adr/0004-slot-generation-rules.md), [ADR-0024](docs/adr/0024-slots-in-host-timezone.md) |
| Таймзоны | Хранение — UTC ISO; отображение и группировка по дням — на клиенте в выбранном поясе (`Intl`, без зависимостей) | Селектор в UI, browser TZ по умолчанию; слоты при этом считаются в часовом поясе хоста |
| Телефон опционален | nullable-колонка | По спеке телефон необязателен |
| Панель организатора (история) | `/dashboard` + `react-router-dom`: список броней, отмена, настройки доступности, **без auth** | [ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md); позже закрыта Basic-auth ([ADR-0017](docs/adr/0017-dashboard-basic-auth.md)) |
| Правила доступности (история) | Таблица `availability_rules` — одна строка `id=1` | [ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md); позже одна строка на `hostId` ([ADR-0020](docs/adr/0020-per-host-availability-rules.md)) |
| Отмена брони (история) | `DELETE /api/bookings/:id` удаляет строку | Несовместимо с soft-delete из-за `UNIQUE(slotId)`; в v1 отмена переводит `status` в `cancelled` ([ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md)) |
| Отмена гостем | Токен `cancelToken` (UUID, `UNIQUE`) в ответе на создание + `POST /api/bookings/cancel`; ссылка `/cancel/:token` | [ADR-0006](docs/adr/0006-cancellation-by-token.md); capability-модель без auth |
| Перенос гостем | `POST /api/bookings/reschedule` — `UPDATE bookings.slotId` по токену; старый слот свободен | [ADR-0007](docs/adr/0008-reschedule-by-token.md); переиспользует `UNIQUE(slotId)` и токен |
| Порт бэкенда | 3000 | Vite proxy `/api` → `:3000` |
| Порт фронтенда | 5173 (default Vite) | — |
| Долгосрочная память решений | ADR в [`docs/adr/`](docs/adr/README.md) ([ADR-0001](docs/adr/0001-record-architecture-decisions.md)) | Nygard-шаблон; решения переживают `/compact` и смены сессий |
| БД | PostgreSQL (Neon) через `pg`, тесты — PGlite | [ADR-0013](docs/adr/0013-postgres-migration.md); товарная БД в облаке, тот же диалект в тестах |
| Блокировка времени | `time_blocks` (интервалы UTC), фильтрация слотов на чтении | [ADR-0014](docs/adr/0014-time-blocks.md); слоты не удаляются, блокировку можно снять |
| Причина отмены | `bookings.cancellationReason` + модалка на `/cancel/:token` | ТЗ §2.1; `POST /api/v1/bookings/:id/cancel` принимает `{reason}` |
| Процессные скиллы (локальные) | [.agents/skills/](.agents/skills/) — `commit-push`, `interview`, `plan`, `ponytail`, `tdd`, `verify` | Повторно используемые workflow через `skill` tool по триггер-фразам |
| Процессные скиллы (плагин) | [obra/superpowers](https://github.com/obra/superpowers) через `opencode.jsonc` → `plugins` (V2 git-spec) | Дополнительные 14 скилов: `brainstorming`, `systematic-debugging`, `test-driven-development`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`, `using-git-worktrees`, `verification-before-completion`, `using-superpowers`, `diagnosing-superpowers`. Приоритет V2: проектные → персональные → superpowers (локальные `ponytail` и др. не страдают). |
| MCP для UI | [`shadcn mcp`](docs/mcp.md) через `opencode.jsonc` → `mcp.shadcn` | Пакет `shadcn` (не `@shadcn/ui/mcp`); доступ к каталогу компонентов через `components.json` |
| Деплой | Render.com (Docker, Free) | Бесплатно без карты; план GCP ([`docs/archive/ci_cd.md`](docs/archive/ci_cd.md)) не используется |
| Фронт в проде | `@fastify/static` раздаёт `dist/` из Fastify | Один контейнер, same-origin `/api` без CORS |
| Порт в проде | `process.env.PORT` (fallback 3000) | Требование Render; хост `0.0.0.0` |
| Валидация API | zod 4 (схема-зеркало: `server/validation.ts` ↔ `src/lib/validation.ts`) | См. [ADR-0002](docs/adr/0002-zod-api-validation.md); единые сообщения об ошибках фронт/бэк |
| Архитектура сервера | Фабрика `buildApp()` в `server/app.ts`, `server/index.ts` — только listen | Тесты через `app.inject()` без реального порта |
| БД в тестах | `DATABASE_URL=''` (`vite.config.ts` → `test.env`) → PGlite в памяти | Изоляция тестов от боевой БД; тот же диалект, что в проде ([ADR-0013](docs/adr/0013-postgres-migration.md)) |
| Upstream-скилы | Копия upstream-репо в `.agents/skills/<name>/`, имена = frontmatter `name:`, deep-рекурсия (`references/`, `scripts/`) | Доступны всем агентам в проекте (не только opencode); не зависят от локального кеша персональных скилов и плагинов |
| Хосты + API v1 | Аддитивный слой: таблица `hosts` (UUID PK, unique slug), `/api/v1/hosts/:slug/settings|slots`; `/api/*` не тронут | [ADR-0009](docs/adr/0009-hosts-and-api-v1.md); основа мульти-хоста без ломающей миграции |
| Скиллы Matt Pocock | Набор `mattpocock/skills` в `.agents/skills/` + `skills-lock.json`; конфиг трекера/меток/домена в `docs/agents/` | Требование шага курса: GitHub Issues, дефолтные метки, single-context (`CONTEXT.md` + `docs/adr/`) |
| Раскладки редизайна | Десктоп A / телефон D выбираются хуком `useMediaQuery('(min-width: 1024px)')`, а не скрытием через CSS | В DOM нет дублей календаря — не ломаются тесты и доступность ([ADR-0007](docs/adr/0007-visual-redesign-and-themes.md)) |
| Светлая/тёмная тема | `ThemeProvider` + `localStorage` (`call-calendar-theme`, режим `system` по умолчанию) + inline-анти-флеш-скрипт в `index.html`; `sonner` берёт `resolvedTheme` | Токены shadcn (HSL) для обеих тем, без «белых вспышек» при первой загрузке ([ADR-0007](docs/adr/0007-visual-redesign-and-themes.md)) |
| Маршруты главная/бронь | `/` — лендинг (`LandingPage`), `/book/:slug` — бронь (`HomePage`), `*` — 404; slug из `src/config/host.ts`; бронь на API v1 | Требование Шага 1 + спека `/book/:slug`; Hexlet-автопроверка `/` отвечает 200 ([ADR-0010](docs/adr/0010-landing-and-booking-routes.md)) |
| Контракт API (Шаг 2) | TypeSpec `api/main.tsp` → OpenAPI → клиентский SDK + серверные типы; источник истины — `.tsp`, сгенерированное не правится | Design First (Шаг 2); серверный эмиттер TypeSpec alpha без Fastify/zod → серверные маршруты/валидация ручные ([#13](https://github.com/frostiks777/ai-for-developers-project-386/issues/13), [#15](https://github.com/frostiks777/ai-for-developers-project-386/issues/15)) |
| Генерация артефактов | `npm run api:generate` → `docs/openapi/openapi.yaml`, `src/api/generated/`, `server/generated/api-types.ts` (`openapi-typescript`); сгенерированное коммитится | Одной командой, детерминированно; CI/hexlet-check не запускают `tsp` ([#17](https://github.com/frostiks777/ai-for-developers-project-386/issues/17)) |
| Модель данных v1 | Материализованные `slots` остаются; `event_types`; `bookings.eventTypeId` + `status` + `startAt`/`endAt`; `availability_ranges`; partial unique `UNIQUE(slotId) WHERE status != 'cancelled'`; миграции — `server/db/migrate.ts` | Отклонение от ТЗ §5 (нет `slots`) обосновано: SQLite без exclusion constraint ([ADR-0003](docs/adr/0003-unique-slot-booking.md), [ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md), [#12](https://github.com/frostiks777/ai-for-developers-project-386/issues/12)) |
| Отмена брони (Шаг 2) | Смена `status` на `cancelled` вместо удаления строки; занятость считается только для `confirmed` | ТЗ требует `status` и историю ([ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md)); в коде — переход на Шаге 3 |
| Тестирование v1 | API (`app.inject` + in-memory) + RTL/jsdOM + e2e Playwright (`npm run test:e2e`, отдельный гейт); контракт-тесты — валидация ключевых ответов по OpenAPI; миграции на `:memory:` | Требование курса: сценарий и конфликт покрыты; правила на сервере ([#14](https://github.com/frostiks777/ai-for-developers-project-386/issues/14)) |
| Контракт-тесты и e2e | `server/contract.test.ts` (`ajv` по `docs/openapi/openapi.yaml`); Playwright против собранного приложения (`PORT=3100`, PGlite), `npm run test:e2e` вне `npm test`, но отдельным job `e2e` в CI | [ADR-0012](docs/adr/0012-contract-tests-and-e2e.md); Design First — сервер приведён к контракту (Booking.timeZone, HostSettings, nullable) |
| Модель времени и ошибок (T9) | Время — UTC ISO (`UtcDateTime`, `@format date-time`); ошибки — конверт `{ error: ApiError }`; `timeZone` — только для отображения UI | Сверка со спецификацией ([#27](https://github.com/frostiks777/ai-for-developers-project-386/issues/27)); контракт приведён к фактическим ответам вместо переписывания сервера под local-time |
| Доступ к панели (история) | ~~HTTP Basic Auth на `/dashboard`, `/admin/*` и админские мутации API (`ADMIN_PASSWORD`)~~ → **заменено**: панель и админские API **открыты без логина**, `ADMIN_PASSWORD` удалена из env/Blueprint/README | [ADR-0017](docs/adr/0017-dashboard-basic-auth.md) помечен Superseded; текущее решение — [ADR-0028](docs/adr/0028-dashboard-access-without-login.md): владелец один и заранее задан, авторизация по условиям курса не нужна. Остались защищёнными: cron-endpoint по `X-Reminders-Secret`, Turnstile + rate-limit, capability-токены |
| Сетка слотов | Шаг сетки — только `slotDurationMin` (получасовой при 30-мин слоте); буферы **не двигают сетку**, а отсекают конфликтные слоты (`conflictsWithBuffers` в выдаче и в `POST .../bookings`); дефолт `bufferAfterMin` = 0 | [ADR-0027](docs/adr/0027-slot-grid-step-independent-of-buffers.md); спека `docs/spec.md` — «шаг 30 минут, буферы не должны незаметно менять обязательный шаг сетки» |
| Мульти-хост | `slots`/`bookings` привязаны к `hostId`; `findHost` по slug или UUID; `GET/POST /api/v1/hosts`; `/book/:uuid` | [ADR-0018](docs/adr/0018-multi-host-model.md); изоляция расписаний без ломки slug-флоу; скаляры расписания per-host ([ADR-0020](docs/adr/0020-per-host-availability-rules.md)) |
| Per-host скаляры расписания | `availability_rules` — одна строка на `hostId` (UNIQUE, украли `id`); `load/saveAvailabilityRules(hostId)`; миграция бэкфиллит дефолтный хост | [ADR-0020](docs/adr/0020-per-host-availability-rules.md); изоляция `minNotice`/горизонтов/буферов по организаторам |
| Активный организатор | `HostProvider` + `useActiveHost`; `activeSlug` в `localStorage` (`call-calendar-active-host`), фолбэк — первый хост; весь фронт на активном хосте; `GET /api/v1/hosts` публичный, `POST` — Basic-auth | [ADR-0021](docs/adr/0021-active-host-and-hosts-ui.md); UI управления хостами (селектор + секция «Организаторы» + `/admin/hosts`) |
| Отмена без ссылки | «Мои встречи» на устройстве: бронь в `localStorage`, страница `/my` с отменой/переносом | [ADR-0019](docs/adr/0019-my-bookings-on-device.md); capability-токен не утекает, нет перечисления по email; ограничение — только тот же браузер |
| Защита публичной записи | Cloudflare Turnstile (Free), **включается фактом `TURNSTILE_SECRET_KEY`**; `server/captcha.ts` fail-closed; проверка в `POST .../bookings` после zod и **после** реплея по `Idempotency-Key`; site key отдаёт `GET /hosts/:slug/settings` (`captcha: CaptchaSettings`); rate-limit `@fastify/rate-limit` in-memory (20/мин запись, 300/мин чтения), ключ — `CF-Connecting-IP` → `request.ip` | [ADR-0025](docs/adr/0025-captcha-and-rate-limit.md); [#46](https://github.com/frostiks777/ai-for-developers-project-386/issues/46); dev/CI/e2e не зависят от внешнего сервиса; `trustProxy: true` обязателен, иначе IP у всех одинаковый и лимит глобальный |
| Email-уведомления | **Brevo HTTP API** (free 300/день, без своего домена), включается фактом `EMAIL_API_KEY`; `server/email.ts` + `email-templates.ts` + `notifications.ts`; напоминания — идемпотентная ленивая проверка (`bookings.reminderSentAt`) + внешний cron `POST /api/internal/reminders` под `X-Reminders-Secret` | [ADR-0026](docs/adr/0026-email-notifications.md); [#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83); SMTP на Render Free заблокирован, Render Cron платный, домена нет; без ключа — no-op (тесты/CI/e2e без сети) |
| Документация | Выполненные планы и снятые документы → `docs/archive/` с `README`-каноном; в `docs/` живут только актуальные документы и незакрытые планы; история — в git | [#100](https://github.com/frostiks777/ai-for-developers-project-386/issues/100); в `docs/` копились планы с выполненными, но незачёркнутыми чек-листами (`ai-tuning-plan.md`, инструкция по «Доступности», внешний бэклог Gemini) — агент и наставник читали их как актуальные |


## Окружение

- **ОС**: Windows 10 (win32)
- **Node.js**: v26.9.0 (CI-матрица — 22/24; v26 используется только локально)
- **npm**: 11.19.1
- **Зависимости БД**: `pg` (чистый JS, без нативной сборки) и `@electric-sql/pglite` — нативных модулей в проекте больше нет, `better-sqlite3` из зависимостей удалён (2026-09-24, ADR-0013)
