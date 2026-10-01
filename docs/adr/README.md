# ADR (Architecture Decision Records)

Индекс архитектурных решений проекта «Календарь звонков».

## Когда писать ADR

- Выбор между ≥ 2 серьёзными альтернативами (библиотека, ORM, паттерн, БД, провайдер).
- Решение, которое нельзя легко отменить без миграции (`schema change`, `breaking API`).
- Любое отклонение от спеки (`docs/code_artifact.md`), даже если временное.

## Когда НЕ писать ADR

- Однострочный конфиг.
- Баг-фикс без архитектурного значения.
- Косметические правки (renaming, formatting).

## Процесс

1. Скопировать [`template.md`](template.md) → `NNNN-<slug>.md`, где `NNNN` — следующий номер по индексу.
2. Заполнить секции шаблона. Особое внимание:
   - **Status** — `Proposed` / `Accepted` / `Deprecated` / `Superseded`.
   - **Consequences** — положительные и отрицательные последствия (без приукрашивания).
3. Обновить индекс ниже: добавить строку с номером, заголовком и статусом.
4. Закоммитить отдельным коммитом: `docs: add ADR-NNNN <slug>`.

## Связанные артефакты

- `AGENTS.md` → раздел `## Long-term memory` описывает роль ADR в работе агента.
- `MEMORY.md` → раздел «Ключевые решения» ссылается на принятые ADR.
- `docs/code_artifact.md` → ТЗ проекта; отклонения от него фиксируются отдельным ADR.

## Индекс

| # | Заголовок | Статус | Дата |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-09-22 |
| [0002](0002-zod-api-validation.md) | Валидация API-контракта через zod | Accepted | 2026-09-22 |
| [0003](0003-unique-slot-booking.md) | UNIQUE-индекс на `bookings.slotId` вместо exclusion constraint | Accepted | 2026-09-23 |
| [0004](0004-slot-generation-rules.md) | Генерация слотов по правилам доступности | Accepted (частично заменён 0005) | 2026-09-23 |
| [0005](0005-dashboard-availability-and-cancellation.md) | Панель организатора: персистентные правила и отмена брони | Accepted | 2026-09-23 |
| [0006](0006-cancellation-by-token.md) | Отмена брони по токену-ссылке | Accepted | 2026-09-23 |
| [0007](0007-visual-redesign-and-themes.md) | Визуальный редизайн (A + D) и светлая/тёмная тема | Accepted | 2026-09-23 |
| [0008](0008-reschedule-by-token.md) | Перенос брони по токену-ссылке | Accepted | 2026-09-23 |
| [0009](0009-hosts-and-api-v1.md) | Хосты и версионированный API v1 | Accepted | 2026-09-23 |
| [0010](0010-landing-and-booking-routes.md) | Главная страница (лендинг) и маршрут бронирования `/book/:slug` | Accepted | 2026-09-24 |
| [0011](0011-event-types-status-and-availability-ranges.md) | Типы встреч, статусы брони и диапазоны доступности | Accepted | 2026-09-24 |
| [0012](0012-contract-tests-and-e2e.md) | Контракт-тесты (ajv) и e2e Playwright как отдельный гейт | Accepted | 2026-09-24 |
| [0013](0013-postgres-migration.md) | Миграция БД с SQLite на PostgreSQL (Neon) | Accepted | 2026-09-24 |
| [0014](0014-time-blocks.md) | Ручные блокировки времени (`time_blocks`) | Accepted | 2026-09-24 |
| [0015](0015-booking-guests-consent-idempotency.md) | Гости, согласие ПДн и идемпотентность брони | Accepted | 2026-09-25 |
| [0016](0016-split-buffers.md) | Раздельные буферы до и после встречи | Accepted | 2026-09-25 |
| [0017](0017-dashboard-basic-auth.md) | Парольный доступ (Basic Auth) к панели организатора | Superseded (ADR-0028) | 2026-09-25 |
| [0018](0018-multi-host-model.md) | Мульти-хост-модель (`hostId` в slots/bookings, CRUD хостов) | Accepted | 2026-09-25 |
| [0019](0019-my-bookings-on-device.md) | «Мои встречи» на устройстве (localStorage) | Accepted | 2026-09-25 |
| [0020](0020-per-host-availability-rules.md) | Per-host скаляры расписания (`availability_rules` по `hostId`) | Accepted | 2026-09-25 |
| [0021](0021-active-host-and-hosts-ui.md) | Активный организатор на клиенте и UI управления хостами | Accepted | 2026-09-25 |
| [0022](0022-private-bookings-list.md) | Список броней доступен только организатору | Accepted | 2026-09-28 |
| [0023](0023-redesign-v2-mint.md) | Редизайн v2 — «Мята и солнце», запись без автовыбора | Accepted | 2026-09-28 |
| [0024](0024-slots-in-host-timezone.md) | Слоты генерируются в поясе организатора | Accepted | 2026-09-28 |
| [0025](0025-captcha-and-rate-limit.md) | Защита публичной записи: Cloudflare Turnstile и rate-limit по IP | Accepted | 2026-09-28 |
| [0026](0026-email-notifications.md) | Email-уведомления (Brevo HTTP API, ленивые напоминания) | Accepted | 2026-09-29 |
| [0027](0027-slot-grid-step-independent-of-buffers.md) | Шаг сетки слотов не зависит от буферов; буферы — фильтр занятости | Accepted | 2026-09-29 |
| [0028](0028-dashboard-access-without-login.md) | Доступ к панели организатора без логина | Accepted | 2026-09-29 |
| [0029](0029-audit-fastify-static-upgrade-deferred.md) | Аудит зависимостей и апгрейд `@fastify/static` 8.3.0 → 10.1.5 | Accepted | 2026-09-29 |
