# Бэкенд «Календарь звонков»

Fastify 5 + Drizzle ORM + better-sqlite3. Точка входа — `server/index.ts`.

## Запуск

```bash
npm run server:dev
```

Сервер поднимется на `http://localhost:3000` (слушает `0.0.0.0`), перезапускается при изменении файлов (tsx watch).

## Эндпоинты

### `GET /health` — проверка живости

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### `GET /api/slots` — список слотов (отсортирован по `startAt`)

```bash
curl http://localhost:3000/api/slots
# [{"id":1,"startAt":"2026-09-21T07:00:00.000Z","durationMin":30,"isBooked":false}, ...]
```

### `POST /api/bookings` — бронирование слота

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId":1,"name":"Иван","email":"ivan@example.com","phone":"+79001234567"}'
# 201 {"id":1,"slotId":1,"name":"Иван","phone":"+79001234567","email":"ivan@example.com","comment":null,"createdAt":"2026-09-21 12:00:00"}
```

`phone` и `comment` — необязательные поля. Пустой `phone` сохраняется как `null`.

Ошибки:

- `422 { "error": "Невалидное тело запроса" }` — slotId не положительное целое, пустое name, невалидные email/phone
- `400 { "error": "Слот уже прошёл" }` / `"Слот уже недоступен"` — слот в прошлом или ближе `minNotice`
- `404 { "error": "Слот не найден" }` — слота с таким id нет
- `409 { "error": "Слот уже занят" }` — на слот уже есть бронь

### `GET /api/bookings` — брони с данными слота (панель организатора)

```bash
curl http://localhost:3000/api/bookings
# [{"id":1,...,"startAt":"...","durationMin":30}, ...]
```

### `DELETE /api/bookings/:id` — отмена брони организатором

```bash
curl -X DELETE http://localhost:3000/api/bookings/1
# 204 (слот снова свободен)
```

Ошибки: `400` — некорректный id, `404` — брони нет.

### `POST /api/bookings/cancel` — отмена брони по токену

```bash
curl -X POST http://localhost:3000/api/bookings/cancel \
  -H "Content-Type: application/json" \
  -d '{"token":"<cancelToken из ответа на создание брони>"}'
# 204 (слот снова свободен)
```

`cancelToken` возвращается только в ответе `201` на создание брони (`GET /api/bookings` токен не отдаёт). Ошибки: `422` — нет токена, `404` — неизвестный токен.

### `GET /api/bookings/by-token/:token` — бронь по токену

Возвращает бронь с данными слота (для страницы переноса). `404` — неизвестный токен.

### `POST /api/bookings/reschedule` — перенос брони

```bash
curl -X POST http://localhost:3000/api/bookings/reschedule \
  -H "Content-Type: application/json" \
  -d '{"token":"<cancelToken>","slotId":2}'
# 200 {"id":1,...,"slotId":2,"startAt":"...","durationMin":30}
```

Старый слот освобождается, новый занимается. Ошибки: `400` — слот в прошлом/в пределах `minNotice`, `404` — токен или слот не найден, `409` — целевой слот уже занят.

### `GET /api/availability` — правила доступности

```bash
curl http://localhost:3000/api/availability
# {"weekdays":[1,2,3,4,5],"windowStartHour":10,"windowEndHour":18,"slotDurationMin":30,"bufferBeforeMin":0,"bufferAfterMin":10,"minNoticeMin":120,"horizonDays":14}
```

### `PUT /api/availability` — обновить правила

Тело — та же структура. Свободные будущие слоты пересобираются, занятые не трогаются. `422` при невалидных правилах.

## База данных

Файл БД: `server/data/app.db` (создаётся автоматически вместе с каталогом).

При старте сервера таблицы создаются через `CREATE TABLE IF NOT EXISTS`, поэтому скелет работает без миграций. Если будущих слотов нет — они генерируются по правилам доступности (`server/availability.ts` + `server/rules.ts`): по умолчанию будни 10:00–18:00 UTC, слот 30 мин, буфер 10 мин, предупреждение 120 мин, горизонт 14 дней.

## Миграции

Схема — `server/db/schema.ts`, конфиг — `drizzle.config.ts` в корне проекта.

```bash
npm run db:generate  # сгенерировать миграции в server/db/migrations по изменениям схемы
npm run db:push      # применить схему к БД напрямую (prototyping)
```
