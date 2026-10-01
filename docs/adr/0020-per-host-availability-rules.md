# ADR 0020: Per-host скаляры расписания

## Status

Accepted — 2026-09-25.

## Context

[ADR-0018](0018-multi-host-model.md) привязал `slots`/`bookings` к `hostId`, но **скаляры расписания** (`slotDurationMin`, `bufferBeforeMin`, `bufferAfterMin`, `minNoticeMin`, `horizonDays`, легаси-окно `weekdays`/`windowStartHour`/`windowEndHour`) остались общими: они хранились в одной строке `availability_rules` с фиксированным `id=1`, а `loadAvailabilityRules()`/`saveAvailabilityRules()` игнорировали `hostId`. При этом диапазоны дней (`availability_ranges`) и слоты уже per-host.

Из-за этого настройки доступности одного организатора меняли `minNotice`/горизонт/буферы всех хостов — мульти-хост был неполным.

## Decision

1. **PK/unique.** У `availability_rules` больше нет глобального `id`; ключ — `hostId` с уникальным индексом `availability_rules_hostId_unique` (`server/db/schema.ts`, `server/db/migrate.ts`).
2. **Миграция** (идемпотентная): legacy-колонка `id` удаляется (`DROP CONSTRAINT IF EXISTS availability_rules_pkey` + `DROP COLUMN IF EXISTS id`); существующая строка бэкфиллится на дефолтный хост; `"hostId"` → `NOT NULL`; создаётся уникальный индекс.
3. **API функций.** `loadAvailabilityRules(hostId)` / `saveAvailabilityRules(hostId, rules)`; upsert по `hostId`. `server/availability-settings.ts` прокидывает `hostId` в load/save правил.
4. **Сид.** При старте слоты дефолтного хоста генерируются по **его** правилам; `POST /api/v1/hosts` сидирует новому хосту `defaultAvailabilityRules`. Легаси `GET/PUT /api/availability` работает с правилами дефолтного хоста; `minNoticeMs(hostId)` во всех проверках слотов.

## Consequences

**+** Полная изоляция расписаний: `minNotice`, горизонт, буферы, длительность слота и диапазоны — per-host.
**+** Созданный через API хост сразу имеет рабочие дефолтные правила.
**+** Легаси-эндпоинты и однохостовый флоу сохранены (дефолтный хост).
**−** У `availability_rules` на legacy-БД остаётся «мёртвая» nullable-колонка `id` (не удаляем жёстко, чтобы миграция была аддитивной и безопасной для повторного запуска).
**−** UI управления хостами по-прежнему отсутствует; панель работает с дефолтным хостом (отдельная задача [#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)).

## Alternatives considered

- **Оставить `id` PK и генерировать его в БД (identity/sequence).** Отклонено: для существующей строки `id=1` sequence конфликтует без ручного `setval`; миграция становится хрупкой.
- **Удалять legacy-колонку `id` безусловно.** Отклонено: `ALTER COLUMN … IF EXISTS` в Postgres нет, а fresh/legacy-БД различаются — оставлен nullable-столбец ради идемпотентности.
- **Не трогать скаляры, оставить глобально.** Отклонено: противоречит цели мульти-хоста (ADR-0018), настройки хостов протекали друг в друга.
