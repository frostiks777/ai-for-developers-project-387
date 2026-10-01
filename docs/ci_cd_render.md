# Деплой: Render.com + Neon

Актуальная схема деплоя «Календарь звонков»: контейнер на **Render** (план free) + база в **Neon** (PostgreSQL). План Google Cloud Run из [`docs/archive/ci_cd.md`](archive/ci_cd.md) **не используется** — он остался как альтернатива.

Конфигурация в репозитории: `render.yaml` (Blueprint), `Dockerfile` (multi-stage). Живой стенд: <https://calendar-slots-app.onrender.com>.

## 1. Архитектура деплоя

| Слой | Где | Notes |
|---|---|---|
| Фронтенд + API | Render Web Service (Docker, `main`, `frankfurt`, plan `free`) | Fastify раздаёт `dist/` и слушает `/api/*` — один origin, CORS не нужен |
| БД | Neon (PostgreSQL) | строки подключения в `DATABASE_URL` |
| Доступ к панели | без логина: `/dashboard`, `/admin/*` и админские мутации открыты ([ADR-0028](adr/0028-dashboard-access-without-login.md)) | владелец один и заранее задан; `ADMIN_PASSWORD` не используется |
| Email-уведомления | Brevo HTTP API + внешний cron (cron-job.org) | включается `EMAIL_API_KEY` ([ADR-0026](adr/0026-email-notifications.md)); пошагово — [email-setup-brevo.md](email-setup-brevo.md) |

Данные **не** хранятся в контейнере: файловая система Render free эфемерна, поэтому БД обязана быть внешней. Без `DATABASE_URL` сервер поднимает PGlite в памяти — это годится для локального dev, но на Render приведёт к потере всех данных при каждом рестарте.

## 2. Переменные окружения

| Переменная | Значение в проде | Комментарий |
|---|---|---|
| `DATABASE_URL` | `postgresql://…?sslmode=require` | на Render приходит из **Environment Group `DB`** (см. `render.yaml`). Значение `sslmode` менять не нужно — нормализуется в `verify-full` на старте сервера |
| `PORT` | `10000` | Render задаёт порт; сервер читает `process.env.PORT` |
| `NODE_ENV` | `production` | отключает тестовый логгер Fastify |
| `EMAIL_API_KEY` | ключ Brevo (v3, `xkeysib-…`) | пусто — письма не отправляются (no-op). Подробная настройка — [email-setup-brevo.md](email-setup-brevo.md) |
| `EMAIL_FROM` | `Календарь звонков <sender@example.com>` | email должен быть **подтверждён** в Brevo (Senders) |
| `EMAIL_REPLY_TO` | почта организатора | Reply-To писем гостю |
| `ORGANIZER_EMAIL` | почта организатора | получатель писем о новых бронях/отменах; пусто — не шлём |
| `REMINDER_LEAD_MINUTES` | `1440` | напоминание за 24 часа до встречи |
| `REMINDERS_SECRET` | случайная строка | включает `POST /api/internal/reminders`; не задан — endpoint отвечает `404` |
| `APP_ORIGIN` | `https://calendar-slots-app.onrender.com` | базовый origin для ссылок в письмах (fallback — `RENDER_EXTERNAL_URL`) |
| `TURNSTILE_SITEKEY` / `TURNSTILE_SECRET_KEY` / `TURNSTILE_ALLOWED_HOSTNAMES` | ключи Cloudflare Turnstile | включают CAPTCHA ([ADR-0025](adr/0025-captcha-and-rate-limit.md)) |

## 3. Создание сервиса вручную (если Blueprint не подошёл)

1. <https://dashboard.render.com> → **Sign in with GitHub**.
2. **New +** → **Web Service** → подключить репозиторий.
3. Параметры: `Name: calendar-slots-app`, `Region: Frankfurt (EU Central)`, `Branch: main`, `Root Directory: пусто`, `Runtime: Docker`, `Instance Type: Free`.
4. **Environment Variables**: `NODE_ENV=production`, `PORT=10000`, `DATABASE_URL=<строка Neon>`. Пароль организатора не нужен — панель открыта ([ADR-0028](adr/0028-dashboard-access-without-login.md)).
5. **Create Web Service** — Render соберёт образ из `Dockerfile` и начнёт деплой по каждому пушу в `main` (`autoDeploy: true`).
6. Healthcheck — `GET /health` (в Blueprint: `healthCheckPath: /health`).

Через Blueprint (`render.yaml`) всё то же создаётся одной кнопкой в разделе **Blueprints** — файл уже содержит `fromGroup: DB`, `PORT` и `NODE_ENV`.

## 4. База данных Neon

1. <https://console.neon.tech> → новый проект, регион рядом с Render ( frankfurt/berlin ).
2. Скопировать **pooled connection string** → это и есть `DATABASE_URL`. Значение `sslmode` править **не нужно**: сервер приводит его к `verify-full` сам (`server/env.ts`, `normalizeSslMode`), потому что и Neon, и Render формируют ссылку сами и по умолчанию кладут `sslmode=require`, на который `pg-connection-string` ругается предупреждением. Подробности — в [ADR-0013](adr/0013-postgres-migration.md) и бэклоге `docs/todo.md`.
3. На Render: **Environment Groups** → создать группу (например `DB`) и добавить в неё `DATABASE_URL`; в `render.yaml` он подхватывается через `fromGroup: DB`.
4. Схему создавать вручную не нужно: при старте сервера выполняются идемпотентные миграции `server/db/migrate.ts`, а при старте с пустой БД сидируются дефолтный хост, тип встречи и слоты по правилам доступности.

Проверка соединения: `curl https://<host>/health` → `{"status":"ok"}`. SSL-предупреждение `pg` в логах быть не должно — режим приводится к `verify-full` в `server/env.ts` (ADR-0013).

## 5. Обновление и откат

- **Деплой новой версии:** пуш в `main` → автосборка (сборка занимает несколько минут, free-план может «заснуть»).
- **Откат:** Render → *Deploys* → выбрать предыдущий успешный деплой → *Rollback*.
- **Логи:** Render → *Logs* (live/по времени). Полезные маркеры: `Server listening at http://0.0.0.0:10000`, отсутствие ошибок миграций.
- **Проверка после деплоя:** `/health`, `/` (SPA), `/book/default`, `/dashboard` (откроется без пароля).

## 6. Ограничения free-плана

- Засыпание после ~15 минут простоя; первый запрос после сна — медленный (холодный старт).
- Сборка идёт на `free`-инстансе: лимит 512 МБ RAM. Образ multi-stage, native-зависимостей с компиляцией больше нет (`pg` — чистый JS), поэтому сборка лёгкая.
- Один инстанс: горизонтальное масштабирование невозможно, состояние держится в БД.
- Секреты (`DATABASE_URL`, `EMAIL_API_KEY`, `REMINDERS_SECRET`, ключи Turnstile) живут только в переменных Render, в репозитории их нет (`.env` в `.gitignore`, `.env.example` — без значений).
