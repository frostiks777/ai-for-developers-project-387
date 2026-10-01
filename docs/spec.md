# Спецификация приложения «Календарь звонков» (v1)

> **Снимок Шага 2 курса (2026-09-24), заморожен.** Документ фиксирует согласованный на Шаге 2 объём v1. Реализация ушла вперёд: мульти-хост, панель без логина ([ADR-0028](adr/0028-dashboard-access-without-login.md)), блокировки дат, раздельные буферы, PostgreSQL/Neon, согласие и гости, CAPTCHA + rate-limit, email-уведомления, `/my` и редизайн v2 реализованы позже — см. `docs/adr/` и `docs/todo.md`. Расхождения ниже помечены как «на момент Шага 2».
>
> Источник истины по поведению. Термины — в [`CONTEXT.md`](../CONTEXT.md), архитектурные решения — в [`docs/adr/`](adr/), контракт — [`api/main.tsp`](../api/main.tsp) (он обновляется по мере изменений), исходное ТЗ — [`docs/code_artifact.md`](code_artifact.md).
> Утверждено в тикет-карте #10 (тикеты #11, #12, #14, #15, #16, #17, #18).

## 1. Цель и рамки

Сервис бронирования звонков: организатор публикует ссылку, гость выбирает **тип встречи** и свободный слот, оставляет контакты и получает подтверждение. Регистрации и полноценной авторизации нет.

**В рамках v1:** типы встреч, генерация слотов, бронирование, конфликт слотов, отмена/перенос, страница владельца, контракт TypeSpec → OpenAPI → SDK + серверные типы.
**Вне рамок (на момент Шага 2; часть реализована позже — см. ADR-0013…0028):** мульти-хост ✅ реализовано, авторизация панели ✅ не нужна — панель открыта без логина (ADR-0028), email/напоминания ✅ (ADR-0026), блокировка дат ✅ (ADR-0014), Telegram ✗, многодневные интервалы ✗, раздельные буферы ✅ (ADR-0016, ADR-0027), аналитика ✗.

## 2. Роли

- **Организатор** (владелец) — настраивает доступность и типы встреч, видит предстоящие встречи, отменяет их.
- **Гость** — открывает публичную страницу по ссылке, выбирает тип и слот, бронирует, отменяет/переносит по ссылке.

## 3. User stories

**Организатор:**
1. Настроить доступность (рабочие дни, диапазоны времени, длительность слота, буфер, минимальный запас, горизонт).
2. Создавать типы встреч, включать/выключать и удалять их.
3. Видеть предстоящие встречи всех типов одним списком.
4. Отменять встречу.

**Гость:**
1. Открыть публичную страницу по ссылке.
2. Увидеть доступные типы встреч и выбрать один.
3. Выбрать свободный слот в пределах горизонта (по умолчанию 14 дней).
4. Оставить контакты и забронировать.
5. Получить подтверждение и ссылки (календарь / перенос / отмена).
6. Отменить или перенести встречу по ссылке.

## 4. Функциональные правила

- **Тип встречи** задаёт `durationMin`, `locationType`, признак активности. Гость выбирает активный тип; его `durationMin` определяет длительность встречи, а шаг сетки слотов — `slotDurationMin` (в MVP 30 мин). Отдельная сетка под 15/45/60 мин — бэклог.
- **Слоты** генерируются из правил доступности: диапазоны по дням недели, шаг `slotDurationMin`, с учётом `minNoticeMin`, `horizonDays`. Позже: буферы разделены на `bufferBeforeMin`/`bufferAfterMin` (ADR-0016), слоты генерируются в часовом поясе хоста (ADR-0024).
- **Окно записи** — по умолчанию 14 дней; слоты по 30 минут.
- **Конфликт:** на одно время — не более одной активной брони, **в том числе для разных типов**. Занятый слот не предлагается как свободный; повторная запись отклоняется с понятным сообщением.
- **Правила бронирования выполняются на сервере** — UI-проверки не считаются защитой.
- **Отмена** переводит бронь в статус `cancelled` (не удаляет); слот снова свободен. **Перенос** меняет слот брони.
- **Доступность:** `availability_rules` (одна строка на хоста) + `availability_ranges` (диапазоны по дням недели). Правила хранятся per-host с `UNIQUE(hostId)` ([ADR-0020](adr/0020-per-host-availability-rules.md)).

## 5. Доменная модель (PostgreSQL / Drizzle)

> На момент Шага 2 предполагался SQLite; фактически — PostgreSQL (Neon) + PGlite в тестах ([ADR-0013](adr/0013-postgres-migration.md)). Ниже — состав таблиц и колонок; он актуален.

| Таблица | Ключевые поля | Примечание |
|---|---|---|
| `hosts` | `id`, `slug` (unique), `name`, `timezone`, `createdAt` | мульти-хост ([ADR-0018](adr/0018-multi-host-model.md)) |
| `availability_rules` | `hostId` (UNIQUE), `weekdays` (JSON), `windowStartHour`, `windowEndHour`, `slotDurationMin`, `bufferBeforeMin`, `bufferAfterMin`, `minNoticeMin`, `horizonDays` | параметры генерации слотов; `UNIQUE(hostId)` ([ADR-0020](adr/0020-per-host-availability-rules.md)) |
| `availability_ranges` | `hostId`, `weekday` (1–7), `startMinute`, `endMinute` | несколько интервалов на день (ADR-0011) |
| `event_types` | `id`, `hostId`, `slug`, `title`, `description`, `durationMin`, `locationType`, `isActive`, `createdAt` | unique `(hostId, slug)`; сеется дефолтный тип |
| `slots` | `id`, `hostId`, `startAt` (UTC ISO), `durationMin` | материализованные слоты (ADR-0003/0004) |
| `bookings` | `id`, `hostId`, `slotId`, `eventTypeId`, `name`, `email`, `phone`, `comment`, `guests`, `consentAccepted`, `idempotencyKey`, `cancellationReason`, `status`, `startAt`, `endAt`, `cancelToken`, `createdAt` | `startAt`/`endAt` — снимок времени; `guests`/`consentAccepted`/`idempotencyKey` — [ADR-0015](adr/0015-booking-guests-consent-idempotency.md) |
| `time_blocks` | `id`, `hostId`, `startAt`, `endAt`, `reason` | блокировки времени ([ADR-0014](adr/0014-time-blocks.md)) |

- `bookings.status` — `confirmed` | `cancelled`; уникальность: partial unique index `UNIQUE(slotId) WHERE status != 'cancelled'` (вместо прежнего `UNIQUE(slotId)`).
- Миграции — идемпотентный модуль `server/db/migrate.ts`, выполняется при старте; тесты и e2e — на PGlite в памяти (`DATABASE_URL` пустой).
- Модель ТЗ без `slots` (overlap-проверка) отклонена: exclusion constraint в PostgreSQL потребовал бы `btree_gist`; вместо него частичный уникальный индекс (см. тикет #12, [ADR-0003](adr/0003-unique-slot-booking.md)).


## 6. API-контракт

Источник — `api/main.tsp`; OpenAPI — `docs/openapi/openapi.yaml`; клиентский SDK — `src/api/generated/`; серверные типы — `server/generated/api-types.ts`. Генерация одной командой:

```bash
npm run api:generate
```

Все пути — под `/api/v1`. Легаси `/api/*` вне контракта.

| Метод и путь | Назначение |
|---|---|
| `GET /hosts/{slug}/settings` | публичные настройки организатора |
| `GET /hosts/{slug}/event-types` | список типов встреч |
| `POST /hosts/{slug}/event-types` | создать тип |
| `PATCH /hosts/{slug}/event-types/{eventTypeId}` | изменить тип |
| `DELETE /hosts/{slug}/event-types/{eventTypeId}` | удалить тип |
| `GET /hosts/{slug}/availability` | правила доступности |
| `PUT /hosts/{slug}/availability` | обновить правила |
| `GET /hosts/{slug}/slots?date=&eventTypeId=` | слоты на дату → `{ date, timeZone, slots[] }` |
| `GET /hosts/{slug}/bookings` | все брони хоста (владелец); UI фильтрует активные/предстоящие |
| `POST /hosts/{slug}/bookings` | создать бронь (гость) |
| `GET /bookings/{bookingId}` | бронь по UUID |
| `POST /bookings/{bookingId}/cancel` | отменить |
| `POST /bookings/{bookingId}/reschedule` | перенести |

- **Идентификаторы:** `bookingId` — публичный UUID (он же в ссылках отмены/переноса).
- **Ошибки:** конверт `{ error: ApiError }`, где `ApiError { code, message, details? }`; коды `VALIDATION_ERROR`, `NOT_FOUND`, `SLOT_TAKEN`, `CONFLICT`.
- **Время:** хранится и передаётся как **UTC ISO 8601** (`...Z`, скаляр `UtcDateTime`); поле `timeZone` (IANA) — для отображения; даты — `LocalDate`.
- Сгенерированные файлы коммитятся и **вручную не правятся**.

## 7. Тестирование

- **API-интеграционные** — `app.inject()` + in-memory БД.
- **UI** — React Testing Library + jsdom.
- **E2E Playwright** — обязателен, отдельный гейт `npm run test:e2e` (не в `npm test`); сквозной сценарий гостя и конфликт слотов.
- **Контрактные** — маршруты `/api/v1/*` существуют; ключевые ответы (слоты, бронь) валидны по OpenAPI.
- **Обязательные кейсы:** повторная бронь занятого слота; отмена освобождает слот; разные типы не занимают один слот дважды; `minNotice`/`horizon` отсекают слоты.
- **Миграции** — отдельный тест на `:memory:` (таблицы, backfill, partial unique index).
- Порог покрытия в vitest не вводится; SDK не тестируется (только `typecheck`/сборка).

## 8. Соответствие критериям приёмки курса

| Требование | Как закрыто |
|---|---|
| Сквозной сценарий записи | `GET event-types → GET slots → POST bookings` + UI |
| Занятый слот не бронируется (в т.ч. другой тип) | partial unique index + серверная проверка, кейс `SLOT_TAKEN` |
| Правила на сервере | валидация и проверка конфликта в `server/` |
| Страница владельца | `GET /hosts/{slug}/bookings`, UI-список |
| API по контракту | `api/main.tsp` → OpenAPI → SDK + `server/generated/api-types.ts` |
| OpenAPI из TypeSpec, генерация одной командой | `npm run api:generate` |
| Клиентский SDK и серверные артефакты | `src/api/generated/`, `server/generated/api-types.ts` |
| Окно 14 дней, слоты 30 минут | `availability_rules`, генерация слотов |
| Тесты и линтер в CI зелёные | `npm run lint/typecheck/test/build` |
| Тесты сценария и конфликта | API + RTL + Playwright |
| Conventional Commits, release-please | коммиты `feat/fix/docs/chore` |
| Карта, спецификация, тикеты в Issues | #10 + #11–#18 (проектирование) + #19–#27 (реализация) + эта спека |

## 9. Закрытые вопросы (Шаг 3)

- **Сетка слотов под длительность типа.** Слоты генерируются с шагом `slotDurationMin` (MVP 30 мин); длительность встречи берётся из выбранного типа. Отдельная сетка под 15/45/60 мин — бэклог.
- **`status` в UI.** Дашборд показывает только `confirmed`; отменённые скрыты. Отмена/перенос — через `/api/v1` ([ADR-0011](adr/0011-event-types-status-and-availability-ranges.md)).
- **Миграция на SDK.** Выполнена ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25), [ADR-0012](adr/0012-contract-tests-and-e2e.md)): ручной `src/api/client.ts` удалён.
- **Совместимость легаси `/api/*`.** Легаси-маршруты сохранены как есть; v1 — источник истины. Старые БД приводятся миграцией (`server/db/migrate.ts`, backfill `eventTypeId`/`status`).
- **Состав e2e.** Сквозной сценарий гостя + конфликт слотов (в т.ч. другой тип) — `e2e/guest-booking.spec.ts`.

## 10. Ссылки

- Тикет-карта: [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) и дочерние #11–#18.
- Контракт: `api/main.tsp`, `docs/openapi/openapi.yaml`.
- Словарь: `CONTEXT.md`. ADR: `docs/adr/README.md`.
- Research: `docs/research/typespec-toolchain.md`.
