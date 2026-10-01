# AGENTS.md

## Project
Hexlet "AI for Developers" course project: **Календарь звонков** (Call Calendar) — a call booking service.
- Spec: https://files.hexlet.app/a/2ipc5m
- Repo has skeleton: backend (Fastify + PostgreSQL), frontend (React + Vite), docs.

## Critical constraints
- **DO NOT edit or delete** `.github/workflows/hexlet-check.yml` or the repo name — they drive automated Hexlet tests on every push.

## Stack
- Runtime: Node.js 22/24 (CI-матрица), локально — 26
- Language: TypeScript (strict mode)
- Bundler: Vite 6
- UI: shadcn/ui + Tailwind CSS 3.4
- API: Fastify 5 (порт 3000, vite proxy `/api`)
- БД: PostgreSQL (Neon в проде) + Drizzle ORM 0.45 (`pg`); без `DATABASE_URL` — PGlite в памяти (тесты/локальный dev). [ADR-0013](docs/adr/0013-postgres-migration.md)
- Миграции: идемпотентный `server/db/migrate.ts`, выполняется при старте сервера (не drizzle-kit)
- Валидация: zod 4 (схемы-зеркала: `server/validation.ts` ↔ `src/lib/validation.ts`)
- Контракт API: TypeSpec (`api/main.tsp`) → OpenAPI + клиентский SDK (`src/api/generated/`) + серверные типы (`server/generated/api-types.ts`); генерация — `npm run api:generate`
- Тесты: Vitest 4 + React Testing Library (фронт), `app.inject()` на PGlite (API, 21 серверный файл), контракт-тесты (`server/contract.test.ts`, ajv по OpenAPI), Playwright e2e (`e2e/`, `npm run test:e2e` — job в CI)
- Линтеры: ESLint 9 (flat config), Prettier

## Directory structure
├── src/
│   ├── components/    # UI-компоненты (в т.ч. ui/ — shadcn)
│   ├── pages/         # Маршруты/страницы (landing, home/book, my, confirmed, manage-booking, dashboard, 404)
│   ├── hooks/         # Кастомные хуки (use-availability, use-booking, use-active-host, use-theme, use-time-format, use-media-query, use-booking-view, use-turnstile)
│   ├── utils/         # Утилиты (dates, timezone, calendar, phone, my-bookings, plural, guest-message)
│   ├── types/         # UI-модели (booking, availability-settings)
│   ├── api/           # sdk.ts (инстанс ApiV1Client + call/ApiError), mappers.ts, generated/ (не править)
│   ├── config/        # host.ts (брендинг)
│   ├── lib/           # cn(), zod-схемы (validation.ts), theme-context
│   ├── test/          # setup тестов + http-хелпер
│   ├── App.tsx        # Роуты
│   └── main.tsx       # Точка входа
├── server/
│   ├── index.ts       # Точка входа: buildApp() + listen + стартовая проверка напоминаний
│   ├── app.ts         # Фабрика Fastify: /health, /api/*, /api/v1/*, статика dist/ (панель без логина, ADR-0028)
│   ├── hosts.ts       # Хосты: findHost (slug или UUID), дефолтный хост
│   ├── bookings-v1.ts # Логика броней v1 (слоты, статус, гости, идемпотентность)
│   ├── event-types.ts # Типы встреч CRUD
│   ├── time-blocks.ts # Блокировки времени
│   ├── availability.ts / availability-settings.ts / rules.ts
│   ├── captcha.ts      # Cloudflare Turnstile: verifyCaptchaToken, fail-closed (ADR-0025)
│   ├── rate-limit.ts   # Лимиты по IP + clientIpKey (CF-Connecting-IP) (ADR-0025)
│   ├── email.ts        # Brevo HTTP API: sendEmail, no-op без EMAIL_API_KEY (ADR-0026)
│   ├── email-templates.ts # Тексты писем (text+html): подтверждение/перенос/отмена/напоминание
│   ├── notifications.ts # Письма по событиям брони (гостю и организатору)
│   ├── reminders.ts    # Ленивая проверка due-напоминаний + секретный endpoint (ADR-0026)
│   ├── env.ts         # Валидация env (zod)
│   ├── validation.ts  # zod-схема API (зеркало src/lib/validation.ts)
│   ├── types.ts       # Типы API
│   ├── generated/     # Серверные типы из OpenAPI (не править)
│   ├── db/            # schema.ts (pg-core), index.ts (pg/PGlite по DATABASE_URL), migrate.ts (идемпотентные миграции)
│   └── *.test.ts      # Интеграционные тесты через app.inject()
├── api/
│   ├── main.tsp       # TypeSpec-контракт (источник истины для API v1)
│   └── tspconfig.yaml
├── e2e/               # Playwright: сквозной сценарий гостя + конфликт слотов
├── scripts/           # dev-all.mjs, api-generate.mjs, demo.sh, notify.ps1
├── docs/              # Документация проекта
│   ├── architecture.md
│   ├── conventions.md
│   ├── agent-principles.md
│   ├── spec.md         # Утверждённая спека (снимок Шага 2 курса)
│   ├── course-steps.md # Шаги курса и критерии приёмки
│   ├── model-usage.md
│   ├── email-setup-brevo.md # Настройка email-уведомлений: Brevo + Render + cron-job.org
│   ├── Структура проекта.md
│   └── Каркас приложения.md
├── docs/adr/          # Architecture Decision Records (ADR-0001, …)
├── docs/agents/       # Конфиг скиллов: issue-tracker / triage-labels / domain
├── docs/research/     # Исследования (email-notifications.md)
├── docs/design/       # Дизайн-пакеты: v1 (история) и v2 «Мята и солнце» (текущий)
├── docs/openapi/      # Сгенерированный openapi.yaml
├── docs/artefacts/    # Скриншоты и отчёты аудитов
├── public/            # Статика
├── .agents/
│   └── skills/        # 83 SKILL.md: локальные процессные + upstream-набор (в .gitignore не попадают)
├── MEMORY.md          # Долгосрочное состояние проекта между сессиями
├── skills-lock.json   # Манифест установленных скиллов (mattpocock/skills)
├── opencode.jsonc     # Конфигурация opencode (модели, MCP, субагенты)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── drizzle.config.ts  # Только для drizzle-kit (реальные миграции — server/db/migrate.ts)
├── CONTEXT.md         # Словарь проекта (единый доменный контекст)
└── AGENTS.md

## Commands
- `npm run dev` — запуск dev-сервера (Vite, :5173)
- `npm run server:dev` — запуск бэкенда (Fastify, :3000, tsx watch)
- `npm run dev:all` — оба процесса сразу (`scripts/dev-all.mjs`)
- `npm run start` — продакшн-сервер: Fastify + раздача `dist/`
- `npm run build` — продакшн-сборка (`tsc --noEmit` + `vite build`)
- `npm run preview` — предпросмотр собранного фронтенда (Vite)
- `npm run lint` — проверка ESLint
- `npm run typecheck` — проверка типов (tsc --noEmit)
- `npm test` — запуск тестов (Vitest: фронт + API + контракт)
- `npm run test:e2e` — Playwright против собранного приложения (отдельный гейт, но входит в CI job `e2e`; перед первым прогоном — `npx playwright install chromium`)
- `npm run api:generate` — регенерация OpenAPI + SDK + серверных типов из `api/main.tsp`
- `npm run db:generate` / `npm run db:push` — drizzle-kit (в проде не используются: миграции идемпотентные, `server/db/migrate.ts`, при старте)

## Conventions
- Язык проекта: русский (README, комментарии — по необходимости)
- Именование файлов: kebab-case (`user-card.tsx`)
- Именование компонентов: PascalCase (`UserCard`)
- Экспорт: именованные экспорты; дефолтные — только для страниц
- Стилизация: Tailwind CSS, избегать инлайн-стилей
- Типы: interface/type для пропсов компонентов
- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Модели: бесплатные модели для субагентов (КРИТИЧНО)

**Все субагенты обязаны использовать ТОЛЬКО бесплатные модели.** Это строгое правило проекта.

- При вызове `subagent(...)` **никогда не указывайте параметр `model` с платной моделью**
- Дефолтная модель субагентов задана в `opencode.jsonc` и является бесплатной
- Если нужно явно указать модель — используйте только бесплатные ID (провайдер `opencode`; полный список и OpenRouter — в [`docs/model-usage.md`](docs/model-usage.md)):
  - `opencode/muse-spark-1.3-contributor-free`
  - `opencode/ling-3.0-flash-fin-free`
  - `opencode/nemotron-3.5-lightning-free`
  - `opencode/mimo-v2.6-flash-free`
  - `opencode/big-pickle`
- **Запрещено**: `anthropic/*`, `openai/*` и любые другие платные модели для субагентов
- Подробнее: `docs/model-usage.md`

## Documentation
Папка `docs/` содержит теоретические принципы, архитектурные решения и операционные руководства проекта:
- `architecture.md` — архитектура приложения, структура модулей, зависимости
- `conventions.md` — детальные конвенции кодирования (стиль, паттерны, примеры)
- `agent-principles.md` — принципы работы coding-агента, управление контекстом, execution loop, надежность
- `Структура проекта.md` — теория архитектуры агентной системы (урок Hexlet)
- `Каркас приложения.md` — требования шага 2 проекта
- `model-usage.md` — правила использования бесплатных моделей для субагентов
- `code_artifact.md` — ТЗ и логика реализации (спека Hexlet)
- `todo.md` — текущий roadmap и расхождения со спекой
- `spec.md` — утверждённая спецификация (снимок Шага 2; реализация ушла вперёд, см. ADR)
- `course-steps.md` — шаги курса и критерии приёмки
- `ci_cd_render.md` — руководство по бесплатному деплою на Render.com + Neon
- `adr/` — Architecture Decision Records (см. `docs/adr/README.md`)
- `mcp.md` — подключённые MCP-серверы и правила работы с ними
- `email-setup-brevo.md` — настройка email-уведомлений: Brevo + Render + cron-job.org
- `research/` — исследования (email-notifications.md)
- `design/v2/` — текущий дизайн-пакет («Мята и солнце») и план внедрения
- `calendar_agent_spec.md` — внешняя UI/UX-спека (вход); решения — в ADR
- `archive/` — **выполненные планы и снятые документы** (не актуальны, читать только для контекста; правила — в `docs/archive/README.md`)

При внесении изменений — сверяться с документацией в `docs/`. При принятии архитектурного решения — добавить ADR (шаблон в `docs/adr/template.md`). Документ-план, который **выполнен**, переносится в `docs/archive/` вместе с шапкой-статусом, а не остаётся в `docs/` с незакрытым чек-листом.


## Coding patterns
- Все компоненты — функциональные, с типизацией пропсов
- Хуки → `src/hooks/`, утилиты → `src/utils/`
- API-вызовы → отдельный слой (`src/api/`)
- shadcn/ui компоненты хранить в `src/components/ui/`

## Agent skills

Набор инженерных скиллов [mattpocock/skills](https://github.com/mattpocock/skills) установлен в `.agents/skills/` (`npx skills@latest add mattpocock/skills --agent '*' -y`) и настроен под репозиторий через `setup-matt-pocock-skills`.

### Issue tracker

Задачи и спецификации живут в GitHub Issues этого репозитория (через `gh` CLI). См. `docs/agents/issue-tracker.md`.

### Triage labels

Канонические метки по умолчанию: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Фактически в репозитории используются также `bug` (дефекты) и `enhancement` (улучшения). См. `docs/agents/triage-labels.md`.

### Domain docs

Один контекст (single-context): `CONTEXT.md` в корне репозитория + `docs/adr/`. См. `docs/agents/domain.md`.

## Skills (OpenCode)

OpenCode-скилы — повторно используемые workflow, которые агент подгружает через `skill` tool по триггер-фразам в `description`.

- Расположение: `.agents/skills/<name>/SKILL.md`. Одна директория на скил + YAML frontmatter (`name`, `description` обязательны, `description` ≤ 1024 символов).
- Всего 83 директории: ~11 проектных процессных + upstream-набор (mattpocock/skills, tech-leads-club, tlc-*, архитектурные и т.д.). Полный список — `ls .agents/skills/`, манифест — `skills-lock.json`.
- Проектные скилы:
  - `apply-design` — внедрение редизайна v1 (история, этапы 1–7).
  - `apply-design-v2` — внедрение редизайна v2 («Мята и солнце») по `docs/design/v2/implementation-plan.md` (этапы 0–13).
  - `commit-push` — workflow для коммита и пуша (lint + typecheck + тесты → Conventional Commits → push).
  - `interview` — задаёт 3–7 уточняющих вопросов до начала работы над нетривиальной задачей.
  - `plan` — превращает задачу в атомарный пронумерованный чек-лист с проверками.
  - `ponytail` — принудительная проверка «можно ли решить без нового кода/зависимости/абстракции».
  - `tdd` — сначала failing-тест, потом минимум кода для зелёного, потом рефакторинг.
  - `telegram-bridge` — личный Telegram-мост согласований (`telegram-bot/`, в `.gitignore`): отправка через `notify.mjs`, решения из `decisions.jsonl`.
  - `verify` — финальный прогон `lint`/`typecheck`/`test`/`build` перед отметкой задачи как «готово».
- Чтобы добавить новый скил: создать `.agents/skills/<имя>/SKILL.md`; имя в frontmatter должно совпадать с именем директории.
- В этом проекте используем **только** `.agents/skills/`. `.opencode/skills/` и `.claude/skills/` больше не применять.
- Порядок применения процессных скиллов: `interview` → `plan` → (`ponytail` по ситуации) → `tdd` по ситуации → `verify` → `commit-push`.
- Подробнее — https://opencode.ai/docs/skills/.


## Agent behavior
- **Задачи и баги — только через GitHub Issue (обязательно).** Любая новая задача, фича или баг до начала работы оформляется Issue (`gh issue create`, методология — [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)); в коммит-сообщении указывается номер (`(#NN)`), после пуша Issue закрывается. Баги — с меткой `bug`; chore-подобные задачи (документация, рефакторинг, зависимости без изменения поведения) создаются **без** метки типа — метки `chore` в репозитории нет, описание — в теле Issue. Единственное исключение — однострочные механические правки без изменения поведения.
- **История коммитов — только Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, …) с номером Issue `(#NN)` в сообщении: от формата зависит `release-please` (версия + changelog). См. скилл `commit-push`.
- При изменении файлов — проверять типы (`npm run typecheck`) и линтер (`npm run lint`)
- Не коммитить без проверки: `git status` → `git diff` → `git commit`
- При работе с UI — сверяться с existing компонентами в `src/components/`
- При добавлении зависимостей — обновлять `package.json` и `package-lock.json`
- Запуск тестов перед коммитом: `npm test`
- Перед крупными изменениями — изучить соответствующий файл в `docs/`
- **Сверка с архитектурными решениями:** перед изменением схемы БД, API-контракта, аутентификации, деплоя или иного трудно обратимого решения — прочитать релевантный ADR в [`docs/adr/`](docs/adr/README.md) и `MEMORY.md`; в коммите указать, какой ADR затронут, а для нового решения — добавить ADR по `docs/adr/template.md`.

## Hygiene of context window

- **Правило 2 итераций:** если после двух последовательных неудачных правок одна и та же проверка (`npm run lint` / `typecheck` / `test` / `build`) всё ещё красная — остановиться и:
  1. Сформулировать, чем текущий подход плох (одно предложение).
  2. Сформулировать альтернативный подход (одно предложение).
  3. Спросить пользователя через `question(...)`, каким путём идти (или вернуться к скиллу `interview`).
- **Контекст не жалко.** Если диалог раздулся и прогресс нулевой — предложить `/compact` либо начать новый чат, приложив ссылку на ключевые артефакты (`AGENTS.md`, `MEMORY.md`, `docs/adr/*.md`).
- **Файлы-договорённости** — единственный долгосрочный носитель контекста между сессиями: `AGENTS.md`, `MEMORY.md`, `docs/`, `docs/adr/`. То, что не записано туда — будет утеряно при следующем `/compact`.

## Long-term memory

- Состояние проекта между сессиями — в `MEMORY.md` (корень). Обновлять при: изменении стека, критичных фиксах, решении ADR, завершении шага курса.
- Архитектурные решения — в `docs/adr/` (см. `docs/adr/README.md`): один ADR = одно решение. Шаблон — `docs/adr/template.md`.
- Перед началом крупной задачи: прочитать `MEMORY.md` → понять текущее состояние → при наличии релевантного ADR — прочитать его.
- После завершения задачи: обновить `MEMORY.md` (раздел «Что сделано» / «Ключевые решения»), при архитектурном сдвиге — добавить ADR.

## Safety gates

- **Read-only в «проде»:** если окружение помечено как production / staging (`NODE_ENV=production`, явный деплой на удалённый сервер) — агенту разрешены **только** операции чтения: `git log`, чтение файлов, `curl` к запущенному сервису. **Запрещены:** `write` в удалённые репозитории, миграции БД, удаление файлов вне `dist/`.
- **Human-in-the-loop:** ручное применение миграций к существующей БД (`npm run db:push` поверх реальных данных), force-push, изменения `.github/workflows/hexlet-check.yml` и имени репозитория, `git reset --hard` — **только по явной просьбе пользователя**. Перед выполнением — показать команду и последствия в чате.
- **Деструктивные операции** (`rm -rf`, `git push --force-with-lease`, перезапись `MEMORY.md`, удаление ADR) — всегда показывать diff/dry-run и ждать подтверждения.
- **Секреты:** никогда не писать токены/ключи/пароли в код или коммиты. Использовать `.env` + `.env.example` (последний — в репо, первый — в `.gitignore`, что уже сделано).

## Notifications to the user (Windows toast)

Пользователь просит уведомлять его системным тостом **только в двух случаях** (не «просто так»):
1. **Нужно решение пользователя** — агент упёрся в вопрос/выбор/блокер и ждёт ответа (вопрос через `question(...)`, неоднозначность, красная проверка после двух итераций и т.п.).
2. **Успешный релиз в git** — сделан push, CI/деплой «взлетел», задача доведена до конца и запушена.

Отправка выполняется скриптом `scripts/notify.ps1` (требуется UTF-8 **с BOM**, иначе PowerShell 5.1 ломает кириллицу).

Запуск:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/notify.ps1 "Заголовок" "Текст"
```

Правила:
- **Не слать на каждый шаг** и не слать просто так — только случаи 1 и 2 выше.
- **Старт работы над задачей** тостом не уведомляется — для него есть обязательное уведомление в Telegram-чат (см. «Telegram-мост»).
- Текст — короткий, по-русски, без секретов.
- Скрипт использует WinRT-тип `Windows.UI.Notifications` — его видит только `powershell.exe` (5.1); `pwsh` 7 без projection падает с «Unable to find type».

## Telegram-мост (согласования с телефона)

Личный мост в `telegram-bot/` (в `.gitignore`, в git не коммитится). Полный workflow — в скилле `telegram-bridge` (`.agents/skills/telegram-bridge/SKILL.md`).

- Отправка: `node telegram-bot/notify.mjs "Заголовок" "Текст"`; вопрос с кнопками ✅/⛔: добавить `--id <qid>`.
- Слушать ответы: `node telegram-bot/bot.mjs` (long-polling); решения падают в `telegram-bot/decisions.jsonl` (последняя строка с нужным `qid`).
- Команды с телефона: `/ping`, `/status`, `/approve <id>`, `/deny <id>` (меню регистрируется через `node telegram-bot/setup-menu.mjs`).
- Свободные вопросы пользователя из TG: `node telegram-bot/unread.mjs` (что без ответа) → ответить в чате → продублировать через `node telegram-bot/reply.mjs "текст"`.
- Автозапуск: `.opencode/plugins/telegram-autostart.js` поднимает `bot.mjs` и шлёт уведомления по событиям сессии (`session.idle` — «Агент закончил», `session.error` — «Ошибка сессии»). Тумблер в `.env`: `TELEGRAM_NOTIFY=on|off` (по умолчанию `off`). Антиспам: не чаще раза в минуту на тип события.
- **Обязательные случаи:** (1) **старт работы над задачей** — короткое «Начинаю работу: <задача, #issue>» перед первым действием по задаче; (2) блокер/решение; (3) успешный релиз. Секреты в чат не слать.
