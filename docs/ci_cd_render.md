# Деплой: Render.com + Neon

> **Для проекта 387** актуальный пошаговый чек-лист со своими именем сервиса (`calendar-slots-387`),
> базой Neon и группой `DB-387` — [`deploy-387.md`](deploy-387.md). Ниже описана общая механика; в
> примерах остался URL старого стенда 386.

Актуальная схема деплоя «Календарь звонков»: контейнер на **Render** (план free) + база в **Neon** (PostgreSQL). План Google Cloud Run из [`docs/archive/ci_cd.md`](archive/ci_cd.md) **не используется** — он остался как альтернатива.

Конфигурация в репозитории: `render.yaml` (Blueprint), `Dockerfile` (multi-stage). Живой стенд проекта **387**: <https://ai-for-developers-project-387-uvu8.onrender.com> (сервис Render — `calendar-slots-387`). Значения для 386 оставлены в примерах ниже как исторические — источник истины по 387 — [`deploy-387.md`](deploy-387.md).

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
| `APP_ORIGIN` | `https://ai-for-developers-project-387-uvu8.onrender.com` | базовый origin для ссылок в письмах (fallback — `RENDER_EXTERNAL_URL`) |
| `TURNSTILE_SITEKEY` / `TURNSTILE_SECRET_KEY` / `TURNSTILE_ALLOWED_HOSTNAMES` | ключи Cloudflare Turnstile | включают CAPTCHA ([ADR-0025](adr/0025-captcha-and-rate-limit.md)). В `TURNSTILE_ALLOWED_HOSTNAMES` — **только hostname, без `https://` и без слеша**: Cloudflare возвращает в ответе siteverify чистый домен, сервер сверяет его как есть (`server/captcha.ts`); со значением «с протоколом» запись отклоняется с «Проверка защиты не пройдена». Несколько хостов — через запятую |

## 3. Создание сервиса вручную (если Blueprint не подошёл)

1. <https://dashboard.render.com> → **Sign in with GitHub**.
2. **New +** → **Web Service** → подключить репозиторий.
3. Параметры: `Name: calendar-slots-387`, `Region: Frankfurt (EU Central)`, `Branch: main`, `Root Directory: пусто`, `Runtime: Docker`, `Instance Type: Free`.
4. **Environment Variables**: `NODE_ENV=production`, `PORT=10000`, `DATABASE_URL=<строка Neon>`. Пароль организатора не нужен — панель открыта ([ADR-0028](adr/0028-dashboard-access-without-login.md)).
5. **Create Web Service** — Render соберёт образ из `Dockerfile` и начнёт деплой по каждому пушу в `main` (`autoDeploy: true`).
6. Healthcheck — `GET /health` (в Blueprint: `healthCheckPath: /health`).

Через Blueprint (`render.yaml`) всё то же создаётся одной кнопкой в разделе **Blueprints** — файл уже содержит `fromGroup: DB`, `PORT` и `NODE_ENV`.

## 4. База данных Neon

1. <https://console.neon.tech> → новый проект, регион рядом с Render ( frankfurt/berlin ).
2. Скопировать **pooled connection string** → это и есть `DATABASE_URL`. Значение `sslmode` править **не нужно**: сервер приводит его к `verify-full` сам (`server/env.ts`, `normalizeSslMode`), потому что и Neon, и Render формируют ссылку сами и по умолчанию кладут `sslmode=require`, на который `pg-connection-string` ругается предупреждением. Подробности — в [ADR-0013](adr/0013-postgres-migration.md) и бэклоге `docs/todo.md`.
3. На Render: **Environment Groups** → создать группу (например `DB`) и добавить в неё `DATABASE_URL`; в `render.yaml` он подхватывается через `fromGroup: DB`.
4. Схему создавать вручную не нужно: при старте сервера выполняются идемпотентные миграции `server/db/migrate.ts`, а при старте с пустой БД сидируются дефолтный хост, тип встречи и слоты по правилам доступности.

Проверка соединения: `curl https://<host>/health` → `{"status":"ok","captchaEnabled":true}`. Второе поле — признак того, что `TURNSTILE_SECRET_KEY` доехал до стенда: `captchaEnabled: false` в production означает, что публичная запись не защищена от ботов (#38). SSL-предупреждение `pg` в логах быть не должно — режим приводится к `verify-full` в `server/env.ts` (ADR-0013).

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

### 6.1. Квота 750 часов: один тёплый сервис — один аккаунт

Render даёт **750 free-часов на workspace в календарный месяц**. Часы тратятся, пока сервис **не спит**:
спящий сервис (после ~15 минут простоя) часов не ест, но и не отвечает — холодный старт около минуты.

Механика, из-за которой квота выжигается (проверено на стенде 387, [#59](https://github.com/frostiks777/ai-for-developers-project-387/issues/59)):

| Что | Часов в месяц |
|---|---|
| Месяц | 744 ч |
| Один free-сервис, не засыпающий 24/7 | ~744 ч — влезает в 750 (запас ~6 ч) |
| Два таких сервиса в одном workspace | ~1488 ч — **квота выжигается примерно к 15-му числу**, Render suspend'ит все free-сервисы до 1-го числа |

> Free-тариф Render не даёт больше одного workspace на аккаунт (второй — только начиная с Scale за $499/мес), поэтому «развести по аккаунтам» = отдельный аккаунт Render.

**Правило для этого проекта:**

1. **Один тёплый free-сервис = один аккаунт Render.** Проекты 386 и 387 держатся в разных аккаунтах именно из-за этого.
2. **Keep-alive — не больше одного на аккаунт.** Внешний cron (cron-job.org) дёргает `/api/internal/reminders` каждые 10 минут, не давая сервису заснуть: это ровно то, что превращает 15 минут простоя в 744 часа. Держать его ради второго сервиса в том же аккаунте — гарантированный suspend.
3. **Перед добавлением второго free-сервиса** в аккаунт сначала прикинуть часы: 2 × 744 > 750 — не влезает. Либо второй аккаунт, либо отказ от keep-alive (тогда сервис спит и просыпается на ~минуту дольше).
4. Часы обнуляются 1-го числа каждого месяца; остаток не переносится.
