# Подключение стека к 387: Render + Neon + cron-job.org + Turnstile + Brevo

Пошаговая инструкция по развёртыванию **независимого** стенда проекта 387 — так же, как это сделано
для 386, но со своими именем сервиса, базой, виджетом CAPTCHA и cron-задачей.

> **Зачем отдельная инструкция.** Репозиторий 387 — копия 386, поэтому в `render.yaml`, `README.md`
> и `.env.example` изначально стояли значения 386: имя `calendar-slots-app` и URL
> `calendar-slots-app.onrender.com`. Деплой «как есть» либо конфликтует с живым стендом 386, либо
> переиспользует его. Ниже — согласованный набор значений именно для 387.

Механику деплоя и почты подробно описывают [`ci_cd_render.md`](ci_cd_render.md) и
[`email-setup-brevo.md`](email-setup-brevo.md) — в них примеры уже переведены на 387. Для 387
источник истины — этот файл.

---

## 0. Что получится

| Параметр | Значение для 387 |
|---|---|
| GitHub-репозиторий | `frostiks777/ai-for-developers-project-387` |
| Render Web Service | `calendar-slots-387` |
| Публичный URL | `https://ai-for-developers-project-387-uvu8.onrender.com` |
| Render Environment Group | `DB-387` |
| База Neon | отдельная БД в **существующем проекте 386** (не новая копия данных) |
| Turnstile-виджет | `Call Calendar 387`, хост `ai-for-developers-project-387-uvu8.onrender.com` |
| cron-job.org | `POST .../api/internal/reminders` каждые 10 минут |
| Brevo | общий аккаунт с 386 (sender и API-ключ можно переиспользовать) |

Итог: два изолированных стенда в **разных аккаунтах Render** — 386 (`calendar-slots-app.onrender.com`)
и 387 (`ai-for-developers-project-387-uvu8.onrender.com`) — не мешают друг другу.

### Что понадобится

- доступ к GitHub-репозиторию 387;
- аккаунт [Render](https://dashboard.render.com) (вход через GitHub) — **отдельный от аккаунта стенда
  386**: квота 750 free-часов считается на workspace, второй workspace на free-тарифе недоступен, а
  два не засыпающих free-сервиса в одном аккаунте выжигают её к середине месяца (подробно —
  [`ci_cd_render.md`](ci_cd_render.md) §6.1);
- аккаунт [Neon](https://console.neon.tech) — тот же, где живёт проект 386;
- аккаунт [Cloudflare](https://dash.cloudflare.com/4181d1db54e1f7e0219de629f1d3a841/turnstile) —
  тот же, где виджет 386;
- аккаунт [Brevo](https://app.brevo.com) — тот же, что у 386;
- аккаунт [cron-job.org](https://console.cron-job.org).

---

## Шаг 1. Neon — отдельная БД в проекте 386

Данные 386 и 387 изолируются на уровне **отдельной базы внутри одного проекта Neon**. Новый проект
и новый биллинг не нужны, квота free-плана не расходуется дважды.

1. Откройте <https://console.neon.tech> → проект, в котором живёт база 386.
2. Проверьте активную ветку — обычно `main` (в левом верхнем углу). Ветку менять не нужно.
3. Откройте **SQL Editor** и выполните:

   ```sql
   CREATE DATABASE calendar387;
   ```

   Имя базы — `calendar387` (без дефисов, чтобы не пришлось экранировать).
4. Откройте **Connection Details** для той же ветки и скопируйте **pooled** connection string.
5. Замените имя базы в строке на `calendar387`. Должно получиться примерно так:

   ```
   postgresql://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/calendar387?sslmode=require
   ```

   Параметр `sslmode` **не трогайте**: сервер сам приводит его к `verify-full`
   (`server/env.ts`, `normalizeSslMode`).
6. Сохраните строку — это `DATABASE_URL` для 387 (понадобится в шаге 2).

> Схему создавать вручную не нужно: при старте сервера выполняются идемпотентные миграции
> (`server/db/migrate.ts`), а на пустой БД сидируются дефолтный хост, тип встречи и слоты.
>
> **Альтернатива для полной изоляции:** создать в проекте 386 отдельную *ветку* (`Branch → 387`).
> Тогда у неё будет свой endpoint и своя connection string. Минус — отдельный compute, расходующий
> квоту. Для курса достаточно отдельной БД.

---

## Шаг 2. Render — Environment Group `DB-387`

Environment Group — это «общий мешок» переменных, который Render подключает к сервису. Для 386 уже
есть группа `DB`; её переиспользовать **нельзя**, иначе 387 подключится к базе 386.

1. <https://dashboard.render.com> → **Environment** (в левом меню) → **Environment Groups** →
   **New Environment Group**.
2. **Name**: `DB-387`.
3. Добавьте переменную:
   - **Key**: `DATABASE_URL`
   - **Value**: строка из шага 1.
4. **Save**.

В `render.yaml` сервис уже подключён к этой группе строкой `fromGroup: DB-387`.

---

## Шаг 3. Render — Web Service

### Вариант A (рекомендуется): Blueprint

1. **New +** → **Blueprint** → подключите репозиторий
   `frostiks777/ai-for-developers-project-387`.
2. Render прочитает `render.yaml`: сервис `calendar-slots-387`, регион `frankfurt`, план `free`,
   Docker, healthcheck `/health`, группа `DB-387`.
3. **Apply** — Render соберёт образ из `Dockerfile` и начнёт деплой. Дальше каждый push в `main`
   деплоится автоматически (`autoDeploy: true`).

### Вариант B: вручную

1. **New +** → **Web Service** → репозиторий 387.
2. Параметры:
   - **Name**: `calendar-slots-387`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Root Directory**: пусто
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
3. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - подключите группу `DB-387` (кнопка **Add from Group**).
4. **Create Web Service**.

После первого успешного деплоя появится URL `https://ai-for-developers-project-387-uvu8.onrender.com`.
Проверьте, что он открывается: `GET /health` → `{"status":"ok","captchaEnabled":false}`. До шага 4
(Cloudflare Turnstile) `captchaEnabled: false` — ожидаемо; после задания `TURNSTILE_SECRET_KEY` в
среде проверьте поле ещё раз — так пропущенный ключ заметен сразу, а не по потоку спам-броней (#38).

---

## Шаг 4. Cloudflare Turnstile — новый виджет

Виджет 386 привязан к хосту `calendar-slots-app.onrender.com`, поэтому под 387 создаётся **свой**.

1. Откройте <https://dash.cloudflare.com/4181d1db54e1f7e0219de629f1d3a841/turnstile>.
2. **Add widget** / **Create a widget** и заполните:
   - **Widget name**: `Call Calendar 387`;
   - **Hostnames**: добавьте `ai-for-developers-project-387-uvu8.onrender.com`
     (при желании — `localhost` для локальной проверки);
   - **Widget Mode**: `Managed`;
   - **Appearance**: `Visible`;
   - **Pre-clearance**: `Off`.
3. **Create**. Скопируйте два значения:
   - **Site Key** (публичный, начинается с `0x4AAAA…`);
   - **Secret Key** (секретный, `0x4AAAA…`).
4. Сохраните их — понадобятся в шаге 6.

> На бесплатном плане — до 10 хостов на виджет и 20 виджетов. Если хост не добавлен, Cloudflare
> вернёт ошибку `400020`, а виджет на странице записи не пройдёт проверку.

---

## Шаг 5. Brevo — sender и API-ключ

Brevo у 386 уже настроен, и аккаунт общий, поэтому:

- **Sender** (подтверждённый адрес из раздела Senders) можно переиспользовать как есть.
- **API-ключ** тоже можно переиспользовать. Если хочется раздельного учёта — создайте новый ключ:
  <https://app.brevo.com/settings/keys/api> → **Generate a new API key**, тип **v3**, имя
  `call-calendar-387`.

Полная проверка/настройка sender при необходимости — шаги 1–3 в
[`email-setup-brevo.md`](email-setup-brevo.md).

---

## Шаг 6. Render — переменные окружения сервиса

Откройте сервис `calendar-slots-387` → **Environment** и добавьте переменные (значения — свои):

| Key | Значение | Комментарий |
|---|---|---|
| `TURNSTILE_SITEKEY` | Site Key из шага 4 | отдаётся гостю в настройках хоста |
| `TURNSTILE_SECRET_KEY` | Secret Key из шага 4 | **пока не задан — CAPTCHA выключена** |
| `TURNSTILE_ALLOWED_HOSTNAMES` | `ai-for-developers-project-387-uvu8.onrender.com` | сверка домена ответа Cloudflare — **только hostname, без `https://` и без слеша** (иначе запись отклоняется с «Проверка защиты не пройдена»); несколько хостов — через запятую |
| `EMAIL_API_KEY` | ключ Brevo (v3) | пока пусто — письма не отправляются |
| `EMAIL_FROM` | `Календарь звонков <sender@example.com>` | подтверждённый sender |
| `EMAIL_REPLY_TO` | почта организатора | Reply-To писем гостю |
| `ORGANIZER_EMAIL` | почта организатора | получатель писем о бронях; пусто — не шлём |
| `REMINDER_LEAD_MINUTES` | `1440` | напоминание за 24 часа |
| `REMINDERS_SECRET` | случайная строка (см. ниже) | включает `POST /api/internal/reminders` |
| `APP_ORIGIN` | `https://ai-for-developers-project-387-uvu8.onrender.com` | ссылки в письмах |

Сгенерировать `REMINDERS_SECRET` локально:

```powershell
# PowerShell — 32 байта в hex
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Minimum 0 -Maximum 256) })
```

или в Git Bash / Linux:

```bash
openssl rand -hex 32
```

**Save Changes** — Render перезапустит сервис (это и есть применение настроек).

---

## Шаг 7. cron-job.org — будильник напоминаний

Сервис на Render Free засыпает через ~15 минут простоя, поэтому напоминания запускает внешний cron:
каждые 10 минут он дёргает защищённый endpoint и заодно держит сервис «тёплым».

1. Войдите на <https://console.cron-job.org>.
2. **Create cronjob** и заполните:
   - **Title**: `Calendar 387 reminders`;
   - **URL**: `https://ai-for-developers-project-387-uvu8.onrender.com/api/internal/reminders`;
   - **Schedule**: `Every 10 minutes`;
   - **Request method**: `POST`;
   - **Advanced → Custom headers**: `X-Reminders-Secret` = значение `REMINDERS_SECRET` из шага 6.
3. **Save**. Кнопкой **Run now** можно проверить запуск; результат — в разделе **History**.

> Почему 10 минут: минимальный интервал cron-job.org — 1 минута, таймаут запроса — 30 секунд.
> При интервале больше 15 минут сервис успевает заснуть, и холодный старт может не уложиться в
> таймаут (после 25 ошибок подряд job отключается автоматически).

---

## Шаг 8. Проверка стенда

```bash
# 1. Живость
curl.exe -i https://ai-for-developers-project-387-uvu8.onrender.com/health
# 200 {"status":"ok"}

# 2. Настройки хоста: site key отдаётся только когда задан TURNSTILE_SECRET_KEY
curl.exe https://ai-for-developers-project-387-uvu8.onrender.com/api/v1/hosts/default/settings

# 3. Endpoint напоминаний: без секрета → 401, с секретом → 200 {"sent":N}
curl.exe -i -X POST https://ai-for-developers-project-387-uvu8.onrender.com/api/internal/reminders
curl.exe -i -X POST https://ai-for-developers-project-387-uvu8.onrender.com/api/internal/reminders \
  -H "X-Reminders-Secret: ВАШ_REMINDERS_SECRET"
```

Ручной чек в браузере:

- `/` — лендинг открывается;
- `/book/default` — форма записи показывает **виджет Turnstile**; после записи приходит письмо
  гостю, а при заданном `ORGANIZER_EMAIL` — и организатору (проверяйте папку «Спам»);
- `/dashboard` — панель организатора открыта без логина (ADR-0028).

Логи Render → **Logs**: не должно быть строк «CAPTCHA выключена…» и «Email-уведомления выключены…»
(они появляются, если не задан соответствующий ключ), а также ошибок миграций.

---

## Шаг 9. Ограничения free-плана

- Render засыпает после ~15 минут простоя; первый запрос — медленный (холодный старт).
- Neon Free: база засыпает после 5 минут простоя, холодный старт — до секунды.
- Один инстанс Render: горизонтального масштабирования нет, состояние — в Neon.
- Filesystem контейнера эфемерна: без `DATABASE_URL` сервер поднимет PGlite в памяти и **потеряет
  данные при рестарте**.
- Секреты живут только в переменных Render и локальном `.env` (в `.gitignore`).
- **Квота 750 free-часов на workspace.** Часы тратятся, пока сервис не спит, поэтому 387 держится в
  **отдельном аккаунте Render** от 386, а keep-alive из шага 7 (cron-job.org каждые 10 минут)
  допустим **не больше одного на аккаунт**: два не засыпающих free-сервиса в одном workspace дают
  2 × 744 ч при квоте 750 ч, и Render suspend'ит все free-сервисы до 1-го числа. Расчёт и правило —
  в [`ci_cd_render.md`](ci_cd_render.md) §6.1.

---

## Шаг 10. Доступность стенда: 404/503 на `/` и `/health`

**Симптомы** (замечание проверяющего от 22.10.2026, issue [#66](https://github.com/frostiks777/ai-for-developers-project-387/issues/66)):
на момент проверки `/` и `/health` отвечали `404`; плановые прогоны `opencode-audit`
20–23.10.2026 получали `503` (`ERRORED_DOCUMENT_REQUEST`, issue
[#62](https://github.com/frostiks777/ai-for-developers-project-387/issues/62)).
На 24.10.2026 стенд жив: `/`, `/dashboard`, `/health` → `200`, `curl -f …/health`
отвечает `200` в пяти проверках подряд с интервалом.

**Причина** (сводка; подробности — [`ci_cd_render.md`](ci_cd_render.md) §6):

1. **Сон free-плана:** Render Free засыпает после ~15 минут простоя → первый запрос —
   `503` и холодный старт до ~1 минуты. Это самая частая причина «недоступности».
2. **Окно деплоя** (`autoDeploy: true`): пока идёт рестарт после пуша в `main`,
   возможны короткие `404`/`503`.
3. **Квота 750 ч:** при исчерпании Render suspend'ит free-сервисы до 1-го числа —
   полная недоступность ([#59](https://github.com/frostiks777/ai-for-developers-project-387/issues/59)).
4. **Сбой внешнего keep-alive:** cron-job.org отключает job сам после 25 ошибок
   подряд — сервис начинает засыпать, и проверки ловят `503` (как прогоны аудита
   20–23.10.2026).

**Меры (что сделано):**

- **Keep-alive №1 (внешний):** cron-job.org — шаг 7, `POST /api/internal/reminders`
  каждые 10 минут.
- **Keep-alive №2 (в репозитории):**
  [`.github/workflows/keep-alive.yml`](../.github/workflows/keep-alive.yml) — каждые
  10 минут прогревает `APP_URL/health` с ретраями до `200` (до 2 минут на холодный
  старт) и проверяет `/`; если стенд недоступен — прогон падает с `::error::`,
  то есть `404`/`503` не проходят незамеченными (критерий п.3 задачи #66).
  Оба keep-alive бьют в один и тот же единственный free-сервис 387 — правило
  «один тёплый сервис на аккаунт» ([`ci_cd_render.md`](ci_cd_render.md) §6.1)
  соблюдено, расход часов не меняется (~744 ч/мес при квоте 750).
- **Лимит GitHub:** scheduled-воркфлоу отключается после 60 дней без активности
  в репозитории — после долгого простоя открыть вкладку **Actions** и при
  необходимости запустить `keep-alive` вручную (`workflow_dispatch`).

**Проверка доступности (2–3 запроса с интервалом):**

```bash
curl -f https://ai-for-developers-project-387-uvu8.onrender.com/health && sleep 20 && \
curl -f https://ai-for-developers-project-387-uvu8.onrender.com/health && sleep 20 && \
curl -f https://ai-for-developers-project-387-uvu8.onrender.com/health
```

**Связь с #62:** keep-alive убирает большинство `503`, но прогрев стенда перед
Lighthouse и падение прогона при `score === null` остаётся задачей #62 — это
дополняет решение по #66, а не противоречит ему.

---

## Частые ошибки

| Симптом | Причина и что делать |
|---|---|
| `/` или `/health` → `404`/`503` | Сон free-плана, окно деплоя или suspend за квоту — см. «Шаг 10. Доступность стенда» |
| Render при Blueprint предлагает занять `calendar-slots-app` | В `render.yaml` не обновлено имя. Для 387 должно быть `name: calendar-slots-387` |
| 387 пишет в базу 386 | В `render.yaml`/сервисе подключена группа `DB` вместо `DB-387` |
| Данные пропадают после рестарта | Не задан `DATABASE_URL` → работает PGlite в памяти |
| Виджет Turnstile не появляется | Не задан `TURNSTILE_SECRET_KEY` (CAPTCHA выключена намеренно) |
| Turnstile `400020` / бронь `CAPTCHA_FAILED` | Хост не добавлен в виджет или не совпадает `TURNSTILE_ALLOWED_HOSTNAMES` |
| `invalid sender` от Brevo | `EMAIL_FROM` не совпадает с подтверждённым sender |
| `/api/internal/reminders` → `404` | Не задан `REMINDERS_SECRET` (endpoint выключен) |
| `/api/internal/reminders` → `401` | В заголовке cron другое значение, чем в Render |
| Письма в «Спаме» | Нет домена и SPF/DKIM/DMARC — ожидаемо на free-плане |

---

## Что изменено в репозитории (issue [#8](https://github.com/frostiks777/ai-for-developers-project-387/issues/8))

- `render.yaml` — `name: calendar-slots-387`, `fromGroup: DB-387`, обновлён комментарий Turnstile.
- `README.md` — URL стенда 387, hostname Turnstile, Environment Group, ссылка на этот гайд.
- `.env.example` — комментарий с hostname 387.
- `docs/deploy-387.md` — этот файл.
