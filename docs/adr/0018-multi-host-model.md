# ADR 0018: Мульти-хост-модель (host_id в slots/bookings)

## Status

Accepted — 2026-09-25.

## Context

[ADR-0009](0009-hosts-and-api-v1.md) ввёл таблицу `hosts` и `/api/v1`, но оставил `slots`/`bookings` глобальными: мульти-хост был «однохостовым по факту», `POST /api/v1/bookings` отложен. Спека (`docs/code_artifact.md`) предполагает несколько организаторов с изоляцией расписаний и броней.

К этому моменту `event_types`, `availability_ranges`, `time_blocks` уже привязаны к `hostId`; осталось привязать слоты и брони, дать CRUD хостов и публичный URL по UUID, не сломав существующий однохостовый флоу и панель.

## Decision

1. **Схема.** `slots.hostId` и `bookings.hostId` (`TEXT NOT NULL REFERENCES hosts(id)`), индексы `slots_hostId_idx`, `bookings_hostId_idx`. Миграция аддитивная ([`server/db/migrate.ts`](../../server/db/migrate.ts)): `ADD COLUMN IF NOT EXISTS` → бэкфилл на дефолтный хост (`bookings` — из `event_types.hostId`) → `SET NOT NULL`. Fresh-БД создаёт колонки сразу.
2. **Генерация слотов** — per-host: `selectFutureSlots(hostId)`, `regenerateFutureSlots(hostId, …)`, `regenerateFutureSlotsForSettings(hostId, …)`, сид при старте — для дефолтного хоста.
3. **Резолвинг хоста.** `findHost(ref)` ищет по `slug` **или** `id` (UUID). Все `/api/v1/hosts/:slug/*` фактически принимают и slug, и UUID — это сохраняет обратную совместимость однохостового флоу и даёт публичные ссылки `/book/:hostId` (UUID).
4. **CRUD хостов.** `GET /api/v1/hosts` (список) и `POST /api/v1/hosts` (`slug`, `name`, `timezone?`), оба под Basic-auth ([ADR-0017](0017-dashboard-basic-auth.md)); `409` на дубликат slug, `422` на неверный пояс/поля.
5. **Брони.** `POST /api/v1/hosts/:ref/bookings` создаёт бронь с `hostId`; `GET /api/v1/hosts/:ref/bookings` и `GET /api/v1/hosts/:ref/slots` скоупятся по хосту. Публичные `GET /api/v1/bookings/:id`, cancel/reschedule по публичному id работают как раньше (ищут хост по `booking.hostId`).
6. **Фронт.** Маршрут `/book/:slug` принимает slug **или** UUID хоста (regex); ссылки по-прежнему строятся из `host.slug`.

## Consequences

**+** Реальные мульти-хост: слоты и брони изолированы по организатору; создание хоста через API.
**+** Совместимость: старый однохостовый флоу и slug-ссылки работают; панель и `/events` не сломаны.
**+** Публичные ссылки на хост можно выдавать по стабильному UUID.
**−** Скаляры расписания (`slotDurationMin`, буферы, `minNoticeMin`, `horizonDays`) пока общие — хранятся в одной строке `availability_rules`; per-host — следующий шаг (снято в [ADR-0020](0020-per-host-availability-rules.md)). Слоты при этом уже per-host (различаются диапазоны `availability_ranges`).
**−** Панель организатора по-прежнему управляет дефолтным хостом (`host.slug = 'default'` во фронтенд-конфиге); переключатель хостов в UI — не в этом шаге.
**−** Нет UI создания хостов — только API (`POST /api/v1/hosts`).
**−** `bookings.hostId` дублирует связь через `eventType.hostId` — денормализация ради простоты скоупинга.

## Alternatives considered

- **Оставить `slots`/`bookings` глобальными, а хост вычислять через join.** Отклонено: кросс-хостовые слоты не изолируются, `POST /api/v1/hosts/:ref/bookings` не может проверить принадлежность слота хосту.
- **Параметр маршрута только UUID (без slug).** Отклонено на этом шаге: ломает существующие slug-ссылки/тесты и фронтенд-конфиг; резолвинг slug-или-UUID даёт UUID-ссылки без ломки.
- **Сразу вынести per-host скаляры расписания.** Отклонено: добавляет ещё одну миграцию и переписывание формы доступности; изоляция слотов/броней уже даёт работающий мульти-хост.
