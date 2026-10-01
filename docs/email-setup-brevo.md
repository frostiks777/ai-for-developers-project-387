# Настройка email-уведомлений: Brevo + Render + cron-job.org

Пошаговая инструкция для продакшена ([ADR-0026](adr/0026-email-notifications.md), фича [#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83)).
Провайдер — **Brevo HTTP API** (free: 300 писем/день, без карты, домен не обязателен). SMTP не
используется: Render Free блокирует порты 25/465/587.

> **Что получится:** письма гостю (подтверждение, перенос, отмена) и организатору (новая бронь,
> отмена), плюс напоминание за 24 часа до встречи. Пока `EMAIL_API_KEY` не задан, приложение
> отправку пропускает (no-op) — ничего не сломается, если что-то из шагов не сделать.

Нужны три вещи: аккаунт **Brevo** (уже есть), доступ к дашборду **Render** и бесплатный аккаунт
**cron-job.org** для напоминаний.

---

## Шаг 1. Brevo: подтвердить аккаунт

1. Войдите на https://app.brevo.com.
2. Если Brevo просит заполнить профиль компании (страна, сфера), заполните — на бесплатном плане
   аккаунт должен быть активирован, иначе API вернёт
   `402 Payment Required` / `account_under_validation`.
3. Проверьте, что на почте нет письма от Brevo с просьбой подтвердить адрес; подтвердите, если есть.

## Шаг 2. Brevo: верифицировать отправителя (sender)

Письма можно отправлять только с адреса, который Brevo считает своим. Домен не обязателен — хватит
**одного подтверждённого адреса**.

1. Откройте https://app.brevo.com/settings/senders (раздел **Senders, Domains & Dedicated IPs → Senders**).
2. **Add a sender** → заполните:
   - **From name** — как будет подписано письмо, например `Календарь звонков`;
   - **From email** — ваш адрес, например `calendar.slots@gmail.com` (лучше отдельный ящик, не личный).
3. Brevo отправит письмо-подтверждение на этот адрес — **откройте его и нажмите кнопку
   подтверждения** (иначе адрес остаётся неподтверждённым и API даст `400 invalid sender`).
4. Убедитесь, что адрес в списке имеет статус **Verified**.

> Для лучшей доставляемости позже стоит добавить свой домен и записи SPF/DKIM/DMARC
> (`Senders, Domains & Dedicated IPs → Domains`). Без домена письма тоже уходят, но чаще попадают
> в «Спам» и содержат бейдж «Sent with Brevo».

## Шаг 3. Brevo: получить API-ключ

1. Откройте https://app.brevo.com/settings/keys/api (раздел **SMTP & API → API Keys**).
2. **Generate a new API key** → тип **v3** (именно для REST API; SMTP-ключ не подойдёт) → имя, например
   `call-calendar`.
3. Скопируйте ключ вида `xkeysib-...` — он показывается **один раз**; сохраните в менеджере паролей.
4. Не вставляйте ключ в файлы репозитория: он нужен только в Render (и локально в `.env`, который в
   `.gitignore`).

> Проверка ключа вручную (подставьте свой ключ и подтверждённый sender-email):
>
> ```bash
> curl -X POST 'https://api.brevo.com/v3/smtp/email' \
>   -H 'api-key: xkeysib-ВАШ_КЛЮЧ' \
>   -H 'content-type: application/json' \
>   -d '{"sender":{"email":"ВАШ_SENDER@example.com"},"to":[{"email":"ВАШ_SENDER@example.com"}],"subject":"Brevo test","textContent":"ok"}'
> ```
>
> `201` — всё хорошо; `401` — неверный ключ; `402` — аккаунт не активирован; `400` — sender не
> подтверждён.

## Шаг 4. Render: задать переменные окружения

1. Render Dashboard → ваш сервис `calendar-slots-app` → **Environment**.
2. Добавьте переменные (значения — свои):

| Key | Значение | Пример |
|---|---|---|
| `EMAIL_API_KEY` | скопированный ключ Brevo (v3) | `xkeysib-...` |
| `EMAIL_FROM` | подтверждённый sender из шага 2 | `Календарь звонков <calendar.slots@gmail.com>` |
| `EMAIL_REPLY_TO` | почта организатора (куда отвечать гостю) | `calendar.slots@gmail.com` |
| `ORGANIZER_EMAIL` | получатель писем организатору; пусто — не слать | `calendar.slots@gmail.com` |
| `REMINDER_LEAD_MINUTES` | за сколько минут напоминать | `1440` (24 часа) |
| `REMINDERS_SECRET` | случайный секрет для внешнего cron (см. ниже) | `a1b2…` |
| `APP_ORIGIN` | адрес стенда для ссылок в письмах | `https://calendar-slots-app.onrender.com` |

3. **Save Changes** — Render перезапустит сервис (это и есть деплой новых настроек).

Сгенерировать `REMINDERS_SECRET` локально:

```powershell
# PowerShell — 32 байта в hex
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Minimum 0 -Maximum 256) })
```

или в Git Bash / Linux:

```bash
openssl rand -hex 32
```

> `RENDER_EXTERNAL_URL` Render подставляет сам — если `APP_ORIGIN` не задать, ссылки в письмах
> соберутся из него. `APP_ORIGIN` всё равно лучше задать явно.

## Шаг 5. Проверить на живом стенде

**a) Письмо гостю.** Откройте `https://calendar-slots-app.onrender.com/book/default`, запишитесь на
свободный слот, указав **свой реальный email**. Через несколько секунд проверьте почту (и папку
«Спам»). Если `ORGANIZER_EMAIL` задан — второе письмо придёт организатору о новой брони.

**b) Endpoint напоминаний.**

```bash
# без секрета → 401
curl.exe -i -X POST https://calendar-slots-app.onrender.com/api/internal/reminders

# с секретом → 200 {"sent":N}
curl.exe -i -X POST https://calendar-slots-app.onrender.com/api/internal/reminders \
  -H "X-Reminders-Secret: ВАШ_REMINDERS_SECRET"
```

Если вернулось `404` — значит `REMINDERS_SECRET` не доехал до Render (проверьте шаг 4 и перезапуск).

**c) Логи.** Render → **Logs**: при первом запуске с новыми переменными не должно быть строки
«Email-уведомления выключены: не задан EMAIL_API_KEY».

**d) Почему письма в спаме.** Без своего домена и SPF/DKIM это ожидаемо. Основные шаги: проверить
папку «Спам» и нажать «Не спам», а позже подключить домен с SPF/DKIM/DMARC (шаг 2).

## Шаг 6. cron-job.org: будильник для напоминаний

Напоминания не запускаются in-process: сервис на Render Free засыпает через 15 минут простоя.
Внешний cron каждые 10 минут дёргает защищённый endpoint, заодно не давая сервису заснуть.

1. Зарегистрируйтесь на https://console.cron-job.org/signup и подтвердите email.
2. **Create cronjob** и заполните:
   - **Title**: `Calendar reminders`;
   - **URL**: `https://calendar-slots-app.onrender.com/api/internal/reminders`;
   - **Schedule**: every **10 minutes** (предустановка «Every 10 minutes»);
   - **Request method**: `POST` (тело запроса можно оставить пустым — endpoint принимает любой `Content-Type`);
   - включите **Advanced** → **Custom headers** → добавьте заголовок
     `X-Reminders-Secret` = значение из Render (шаг 4);
   - по желанию: **Notify on failure** (email при падении).
3. **Save**. Первый запуск можно нажать вручную кнопкой **Run now** и посмотреть ответ в разделе
   **History** (там же видны последние 50 запусков).

> Почему 10 минут: минимальный интервал cron-job.org — 1 минута, таймаут запроса — 30 секунд.
> При интервале больше 15 минут сервис успевает заснуть, а холодный старт Render может не уложиться
> в 30 секунд — cron отметит запуск ошибкой (после 25 ошибок подряд job отключается автоматически).
> Интервал 10 минут держит сервис «тёплым»: ~720 часов занятости в месяц из 750 бесплатных — влезает,
> но следите, если добавите второй сервис.

---

## Частые ошибки

| Симптом | Причина и что делать |
|---|---|
| Письма не уходят, в логах Render нет ошибок | Не задан `EMAIL_API_KEY` — это режим no-op. Задайте переменную и перезапустите сервис |
| `Brevo API 401` | Неверный или удалённый ключ, либо создан не v3-ключ. Перевыпустите на `app.brevo.com/settings/keys/api` |
| `Brevo API 402` | Аккаунт Brevo не активирован (`account_under_validation`) — заполните профиль компании в Brevo |
| `Brevo API 400` / `invalid sender` | `EMAIL_FROM` не совпадает с подтверждённым sender или письмо-подтверждение не кликнуто (шаг 2) |
| Письма уходят только на свой адрес | Использован `onboarding@…`-подобный песочный отправитель — нужен свой подтверждённый sender |
| `/api/internal/reminders` → `404` | `REMINDERS_SECRET` не задан в Render (endpoint выключен) |
| `/api/internal/reminders` → `401` | В заголовке cron `X-Reminders-Secret` другое значение, чем в Render |
| cron получает `415 Unsupported Media Type` | Старый деплой принимал только `json`/`text`. Обнови стенд (фикс [#86](https://github.com/frostiks777/ai-for-developers-project-386/issues/86)): endpoint теперь принимает любой `Content-Type` и пустое тело |
| Письма в «Спаме» | Нет домена и SPF/DKIM/DMARC (см. шаг 2); попросите получателей отметить «Не спам» |
| Превышение лимита | Free-план Brevo — 300 писем/день. Напоминания + подтверждения при демо-нагрузке укладываются |

## Безопасность

- Секреты (`EMAIL_API_KEY`, `REMINDERS_SECRET`) — только в Render Environment и локальном `.env`
  (в `.gitignore`); в репозиторий и чат не попадают.
- `/api/internal/reminders` защищён секретом и не является публичным «отправителем писем»: без
  `REMINDERS_SECRET` отвечает `404`, с неверным заголовком — `401`.
- Письма транзакционные: только гостям, которые сами оставили email при записи. Никаких рассылок по
  купленным базам.
