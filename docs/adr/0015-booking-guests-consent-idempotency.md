# ADR 0015: Гости, согласие ПДн и идемпотентность брони

## Status

Accepted — 2026-09-25.

## Context

Внешний backlog ([`docs/archive/gemini-code-1790192589378.md`](../archive/gemini-code-1790192589378.md) §1.2) требует от формы бронирования:
- обязательный чекбокс согласия с обработкой ПДн;
- массив `guests` (email участников, добавление по Enter);
- заголовок `Idempotency-Key` для защиты от двойного сабмита (retry / двойной клик).

Полноценный гейт по спеке отклонён ранее ([ADR-0007](0007-visual-redesign-and-themes.md)) в части UI, но эти пункты функциональные и затрагивают контракт `api/main.tsp` и схему `bookings`.

## Decision

1. **Гости** — необязательное поле `guests?: string[]` (email, ≤ 20) в `CreateBookingRequest`; в ответе `Booking.clientGuests?: string[] | null`. Хранение — JSON-строка в `bookings.guests` (nullable).
2. **Согласие** — обязательное `consentAccepted: boolean` в `CreateBookingRequest` (zod `refine === true`); хранение — `bookings.consentAccepted BOOLEAN NOT NULL DEFAULT false`. Легаси `POST /api/bookings` оставлен терпимым (поле необязательное), чтобы не ломать старый контракт.
3. **Idempotency-Key** — необязательный HTTP-заголовок `@header("Idempotency-Key")`; сохраняется в `bookings.idempotencyKey` (UNIQUE, null допускается множественно). При повторе с тем же ключом сервер возвращает уже созданную бронь (`201`) и не создаёт вторую.
4. **БД** — миграции аддитивные: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS …` + уникальный индекс; применимо к существующей прод-БД Neon.

## Consequences

**+** Сквозной флоу соответствует внешней спеке; retry не создаёт дублей; гости и согласие доступны в API/БД.
**+** Контракт — источник истины TypeSpec, SDK генерирует поддержку и body (`guests`, `consentAccepted`), и заголовка (`options.idempotencyKey`).
**−** Тип `Booking` в контракте расширен обязательным `consentAccepted` — потребители (тесты, мапперы) обновлены; старые записи получают `false`.
**−** Легаси `/api/bookings` и v1 валидируют `consentAccepted` по-разному (v1 строго) — принято сознательно ради обратной совместимости.
**−** `guests` хранится как JSON-строка (нет нормализации на отдельную таблицу) — для MVP достаточно.

## Alternatives considered

- **Согласие только на клиенте (без контракта/БД).** Отклонено: серверная проверка — требование процесса (правила на сервере), плюс аудит факта согласия.
- **Отдельная таблица `booking_guests`.** Отклонено для MVP: лишняя нормализация и join; JSON-массив достаточен при ≤ 20 гостей.
- **Idempotency-Key через тело запроса.** Отклонено: канонический способ — HTTP-заголовок, он же не загрязняет доменную модель.
