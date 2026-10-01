# Email-уведомления: исследование (Resend / Brevo / Mailjet / SMTP2GO / SendGrid / Postmark / SES / Gmail)

Дата проверки всех утверждений: **2026-09-29**. Контекст проекта: Fastify (Node.js) + Docker на **Render.com Free**, БД Neon, паттерн «выключено, пока не задан ключ» (см. `server/captcha.ts`, `.env.example`). Деплой описан в `docs/ci_cd_render.md`.

---

## 1. Ограничения бесплатного плана Render, влияющие на email

### 1.1. Исходящий SMTP заблокирован на Free

- Free-план **блокирует исходящий трафик на порты 25, 465 и 587** (стандартные SMTP-порты). Изменение введено в сентябре 2025 и действует во всех регионах с 26.09.2025.
  - Источники: https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports ; https://render.com/docs/free («Free web services can't send outbound network traffic on ports 25, 465, or 587, commonly used for SMTP»).
- **Вывод: на Render Free отправлять письма через классический SMTP (587/465/25) нельзя — только HTTP API провайдера** (Resend, Brevo, Mailjet, SMTP2GO, Postmark, SES — у всех есть REST API по HTTPS/443, который не блокируется). Обход через нестандартные порты существует только у Resend (см. п. 2.1), но это недокументированный для Render обход — полагаться на него нельзя.
- Для снятия блокировки нужен любой платный instance type (тот же changelog).

### 1.2. Cron Jobs на бесплатном плане — нет

- У Render Cron Jobs **нет free-плана**: «Starting price: From $1/month», биллинг посекундный, **минимальный платёж $1 в месяц за каждый cron-job сервис**.
  - Источники: https://render.com/pricing (секция Cron Jobs) ; https://render.com/docs/cronjobs («minimum monthly charge of $1 per cron job service»).
- Самый дешёвый рантайм — Starter ($0.00016/мин). То есть планировщик напоминаний средствами Render бесплатен быть не может.

### 1.3. Засыпание (spin-down) и прочие лимиты Free

- Free web service **засыпает после 15 минут без входящего трафика** (HTTP/WebSocket), просыпается по следующему запросу (~1 мин холодного старта); при сне теряется локальная файловая система; возможен рестарт в любой момент.
  - Источник: https://render.com/docs/free (секции «Spinning down on idle», «Other limitations»).
- Квоты/лимиты: **750 free instance hours в месяц на workspace** (≈ один постоянно включённый сервис); 512 МБ RAM; один инстанс (без горизонтального масштабирования); нет persistent disks, нет one-off jobs, нет SSH; только один бесплатный Postgres на workspace (для нас неважно — БД в Neon).
  - Источник: https://render.com/docs/free.
- **Выводы для дизайна фичи:** in-process таймеры (`setTimeout`/`setInterval`) ненадёжны — процесс спит и перезапускается; очередь писем держать только в БД (Neon), не в памяти; синхронная отправка подтверждения/отмены при HTTP-запросе работает (запрос сам будит сервис).

---

## 2. Бесплатные transactional-провайдеры: сравнение

> Цены и квоты — на 2026-09-29. Все провайдеры ниже предлагают и HTTP API, и SMTP (важно: SMTP нам недоступен на Render Free, см. п. 1.1 — реально usable только HTTP API).

| Провайдер | Бесплатная квота (постоянная?) | SMTP / HTTP API | Нужен ли свой домен для отправки произвольным получателям | Достаточно ли верификации одного sender-email (без домена) | Примечания |
|---|---|---|---|---|---|
| **Resend** | **3000/мес + 100/день** (дневной лимит бьёт первым). Постоянный free, без карты | API + SMTP (`smtp.resend.com`, порты 25/465/587/**2465**/**2587**) | **Да.** Песочница `onboarding@resend.dev` шлёт **только владельцу аккаунта Resend** (иначе 403) | Нет — для писем гостям нужен верифицированный домен (SPF/DKIM через DNS) | Лучший DX для Node.js (официальный SDK `resend`, React Email). Rate limit 10 req/s на команду. Тестовые адреса `delivered@`/`bounced@`/`complained@resend.dev` |
| **Brevo** | **300/день** (~9000/мес), постоян. free, без карты | API + SMTP-релей | Для соответствия требованиям Gmail/Yahoo нужна аутентификация домена; одиночный sender верифицируется письмом-подтверждением, но без SPF/DKIM домена доставляемость низкая | Частично: одиночный sender создать можно, но для продакшн-рассылок требуется аутентифицированный домен | Письма free-плана содержат бейдж «Sent with Brevo» (снимается платным add-on). 100 000 контактов на free. SDK для Node.js есть |
| **Mailjet** | **6000/мес + 200/день**, постоян. free, без карты | API (Send API v3) + SMTP | Нужна валидация отправителя + аутентификация домена (SPF/DKIM/DMARC, guided setup) | Одиночный адрес подтверждается, но прод-отправка — с аутентифицированного домена | Лимит 1000 контактов на free; логотип Mailjet в письмах free; превышение дневного лимита — очередь до 3 суток. EU-резидентность (Франкфурт/Бельгия) |
| **SMTP2GO** | **1000/мес + 200/день** (+ лимит 25/час, снимается верификацией домена). Постоян. free, без карты | API + SMTP | Требуется добавить и верифицировать sender-домен (рекомендовано) или одиночный sender-email | Да: до 5 sender-доменов/адресов на free; без верификации — жёсткий лимит 25/час | Отчёты free — только 5 дней истории; тикет-поддержка после 14 дней. Хорошая измеренная доставляемость shared-IP |
| **SendGrid (Twilio)** | **Нет постоянного free.** Только 60-дневный триал: 100/день | API + SMTP | Требуется sender identity / domain authentication | Ни single-sender, ни домен не спасают — после триала отправка останавливается без платного плана | **Не подходит** под constraint «бесплатно». Триал: 100 email/день, 60 дней |
| **Postmark** | **100/мес**, бессрочный Developer-план, без карты | API + SMTP | Нужен sender signature / домен | Одиночный sender signature возможен, но квота мизерная | Отличная доставляемость и Message Streams, но 100/мес хватает только на dev-тест, не на демо-прод. Платно от $15/мес за 10 000 |
| **Amazon SES** | **Нет SES-специфичного free для новых аккаунтов** (с 21.07.2026 новые — на плане Essentials; только общие $200 AWS-кредитов на 6 мес). Ставка ~$0.16/1000 на Essentials | API + SMTP | Нужна верификация identity (домен/email) + **отдельный аппрув Production access** (выход из Sandbox) | Email-identity достаточно для старта, но Sandbox шлёт только верифицированным получателям | **Не подходит:** нужна кредитная карта + AWS-аккаунт, сложность (SNS для bounce-handling, репутация своя). Раньше было 3000/мес на 12 мес — отменено для новых |
| **Gmail SMTP** (личный ящик / Workspace) | ~500 получателей/день (личный), 2000/день (Workspace). «Бесплатно», но ценой аккаунта | Только SMTP (587/465) — **заблокирован на Render Free** + OAuth2/App-password | Нет (шлётся с ящика), но From — личный адрес | Н/Д | **Не подходит и опасен:** превышение лимита = блок отправки до 24 ч; массовая отправка с личного ящика → пометка как спам/бан аккаунта; нет SPF/DKIM за своим доменом; нарушает ToS для транзакционных рассылок |
| **Ethereal** (dev-песочница) | Бесплатно, без регистрации; письма **никогда не доставляются** | Только SMTP (тест) | Не нужен | Н/Д | Только для dev/CI: `nodemailer.createTestAccount()`, предпросмотр по `getTestMessageUrl()`. Не прод |
| **Mailtrap** (dev-песочница + прод) | Sandbox free (тестовый инбокс, домен не нужен); прод-отправка — платно/по квоте | Sandbox SMTP (порты **25/465/587/2525** — 2525 не входит в блок Render, но это всё равно только песочница) + API/SDK (`mailtrap` npm) | Для Sandbox — не нужен; для прод-отправки — нужен | Sandbox — да | Удобный флаг `sandbox: true/false` в официальном SDK — переключение dev/прод одним флагом. Прод-квоты free ограничены — как основной прод-канал не рекомендуется |

Источники к таблице:

- Resend квоты/лимиты: https://resend.com/docs/knowledge-base/account-quotas-and-limits ; https://resend.com/docs/api-reference/rate-limit.md ; ограничение `resend.dev` только своим адресом (403): https://resend.com/docs/knowledge-base/403-error-resend-dev-domain ; SMTP-настройки и порты 2465/2587: https://resend.com/docs/send-with-smtp ; тестовые адреса: https://resend.com/docs/dashboard/emails/send-test-emails.
- Brevo free 300/день: https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan ; планы (free навсегда, без карты): https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans ; SMTP+API и 300/день: https://www.brevo.com/features/email-api/ , https://www.brevo.com/free-smtp-server ; senders/domains (верификация sender + аутентификация домена): https://developers.brevo.com/docs/getting-started-with-senders-and-domains , https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email.
- Mailjet free 6000/мес + 200/день: https://documentation.mailjet.com/hc/en-us/articles/8625025643803-Mailjet-Subscription-Management ; очередь при превышении дневного лимита (3 дня): https://documentation.mailjet.com/hc/en-us/articles/360043048393-What-is-this-200-emails-per-day-limit-on-free-accounts ; цены (сентябрь 2026): https://documentation.mailjet.com/hc/en-us/articles/25750983876763-Mailjet-Subscription-Pricing-Update-September-9-2026 ; guided SPF/DKIM/DMARC: https://www.mailjet.com/lander/email-api-eu.
- SMTP2GO free 1000/мес + 200/день, лимит 25/час без верификации, 5 senders: https://www.smtp2go.com/pricing ; https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan.
- SendGrid: конец постоянного free, только 60-дневный триал 100/день: https://www.mailjet.com/comparisons/sendgrid-alternatives (раздел SendGrid, сентябрь 2026) ; https://www.smtp2go.com/blog/sendgrid-has-ended-its-free-plan-we-have-got-you-covered ; триальные лимиты 100/день: https://www.twilio.com/en-us/products/marketing-campaigns/pricing.
- Postmark free 100/мес бессрочно, платно от $15/10 000: https://postmarkapp.com/pricing ; https://postmarkapp.com/support/article/1285-pricing-billing-faq.
- SES: планы Essentials/Pro/Enterprise с 21.07.2026, отмена SES-free для новых: https://aws.amazon.com/ses/pricing/ ; разбор смены (Essentials по умолчанию, $0.16/1000, Sandbox не снимается планом): https://builder.aws.com/content/3Gubvy72jmeLSzktz28x7ZwYrEh/amazon-ses-pricing-plans-are-here-what-actually-changes-for-your-sending-architecture ; старые цифры free-12-мес (исторические): https://www.mailblast.io/blog/ses/amazon-ses-pricing (май 2026).
- Gmail лимиты 500/2000: https://support.google.com/a/answer/166852?hl=en ; https://support.google.com/mail/thread/306091169/daily-sending-limit-reached?hl=en.
- Ethereal: https://ethereal.email/ ; https://nodemailer.com/usage/testing-with-ethereal/ . Mailtrap Sandbox (без верификации домена, SMTP-порты incl. 2525, переключение sandbox/production флагом): https://docs.mailtrap.io/getting-started/email-sandbox ; https://docs.mailtrap.io/email-sandbox/setup ; https://github.com/mailtrap/mailtrap-nodejs/blob/main/README.md.

---

## 3. Антиспам / доставляемость: что обязательно

### 3.1. SPF, DKIM, DMARC — база

- **SPF** — DNS-запись, перечисляющая серверы, которым разрешено слать от имени домена.
- **DKIM** — криптоподпись писем (Gmail требует ключ **≥ 1024 бит** для личных ящиков).
- **DMARC** — политика (`p=none` минимум), связывающая From-домен с SPF/DKIM через **alignment**; без alignment письмо не проходит DMARC, даже если SPF и DKIM по отдельности «pass».
- Источник: https://support.google.com/mail/answer/81126?hl=en-GB (секции SPF/DKIM/DMARC, требование 1024-бит DKIM).

### 3.2. Правила Gmail/Yahoo для bulk-отправителей (с февраля 2024, ужесточение Gmail с ноября 2025)

- Порог bulk: **≥ 5000 писем/день на ящики провайдера** (Gmail считает отправителя bulk навсегда после первого превышения; Yahoo порог числом не публикует — «significant volume»).
- Требования bulk: **SPF + DKIM + DMARC (p=none минимум) с alignment From-домена**; **one-click unsubscribe** (заголовки `List-Unsubscribe` + `List-Unsubscribe-Post` по RFC 8058, обработка отписки за 2 дня) — для маркетинговых/подписанных писем; **спам-рейт < 0.3%** (цель ≤ 0.1%); валидные PTR/rDNS; соответствие RFC 5321/5322; TLS.
- Наш объём (единицы писем в день) под bulk-порог не попадает, но **минимальный набор (SPF/DKIM + выровненный From)** нужен при любом объёме — иначе письма лягут в спам.
- С ноября 2025 Gmail вместо временных deferral-ответов **сразу перманентно реджектит** (550, напр. `550-5.7.26` за DMARC) не соответствующие письма.
- Транзакционные письма (подтверждения, отмены, напоминания) **освобождены от требования one-click unsubscribe**, но Yahoo/Gmail рекомендуют не гадать на границе transactional/marketing.
- Источники: https://support.google.com/mail/answer/81126?hl=en-GB ; https://support.google.com/mail/answer/14229414?hl=en ; https://senders.yahooinc.com/best-practices?_sm_nck=1 ; https://senders.yahooinc.com/faqs ; сводка по всем трём провайдерам (вкл. Outlook с мая 2025): https://www.courier.com/blog/email-sender-requirements.

### 3.3. Почему shared-песочницы (`onboarding@resend.dev` и аналоги) ограничены

- Чужой домен нельзя использовать для рассылки: это защищает репутацию домена провайдера и чужую доставляемость. Resend жёстко: с `onboarding@resend.dev` — **только на email владельца аккаунта**, остальным — 403 с требованием верифицировать свой домен.
  - Источник: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain.
- Следствие для нас: **демо/прод без собственного домена невозможен ни на одном провайдере** — нужен хотя бы минимальный домен/субдомен с доступом к DNS (SPF/DKIM-записи). Бездоменные варианты (Gmail-ящик, shared-песочница) годятся только для локального dev.

### 3.4. Что маленькому приложению делать, чтобы не попасть в спам/бан (чек-лист — см. также §6)

1. Отправлять через провайдера с аутентифицированного домена (SPF+DKIM+DMARC p=none → позже quarantine/reject), From выровнен с доменом.
2. Транзакционный тип писем, только opted-in получателям (гость сам оставил email при брони) — никаких покупных баз.
3. Двойного opt-in не требуется, но email гостя валидировать (уже есть zod-валидация) + подтверждать каждое письмо ссылкой управления бронью (уже есть токены).
4. `Reply-To` — email организатора; From — `noreply@`/имя сервиса на своём домене.
5. Unsubscribe для транзакционных писем не требуется, но каждая отмена/перенос доступна в один клик по ссылке из письма.
6. Rate-limit отправки на уровне приложения (не слать пачками, ретраи с экспоненциальным backoff только на 429/5xx — как рекомендует Resend).
7. Bounce/complaint-handling: подписаться на вебхуки провайдера, не слать повторно на hard-bounce.
8. Тексты без спам-маркеров (без капса, «FREE!!!», URL-коротких ссылок), обязательно `text`-версия + `html`, корректные `Subject`/`From`, List-Unsubscribe-заголовки опционально.
9. «Прогрев» на нашем объёме не нужен (актуально от ~3000/день и для выделенных IP — нам не грозит); начинать с живых писем сразу можно.
10. Мониторинг: Postmaster Tools (Gmail) + логи провайдера (у Resend — 30 дней на всех планах).

---

## 4. Планировщик напоминаний при бесплатных ограничениях

Напоминание («за X часов до встречи») требует периодического запуска. Варианты:

| Вариант | Цена | Плюсы | Минусы | Источник |
|---|---|---|---|---|
| **A. Render Cron Job** | от **$1/мес** за job (не free) | Нативно, логи и ретраи в дашборде | Платно; минимальный Starter-рантайм. Противоречит constraint «бесплатно» | https://render.com/pricing ; https://render.com/docs/cronjobs |
| **B. GitHub Actions `schedule` → защищённый endpoint** (`POST /api/internal/reminders` с секретом в заголовке) | $0 (лимиты Actions для публичных репо — безлимит минут; для приватных — 2000 мин/мес, нам хватит) | Бесплатно; код рядом с репо; ручной запуск через `workflow_dispatch` | **Ненадёжен для точного времени:** задержки в пик нагрузки, дропы очередей; **автоотключение schedule-триггера после 60 дней без активности в репозитории** (коммиты/issues/PR; сами прогоны активностью не считаются); только UTC; будит free-сервис холодным стартом (~1 мин — для напоминаний терпимо) | Автоотключение 60 дней: https://docs.github.com/actions/managing-workflow-runs/disabling-and-enabling-a-workflow ; задержки/дропы: https://docs.github.com/actions/using-workflows/events-that-trigger-workflows («can be delayed… some queued jobs may be dropped») |
| **C. Внешний бесплатный cron** (cron-job.org — free: до 60 вызовов/час, таймаут 30 с; FastCron free: 10 jobs, интервал 5 мин) → тот же защищённый endpoint | $0 | Бесплатно; проще и надёжнее GH Actions по точности; внешний пинг заодно **не даёт Render-сервису заснуть** | Зависимость от третьего сервиса; нужен секретный токен в URL/заголовке; free-интервалы — минуты, не секунды (нам достаточно) | cron-job.org free: https://freetier.co/directory/products/cron-joborg ; FastCron free: https://www.fastcron.com/pricing |
| **D. In-process таймеры** (`setInterval` в Fastify) | $0 | Ноль инфры | **Не работает на Render Free:** сон через 15 мин простоя, рестарты в любой момент, один эфемерный инстанс — напоминания будут теряться | Сон/рестарты: https://render.com/docs/free |
| **E. «Ленивые» напоминания** (проверка due-напоминаний при каждом входящем запросе + при старте сервера) | $0 | Работает без внешнего планировщика; идемпотентный флаг `reminder_sent_at` в БД | Напоминание уйдёт только когда сервер проснётся (точность ± время до следующего визита/пинга); на ночь без трафика — задержка | Вытекает из 1.3 (нет гарантии пробуждения без входящего трафика) |

**Практическая комбинация для этого проекта:** синхронная отправка подтверждения/отмены в HTTP-хендлере (планировщик не нужен) + **E (ленивая проверка) как базовый механизм напоминаний** + **C или B как бесплатный внешний будильник** (cron-job.org каждые 10–15 мин дёргает `/health` + защищённый `/api/internal/reminders`). Точность напоминания «за 24 ч / за 2 ч» при такой схеме — ±15 мин, что приемлемо для демо. Endpoint обязан требовать секрет (`REMINDERS_SECRET`, сравнение через timing-safe) и rate-limit.

---

## 5. Dev/тест-стратегия: без реальных сетевых вызовов и без ключа = выключено

Повторить существующий CAPTCHA-паттерн (`server/captcha.ts`):

- `isEmailEnabled = () => Boolean(env.EMAIL_API_KEY)` — пока ключ не задан, отправка = no-op (возврат `{ ok: true, skipped: true }`), UI не показывает обещаний о письмах, в прод-лог — warn (как для секрета Turnstile).
- Новые env (в `.env.example` — только пустые значения, секреты — в Render Environment, по аналогии с `TURNSTILE_*`):
  - `EMAIL_PROVIDER=resend|brevo|mailjet|smtp2go|none` (дефолт `none`),
  - `EMAIL_API_KEY=` (пусто = выключено),
  - `EMAIL_FROM=` (напр. `Календарь звонков <noreply@example.com>`),
  - `EMAIL_REPLY_TO=` (email организатора),
  - `REMINDERS_SECRET=` (для внешнего cron-endpoint).
- `npm test` / CI / e2e без ключа обязаны проходить без сети:
  - юнит-тесты — in-memory транспорт (массив `sentEmails`, ассёрты на тему/получателя/токен ссылки);
  - интеграционные (`app.inject()` на PGlite) — тот же in-memory транспорт через DI, реального `fetch` нет;
  - ручной dev-предпросмотр — **Ethereal** (`nodemailer.createTestAccount()`, ссылка `getTestMessageUrl()`) либо **Mailtrap Sandbox** (флаг `sandbox: true`, домен не нужен); оба — только локально, ключи — в `.env` (в `.gitignore`).
  - Источники: Ethereal — https://ethereal.email/ , https://nodemailer.com/usage/testing-with-ethereal/ ; Mailtrap Sandbox (домен не нужен, переключение sandbox/production флагом) — https://docs.mailtrap.io/getting-started/email-sandbox , https://github.com/mailtrap/mailtrap-nodejs/blob/main/README.md.
- У Resend дополнительно есть безопасные тестовые адреса (`delivered@`/`bounced@`/`complained@resend.dev`) для проверки вебхуков без порчи репутации — но они тратят квоту.
  - Источник: https://resend.com/docs/dashboard/emails/send-test-emails.

---

## Рекомендация (ранжированная, под наши constraints)

**1-е место — Resend (HTTP API).**
Причины: самый щедрый постоянный free (3000/мес, 100/день — на порядок выше нашего объёма); HTTP API обходит блокировку SMTP Render Free; лучший Node.js-DX (официальный SDK, idempotency keys, тестовые адреса, React Email); без кредитки. Единственное условие — **нужен свой домен** (или субдомен) с доступом к DNS для SPF/DKIM. Порты 2465/2587 как запасной SMTP-путь не использовать (неподтверждённый обход блокировки Render).

**2-е место — Brevo (HTTP API).**
Причины: щедрый free (300/день), без карты, SMTP+API, Node-SDK; прощает отсутствие домена на старте (single-sender). Минусы: бейдж «Sent with Brevo» на free, слабее DX под чисто транзакционный Node.js-сценарий, для хорошей доставляемости домен всё равно нужен.

**3-е место — Mailjet (HTTP API).**
Причины: 6000/мес + 200/день бесплатно, EU-хостинг, зрелое API. Минусы: лимит 1000 контактов, логотип в письмах free, очередь при превышении дневного лимита (до 3 суток — опасно для напоминаний «вовремя»).

**Не рассматривать:** SendGrid (нет постоянного free), Postmark (100/мес — только для dev-проверки), Amazon SES (карта + сложность + нет free новым), Gmail SMTP (блок Render + риск бана аккаунта + нет своего домена).

**Открытый вопрос к пользователю (блокер): есть ли в распоряжении домен/субдомен с доступом к DNS?** Без него прод-отправка невозможна ни на одном провайдере — останется только dev-режим (Ethereal/Mailtrap) + no-op без ключа. Если домена нет — самый дешёвый путь обычно DNS у регистратора + бесплатный субдомен вида `mail.<ваш-домен>` только под SPF/DKIM.

> **Ответ (2026-09-29): домена нет** — выбран Brevo (2-е место), прод работает на верифицированном sender-е Brevo. Открытым остаётся только домен + SPF/DKIM/DMARC для доставляемости (см. чек-лист ниже). Решение — [ADR-0026](../adr/0026-email-notifications.md).

## Anti-spam checklist для реализации (обязательный)

> **Статус на 2026-09-30** сверен с реализацией ([ADR-0026](../adr/0026-email-notifications.md)).
> Выбран **Brevo** (2-е место в рейтинге ниже), потому что домена с DNS нет — Resend его требует.
> Открытым остаётся только домен/SPF/DKIM и suppression баунсов.

- [x] Отправка только через HTTP API провайдера (не SMTP-порты) — требование Render Free. → `server/email.ts`, Brevo `POST /v3/smtp/email`
- [ ] From-домен свой, верифицирован: SPF + DKIM (+ DMARC `p=none` на старте, позже `quarantine`). → **осталось**: сейчас верифицирован sender Brevo, домена нет
- [ ] DMARC-alignment From-домена с SPF/DKIM (проверить в Postmaster Tools перед продом). → зависит от домена
- [ ] DKIM-ключ ≥ 1024 бит (требование Gmail). → ключи генерирует Brevo при верификации домена/sender
- [x] `Reply-To` — email организатора; From — отдельный `noreply@`/имя сервиса (не личный ящик). → env `EMAIL_REPLY_TO`, `EMAIL_FROM`
- [x] Только транзакционные письма opted-in получателям (подтверждение, отмена, перенос, напоминание); bulk-рассылок нет. → `server/notifications.ts`, `server/reminders.ts`
- [x] Unsubscribe не обязателен для транзакционных, но каждое письмо содержит ссылку управления бронёй (отмена/перенос в 1 клик). → ссылки в шаблонах `server/email-templates.ts`
- [~] Rate-limit + ретраи с экспоненциальным backoff только на 429/5xx; идемпотентность отправки (ключ/флаг в БД, `reminder_sent_at`). → **частично**: идемпотентность есть (`bookings.reminderSentAt`), глобальный rate-limit есть; ретраев с backoff в `server/email.ts` нет
- [ ] Hard-bounce получатели — в suppression (не слать повторно); подключить вебхуки bounce/complaint провайдера. → **не сделано**, в бэклоге
- [x] В каждом письме `text`+`html` версии, честные Subject/From, без спам-маркеров; опционально `List-Unsubscribe` заголовки. → `server/email-templates.ts`, тесты `email-templates.test.ts` (8)
- [x] Без ключа провайдера отправка — no-op; dev/CI/e2e без сети (in-memory транспорт; Ethereal/Mailtrap только локально). → env `EMAIL_API_KEY`
- [x] Секрет cron-endpoint (`REMINDERS_SECRET`) + rate-limit на нём; напоминание идемпотентно (повторный вызов не дублирует письма). → заголовок `X-Reminders-Secret`, без секрета — `404`; фикс [#86](https://github.com/frostiks777/ai-for-developers-project-386/issues/86) (scoped content-type parser)
- [ ] Регистрация домена в Google Postmaster Tools + мониторинг спам-рейта (< 0.3%, цель ≤ 0.1%) и логов провайдера. → зависит от домена
