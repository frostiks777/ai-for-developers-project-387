# TODO: план развития проекта

> **Актуальный статус — 2026-09-30.** Открытых GitHub Issues нет. Все шаги курса закрыты. Единственный
> открытый объём — «[Backlog продукта](#backlog-продукта-сверх-курса)» (регистрация/аккаунты → интеграции
> с календарями → повторяющиеся события → аналитика) плюс три мелких пункта, помеченных ⏳ ниже.
> Документы-планы, которые **выполнены**, перенесены в [`archive/`](archive/README.md) — здесь их нет.

Аудит соответствия `docs/code_artifact.md` (спека Hexlet) и текущего MVP.
Репозиторий реализует упрощённый вариант на стеке из `AGENTS.md` (Vite + Fastify + PostgreSQL/Neon + Drizzle; в тестах PGlite); отклонения от спеки зафиксированы в `docs/architecture.md` и в ADR.

## Актуальный план (обновлён 2026-09-30)

**Состояние:** редизайн v2 «Мята и солнце» завершён и влит в `main` (PR #54, #63, #67; релизы v1.20.0, v1.21.0, v1.21.2). Ветка `feat/redesign-v2-mint` смержена — новую работу начинать от свежего `main` в отдельной ветке. Мобильные правки приёмки закрыты (#56–#62, #65–#66), мобильный аудит после v2 закрыт (#49). Все шаги курса закрыты, доки синхронизированы (#72). Защита публичной записи реализована 2026-09-28 (#46, [ADR-0025](adr/0025-captcha-and-rate-limit.md)). Ревью проверяющего закрыто 2026-09-29 (#88–#93). Открытых issues на 2026-09-30 нет. Документация актуализирована (#100, [`docs/archive/`](archive/README.md)).

**Следующие шаги (в порядке приоритета):**

1. **Продуктовый backlog** (см. ниже) — начать с регистрации и аккаунтов: без разграничения владельцев дальнейшая работа (интеграции, аналитика) добавит ценность одному заранее заданному владельцу. Перед заходом — issue + `interview` + ADR по аутентификации.
2. ~~**Сменить `ADMIN_PASSWORD` в Render.**~~ — ✅ неактуально с 2026-09-29: панель открыта без логина ([ADR-0028](adr/0028-dashboard-access-without-login.md)), `ADMIN_PASSWORD` из окружения игнорируется.
3. ~~**Включить CAPTCHA в проде**~~ — ✅ выполнено: `TURNSTILE_*` заданы в Render (подтверждено пользователем 2026-09-29).
4. ~~**«Перенести» у прошедших встреч**~~ — ✅ исправлено 2026-09-29: кнопка была в `src/pages/my-bookings-page.tsx` (не в панели) — скрыта у прошедших, «Убрать» оставлена, тест обновлён.
5. **SSL-режим драйвера `pg`**: ✅ закрыт 2026-09-28 — режим нормализуется в `server/env.ts`, предупреждения в логах нет ([Backlog](#backlog-новые-задачи)). ⏳ Перепроверить после апгрейда `pg` до v9 (`pg` v9 не выпущен, latest 8.23.0).

**Разобрано 2026-09-28 (не требует действий):** «суббота в переносе» из [#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76) — оказалось, в правилах доступности хоста были включены суббота/воскресенье, поэтому слоты (и дни) генерировались для них, и страница переноса вела себя правильно. Врёт было превью недели: там был захардкожен список Пн–Пт, теперь колонки берутся из правил.


> ✅ **Визуальная приёмка редизайна v2 «Мята и солнце» пройдена 2026-09-28** — проверено человеком вручную, расхождений не найдено (ADR-0023, `docs/design/v2/`). Пункт снят с плана.

## Критерии приёмки проекта — статус (проверяет наставник + hexlet-check)

Легенда: ✅ done · 🟡 partial · ❌ missing. Источник — `docs/course-steps.md`.

### Функциональность

- ✅ Сквозной сценарий: тип встречи → календарь → слот → запись → подтверждение (`event_types` → slots → `POST /api/v1/.../bookings` + UI; e2e Playwright)
- ✅ Занятый слот не бронируется повторно + сообщение о конфликте (partial unique index + `409 SLOT_TAKEN`, в т.ч. для другого типа)
- ✅ Правила бронирования выполняются на сервере (`minNotice`, генерация, проверка в `POST /api/bookings` и v1)
- ✅ Страница владельца со встречами всех типов в одном списке (`/dashboard`, `GET /api/v1/hosts/:slug/bookings`)
- ✅ API по контракту: OpenAPI из TypeSpec → клиентский SDK + серверные артефакты (`api/main.tsp`, `docs/openapi/openapi.yaml`, `src/api/generated/`, `server/generated/api-types.ts`, `npm run api:generate`)
- ✅ Окно записи 14 дней, слоты по 30 минут (`ADR-0004`)
- ✅ Docker-образ, авто-старт, порт из `PORT`, ссылка в `README.md` (`render.yaml`, `calendar-slots-app.onrender.com`)

### Проверяемость

- ✅ Тесты + линтер в GitHub Actions, `main` зелёный (`ci.yml`)
- ✅ Тесты покрывают сценарий бронирования и конфликт слотов (интеграционные + `409` + контракт-тесты `ajv` + e2e Playwright); требования к покрытию Шага 3 — в `docs/spec.md` §7, решение — [ADR-0012](adr/0012-contract-tests-and-e2e.md)
- ✅ Conventional Commits, release-please создаёт release-PR (`release-please.yml`; версия на 2026-09-30 — 1.24.1, релиз собирается автоматически в PR `main` → `release-please/*`)
- ✅ Секретов в репозитории нет (`.env` в `.gitignore`, `.env.example`)

### Настройка агентной разработки

- ✅ `AGENTS.md` с командами запуска/тестов/линтера и правилом про коммиты
- ✅ `docs/agents/` с конфигурацией трекера (`issue-tracker.md`, `triage-labels.md`, `domain.md`)
- ✅ Конфигурация MCP-серверов в репозитории (`opencode.jsonc` → `mcp`, `docs/mcp.md`)

### Следы работы по скиллам

- ✅ В Issues есть карта решений с закрытыми задачами и ответами ([#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) + #11–#18)
- ✅ В Issues есть спецификация приложения и тикеты с зависимостями (`docs/spec.md`; тикеты #11–#18 с `blocked_by`)
- ✅ `CONTEXT.md` со словарём проекта (Шаг 1; ADR-0001…ADR-0011)
- ✅ Тикеты ссылаются на спецификацию, коммиты — на тикеты (T1–T9, #19–#27; коммиты ссылаются на номера тикетов)

**Итог:** Шаг 3 завершён — спецификация реализована и сверена с контрактом (тикеты #19–#27 закрыты).

## Сделано

- [x] Каркас: Fastify `:3000` (`/health`, `/api/slots`, `/api/bookings`), Vite, линтер, тесты, CI
- [x] SQLite + Drizzle (`slots`, `bookings`) и сидирование 8 слотов
- [x] `POST /api/bookings`: `400/404/409/201`; `GET /api/slots` с `isBooked`
- [x] UI: список слотов (loading/error/empty), кнопка «Забронировать»/«Занято»
- [x] Диалог брони: имя + телефон, блокировка submit, сброс полей
- [x] Тосты sonner, `ApiError`, хуки `use-availability` / `use-booking`
- [x] Типы синхронизированы фронт/бэк, 6 тестов, `hexlet-check.yml` не тронут
- [x] Обязательный `email`: форма (zod, inline-ошибка), API (`422` с сообщением), БД (`ALTER TABLE` при старте). [ADR-0002](adr/0002-zod-api-validation.md)
- [x] Валидация телефона: только цифры и разделители, 10–15 цифр (zod, inline-ошибка на фронте, 400 на бэке)
- [x] Фильтр прошедших слотов: SQL `startAt >= now`, фильтр в `useAvailability`, `400` при попытке брони на прошедший слот
- [x] Ре-сид слотов, когда будущих слотов не осталось
- [x] Интеграционные тесты API: `buildApp()` + `app.inject()` на in-memory БД (`server/app.test.ts`)
- [x] Починен CI: vitest `3.2.7 → 4.1.11` (устранён `Channel closed`, vitest#8201) + матрица Node `[22, 24]` (Node 20 EOL)
- [x] `GET /api/bookings`: брони с данными слота (`BookingWithSlot`), сортировка по `startAt`, 2 интеграционных теста
- [x] README: стек, установка, запуск, env, примеры API; добавлен `.env.example` (asciinema — заглушка, запись за автором)
- [x] Race condition закрыт: частичный уникальный индекс по `slotId` (в SQLite — `UNIQUE`, сейчас PostgreSQL — `UNIQUE(slotId) WHERE status != 'cancelled'`), `409` через перехват `23505`; [ADR-0003](adr/0003-unique-slot-booking.md)
- [x] Экран успеха: `BookingSuccess` («Встреча успешно запланирована!», дата/время, длительность, имя, email, кнопка «Выбрать другое время»); `useBooking` возвращает `Booking`, 2 RTL-теста
- [x] Поле «комментарий»: колонка `comment` (nullable + ALTER), zod `max(500)` (на старте было 1000) с пустым → `null`, Textarea в форме, `comment` в `POST`/`GET /api/bookings`
- [x] Месячная сетка календаря: `MonthCalendar` (навигация по месяцам, метки дней со слотами, прошедшие/пустые дни недоступны), фильтр списка по выбранному дню на клиенте (`src/utils/dates.ts`); 3 теста компонента + интеграционный. API `?date=` отложен к генерации слотов/таймзонам
- [x] Генерация слотов по правилам: `server/availability.ts` (будни, окно 10:00–18:00 UTC, шаг «длительность 30 + буфер 10», minNotice 120 мин, горизонт 14 дней), сид через `generateSlotStarts`, `GET`/`POST` учитывают minNotice; [ADR-0004](adr/0004-slot-generation-rules.md); 4 unit + 2 API-теста
- [x] Таймзоны: хранение в UTC (ISO) уже было; клиент отображает и группирует по дням в выбранном поясе — `src/utils/timezone.ts` (`toDateKeyInZone`, `formatDateTimeInZone`, `timeZoneOptionLabel`), `TimeZoneSelect` (browser TZ по умолчанию, популярные пояса), сквозная передача `timeZone` в Calendar/Dialog/Success; 4 unit + 2 RTL-теста
- [x] Телефон опциональный (по спеке): zod `optional` + `refine` (пустой → не задан), колонка `phone` nullable (миграция-пересборка таблицы для старых БД), `phone: string | null` в контракте, пометка «необязательно» в форме, телефон в экране успеха только если указан; 2 API + 1 RTL-тест
- [x] Убран ESLint warning в `src/components/ui/button.tsx`: `buttonVariants` больше не экспортируется (внутренний, потребителей нет) → `react-refresh/only-export-components` чист
- [x] `/dashboard` организатора: `react-router-dom` (`/` и `/dashboard`), список броней (`BookingsTable`) + отмена (`DELETE /api/bookings/:id`, `204/404/400`), настройки доступности (`AvailabilityForm`) поверх `availability_rules` (одна строка `id=1`) + `GET/PUT /api/availability`; `server/rules.ts` (`load`/`save`/`regenerateFutureSlots` — занятые слоты не трогаются); `minNotice` читается из правил; [ADR-0005](adr/0005-dashboard-availability-and-cancellation.md); 7 API + 6 RTL-тестов
- [x] Экспорт брони в календарь (Экран 3): `src/utils/calendar.ts` (`buildIcs`, `googleCalendarUrl`, `downloadIcs`), кнопки «Скачать .ics» и «Добавить в Google Календарь» на экране успеха; 3 unit + 1 RTL-теста. Ссылка отмены — отложена (токен/API)
- [x] Отмена брони по токену-ссылке (Экран 3): колонка `bookings.cancelToken` (nullable+unique), токен `randomUUID` в ответе на создание, `POST /api/bookings/cancel` (`204/404/400`), ссылка `${origin}/cancel/:token` с копированием на экране успеха, страница `/cancel/:token`; [ADR-0006](adr/0006-cancellation-by-token.md); 4 API + 3 RTL-теста
- [x] Перенос брони по токену (Экран 3): `GET /api/bookings/by-token/:token`, `POST /api/bookings/reschedule` (`UPDATE slotId`; `200/400/404/409`), страница `/reschedule/:token` с календарём и свободными слотами, ссылка «Перенести» на экране успеха; [ADR-0008](adr/0008-reschedule-by-token.md); 6 API + 2 RTL-теста
- [x] `422` вместо `400` на невалидное тело (по спеке): zod-ошибки в `POST /api/bookings`, `POST /api/bookings/cancel`, `PUT /api/availability` → `422 Unprocessable Entity`; бизнес-ошибки (прошедший слот, `minNotice`, некорректный `:id`) остаются `400`; тесты и доки обновлены
- [x] Хосты + версионированный API v1 (Low, аддитивно): таблица `hosts` (UUID PK, unique slug), сид дефолтного хоста, `GET /api/v1/hosts/:slug/settings` и `GET /api/v1/hosts/:slug/slots?date=&timezone=` (`404` неизвестный slug, `400` дата/пояс); `/api/*` не тронут; [ADR-0009](adr/0009-hosts-and-api-v1.md); 7 API-тестов
- [x] Визуальный редизайн A + D и светлая/тёмная тема, этапы 1–7 ([ADR-0007](adr/0007-visual-redesign-and-themes.md)): 1 — токены/шрифты/тема (`ThemeProvider`, `ThemeToggle`, `useMediaQuery`, анти-флеш-скрипт); 2 — десктоп-раскладка бронирования; 3 — мобильная раскладка (`date-strip.tsx`, `booking-bar.tsx`); 4 — рестайл диалога брони; 5 — рестайл экрана успеха; 6 — редизайн панели организатора (`dashboard-sidebar.tsx`, `bookings-list.tsx`, `booking-filter.tsx`, `availability-form.tsx`); 7 — документация (данный этап)
- [x] **Шаг 1 курса**: `CONTEXT.md` (словарь проекта), [ADR-0010](adr/0010-landing-and-booking-routes.md); главная `/` — новый `LandingPage`, бронь переехала на `/book/:slug`, фронт брони на API v1 (`fetchHostSettings`/`fetchHostSlots`), `NotFoundPage`; ссылки дашборда/отмены/переноса обновлены; 3 теста лендинга + обновлены `App`/`home-page` (`src/App.test.tsx`, `src/pages/landing-page.test.tsx`)
- [x] **Шаг 2 курса** (проектирование бронирования): карта решений [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) с тикетами #11–#18 (все закрыты); спецификация `docs/spec.md`; TypeSpec-контракт `api/main.tsp`; [ADR-0011](adr/0011-event-types-status-and-availability-ranges.md); генерация одной командой `npm run api:generate` → `docs/openapi/openapi.yaml`, `src/api/generated/` (SDK), `server/generated/api-types.ts`
- [x] **Шаг 3, T1–T7** (реализация): миграции, типы встреч, диапазоны доступности, слоты по типу/дате, жизненный цикл брони, отмена/перенос по публичному id v1; фронт переведён на сгенерированный SDK ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)) — ручной `src/api/client.ts` удалён, добавлены `src/api/sdk.ts` (клиент + `call()`/`ApiError`) и `src/api/mappers.ts`

- [x] **«Мои встречи» на устройстве** — [ADR-0019](adr/0019-my-bookings-on-device.md): бронь сохраняется в `localStorage`, страница `/my` с отменой/переносом и удалением; вкладка в шапке на всех публичных страницах. Закрывает сценарий «гость не скопировал ссылку».

## Осталось

### Blocker приёмки (шаги курса, [docs/course-steps.md](course-steps.md))

1. ~~**Шаг 1** — `CONTEXT.md` + интервью по главной (`grill-with-docs`) + ADR + `/implement`~~ ✅ **выполнено 2026-09-24**: `CONTEXT.md`, [ADR-0010](adr/0010-landing-and-booking-routes.md), лендинг `/`, бронь `/book/:slug`
2. ~~**Шаг 2** — карта решений (`wayfinder`) → `to-spec` → `to-tickets`; Design First: TypeSpec → OpenAPI → SDK + серверные артефакты~~ ✅ **выполнено 2026-09-24**: карта #10, `docs/spec.md`, `api/main.tsp`, `npm run api:generate`
3. ~~**Шаг 3** — реализация тикетов через `/implement`, фронт через сгенерированный SDK, Playwright на сквозной сценарий~~ ✅ **выполнено 2026-09-24**: T1–T9 (SQLite-миграции, `event_types`/`status`/`availability_ranges`, слоты/брони v1, SDK-миграция фронта, контракт-тесты + e2e Playwright, сверка со спецификацией); коммиты по тикетам #19–#27, все закрыты
4. ~~Ввести сущность «тип встречи» (event-types)~~ ✅ **выполнено**: `event_types` + API v1 + интерфейс владельца ([#21](https://github.com/frostiks777/ai-for-developers-project-386/issues/21))

### UI-доработки

- [x] **Кнопка «Блокировки» в левом меню организатора (`/dashboard`, `src/components/dashboard-sidebar.tsx`):** в сайдбаре есть «Встречи» (текущий), «Типы встреч», «Доступность» — пункта «Блокировки» нет, хотя секция `id="blocks"` на странице присутствует (`src/pages/dashboard-page.tsx:153`). Добавить ссылку по образцу «Типы встреч»/«Доступность» (`scrollToSection` + иконка, напр. `CalendarOff`), добавить `BLOCKS_SECTION_ID = 'blocks'`; тест в `src/components/dashboard-sidebar.test.tsx`.
- [x] **Аудит корректности кнопок левого меню организатора:** проверить, что каждый пункт сайдбара (`Встречи`, `Типы встреч`, `Доступность`, + будущие `Блокировки`) реально скроллит/переключает нужную секцию и не «ломается» при отсутствии элемента (мобильная раскладка использует табы, а не сайдбар — сверить, что десктоп-сайдбар скрыт на мобиле). Зафиксировать найденные баги отдельными пунклами.

### Редизайн блока «Доступность» (инструкция — [`archive/Инструкция по редизайну блока Доступность.md`](<archive/Инструкция по редизайну блока Доступность.md>), все пункты выполнены)

> Внешняя спека (Calendly/Cal.com-паттерны). Сверка с текущим `src/components/availability-settings-form.tsx`.

- [x] **Несколько интервалов в день** — ✅ уже есть: кнопка «Добавить интервал» + удаление по иконке-крестику.
- [x] **Однострочный лейаут дня** — ✅ частично: строка `[чекбокс][Пн][start]–[end][✕]` уже одна линия; интервалы дня идут друг под другом.
- [x] **Перевести чекбоксы в Switch/тоггл** (§3, §7): нативный `input[type=checkbox]` заменён на `role="switch"` (`aria-checked`, `aria-label="Пн: доступность"`).
- [x] **Иконка `+` вместо текста «Добавить интервал»** (§3, §7): кнопка-иконка `Plus` (`aria-label="Добавить интервал: Пн"`); новый интервал ставится после последнего с не пересечением.
- [x] **Кнопка «Копировать» интервал дня** (§3, §7): иконка `Copy` + `Dialog` выбора целевых дней (Bulk copy); копия заменяет интервалы выбранных дней.
- [x] **Быстрые пресеты (Preset Chips)** (§4, §7): `Пн–Пт 10:00–18:00`, `Пн–Пт 09:00–18:00`, `Каждый день 10:00–20:00`, `Очистить всё`.
- [x] **Индикатор таймзоны в шапке карточки** (§2, §7): строка «Часовой пояс: <IANA>» с иконкой `Globe`.
- [x] **Real-time валидация** (§5): хронология (`start < end` → красный бордер + подсказка), пересечение интервалов одного дня, мин. длительность по `slotDurationMin`; кнопка «Сохранить» блокируется.
- [x] **Информационная подсказка о пересечении слотов** в подвале (§2, §4): «Интервалы одного дня не должны пересекаться».
- [x] **Undo для пресетов** (§4): применение пресета показывает toast с кнопкой «Отменить».
- [x] **Учесть маршрут `/admin/availability`** (из P1-дашборда): `DashboardPage` принимает `initialSection`, маршруты `/admin/{availability,event-types,bookings,blocks}` открывают нужную секцию (на десктопе — прокрутка к `#id`, на телефоне — стартовый таб).

### UI-баг: обрезка списка слотов на странице бронирования (`/book/:slug`)

> Колонка со слотами (правая, «Пятница, 25 сентября») по высоте выше карточки: нижний слот срезается, при скролле прячется верхний (заголовок и первый слот). Причина — список слотов растягивает колонку, а прокрутка происходит всей страницей/карточкой, а не внутренним списком.

- [x] **Цель: список слотов помещается в колонку целиком** — сетка слотов должна ужиматься по доступной высоте карточки (без обрезки снизу и без уезжающего верха), заголовок дня остаётся видимым. ✅ **выполнено** (коммиты `4e4ddb6`, `edb3dc7`): колонка правого списка `flex min-h-0 flex-col`, список `flex-1 min-h-0 overflow-y-auto`, сетка календаря вписана в высоту.
- [x] **Фолбэк, если целиком не влезает:** внутренний скролл **только внутри списка слотов**, в стиле страницы (тонкий/скрытый нативный скроллбар, как в остальном UI) — контейнер списка `flex-1 min-h-0 overflow-y-auto`; скроллится список, а не вся страница/карточка. Последний слот доступен, заголовок не уезжает.
- [x] Компонент — `src/components/slot-grid.tsx` (или колонка в `home-page.tsx`). Тест: RTL-смоук на `overflow-y-auto` у контейнера списка; визуальная проверка на 1280×820 и 390×844, обе темы. ✅ реализовано в `home-page.tsx:249-292` (`scrollbar-none` + внутренний скролл); визуальная проверка — за автором при следующем прогоне.

### Из Gemini-спеки (`docs/calendar_agent_spec.md`)

> Эталон от Gemini — упрощённый (без типов встреч, часового пояса, телефона/комментария, отмены/переноса). Полное выравнивание **отклонено**: сохраняем утверждённый редизайн A/D ([ADR-0007](adr/0007-visual-redesign-and-themes.md)) и API `/api/v1`. Берём только функционально недостающее.
> Сверка: S1 Landing / S2 Slot Selection / S3 Contact Form / S4 Success — уже есть (наша реализация); S2-панель «Свободно»/«Длительность» покрыта `freeCount`/`durationMin`.

- [x] **Экран «Предстоящие события» (S5):** был реализован как публичная страница `src/pages/events-page.tsx` (`/events`) на `GET /api/v1/hosts/:slug/bookings`. **Отменён в этапе 1 редизайна v2**: контакты гостей стали приватными ([ADR-0022](adr/0022-private-bookings-list.md)) — `GET .../bookings` убран из публичного доступа, `/events` отвечает `302` на `/admin/bookings`, страница и вкладка удалены. Список встреч живёт в панели организатора.
- [x] **Табы в шапке «Записаться / Предстоящие события»** — `AppHeader` получил проп `tabs` (pill-навигация, `aria-current`); после v2 вкладка «Предстоящие события» заменена на «Мои встречи» (`/my`).

### Low

- [x] **Полная мульти-хост-модель** — [ADR-0018](adr/0018-multi-host-model.md): `hostId` в `slots`/`bookings` (+бэкфилл), генерация слотов per-host, `findHost` по slug **или** UUID, `GET/POST /api/v1/hosts`, scoped `/api/v1/hosts/:ref/{slots,bookings}`, публичный `/book/:uuid`. Per-host скаляры расписания и UI управления хостами закрыты позже ([ADR-0020](adr/0020-per-host-availability-rules.md), [ADR-0021](adr/0021-active-host-and-hosts-ui.md)).
- [x] **Авторизация `/dashboard`** — ⚠️ **Superseded**: [ADR-0017](adr/0017-dashboard-basic-auth.md) (Basic-auth через `ADMIN_PASSWORD`) заменён 2026-09-29 на [ADR-0028](adr/0028-dashboard-access-without-login.md) — панель и админские API **открыты без логина**, `ADMIN_PASSWORD` игнорируется. Первоначально гейт закрывал и список броней ([ADR-0022](adr/0022-private-bookings-list.md)); после ADR-0028 контакты гостей снова видны в панели — это осознанное последствие.
- [x] **Баг:** ссылка «Доступность» в сайдбаре `/dashboard` не скроллила к секции — исправлено: `onClick` + `scrollIntoView({behavior:'smooth'})` + `history.replaceState('#availability')` в `src/components/dashboard-sidebar.tsx`; тест `src/components/dashboard-sidebar.test.tsx`

### Остаток Low из [ADR-0018](adr/0018-multi-host-model.md) — per-host скаляры расписания — [#41](https://github.com/frostiks777/ai-for-developers-project-386/issues/41) ✅

> Решения приняты 2026-09-25 (интервью). **В этот заход — только скаляры, без UI хостов.** ✅ выполнено 2026-09-25, [ADR-0020](adr/0020-per-host-availability-rules.md).
> Проблема: `availability_rules` — одна глобальная строка (`id=1`), `loadAvailabilityRules()`/`saveAvailabilityRules()` игнорируют `hostId`. Поэтому `minNoticeMin`, `bufferBefore/AfterMin`, `horizonDays`, `slotDurationMin` были общими для всех хостов, хотя `availability_ranges` (диапазоны дней) уже per-host.

**Решения (интервью):**
- **Объём этого захода:** только per-host скаляры. UI управления хостами (селектор/список/создание) — отдельным заходом.
- **Выбор активного хоста в панели (на будущее):** dropdown в шапке панели из `GET /api/v1/hosts` + сохранение в `localStorage`; все секции панели скоупятся выбранным хостом. Сейчас панель хардкодит `host.slug='default'` (`src/config/host.ts`).
- **Миграция правил:** бэкфилл существующей строки `id=1` на дефолтный хост + `UNIQUE(hostId)`; новым хостам при создании сидируются `defaultAvailabilityRules`.
- **Критерий «готово»:** API-тесты на изоляцию правил по хостам + `npm run lint` / `typecheck` / `test` / `build` зелёные.

**Чек-лист:**
- [x] `server/db/schema.ts`: `UNIQUE(hostId)` на `availability_rules` (индекс `availability_rules_hostId_unique`).
- [x] `server/db/migrate.ts`: бэкфилл `hostId` на дефолтный хост → `SET NOT NULL` → `CREATE UNIQUE INDEX IF NOT EXISTS`; удаление legacy-колонки `id`.
- [x] `server/rules.ts`: убран `RULES_ID`; `loadAvailabilityRules(hostId)` / `saveAvailabilityRules(hostId, rules)` через upsert по `hostId`.
- [x] `server/availability-settings.ts`: `hostId` прокинут в load/save правил.
- [x] `server/db/index.ts`: сид будущих слотов дефолтного хоста — по его правилам.
- [x] `server/app.ts`: `minNoticeMs(hostId)` во всех проверках слотов; легаси `GET/PUT /api/availability` работают с правилами дефолтного хоста.
- [x] `POST /api/v1/hosts`: новому хосту сидируются `defaultAvailabilityRules`.
- [x] Тесты изоляции: `server/host-availability.test.ts` (4) — горизонт/minNotice per-host, изменение одного хоста не трогает другой, сид дефолтов, легаси-роут.
- [x] `npm run lint` + `typecheck` + `test` (223/223) + `build`.

**Сделано (2026-09-25, [#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42), [ADR-0021](adr/0021-active-host-and-hosts-ui.md)):** UI управления хостами — селектор в шапке панели (`localStorage`), список/создание хостов (секция «Организаторы» + `/admin/hosts`), скоупинг всех секций панели по выбранному хосту, `host.slug` из конфига → динамический (весь фронт через `useActiveHost`).

## Backlog (новые задачи)

- [x] **Защита от ботов (CAPTCHA) в окне брони** — [#46](https://github.com/frostiks777/ai-for-developers-project-386/issues/46) ✅ 2026-09-28: **Cloudflare Turnstile** (Free, Managed/Visible), **показывается всегда**; выключена, пока не задан `TURNSTILE_SECRET_KEY` (dev/test/e2e не зависят от внешнего сервиса); site key отдаёт `GET /api/v1/hosts/:slug/settings` (`captcha: CaptchaSettings`); серверная проверка в `POST .../bookings` — порядок «реплей по `Idempotency-Key` → zod → CAPTCHA → слоты», fail-closed; легаси `POST /api/bookings` тоже защищён; `RateLimit`-плагин (`@fastify/rate-limit` ≥10): 20/мин запись, 300/мин чтения, 600/мин глобально, ключ — `CF-Connecting-IP` → `request.ip`, `trustProxy: true`. Коды `CAPTCHA_FAILED`/`RATE_LIMITED` добавлены в `api/main.tsp` → OpenAPI + SDK. Тесты: `server/captcha.test.ts` (11), `server/rate-limit.test.ts` (5); [ADR-0025](adr/0025-captcha-and-rate-limit.md).
- [x] **Панель и перенос: превью недели, суббота, перенос прошедшей встречи** — [#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76) ✅ 2026-09-29: превью растянуто, дни из правил, отступ снят, «Перенести» у прошедших убран (в `/my` — в панели переноса нет), суббота разобрана (в правилах хоста были выходные).
- [x] **SSL-режим драйвера Postgres (`pg`)** ✅ разобран 2026-09-28 (см. [#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)). Предупреждение `SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'` печатает `pg-connection-string@2.14.0` только из-за наличия `sslmode=require` в строке подключения. **Проверено живым соединением** с Neon (все варианты реально подключились, не только разбор строки):

  | `sslmode` | конфиг клиента | результат |
  |---|---|---|
  | `require` (было) | `ssl: {}` | подключается, **печатает предупреждение** |
  | **`verify-full`** | `ssl: {}` | подключается, **предупреждения нет** — поведение идентичное |
  | `uselibpqcompat=true&require` | `ssl: {rejectUnauthorized: false}` | подключается без ворнинга, но **слабее** (без проверки сертификата) |
  | без `sslmode` | TLS выключен | `28000 connection is insecure` |

  **Решение:** нормализовать режим у себя, в `server/env.ts` (`normalizeSslMode`): любой входящий `sslmode` (в том числе `require`, который по умолчанию кладут Neon и Render) заменяется на `verify-full`. Ручная правка строки подключения **не нужна и невозможна** — её формируют Neon и Render. Правка сделана аккуратно: меняется только значение параметра, без пересборки через `new URL()`, иначе пароль в строке перекодировался бы и доступ к БД пропал бы. Обновлены `.env.example`, `docs/ci_cd_render.md`; 7 тестов — `server/env.test.ts`. Проверено на живой БД: сервер поднимается и подключается, предупреждения в логах нет. Перепроверить после апгрейда `pg` до v9 — там `require` станет вести себя как в libpq.

- [x] **Апгрейд `@fastify/static` 8.3.0 → 10.1.5** (2026-09-29, [#99](https://github.com/frostiks777/ai-for-developers-project-386/issues/99)) — `high`-находка `npm audit` (path traversal GHSA-83w8-p2f5-377r) закрыта. Правок кода не потребовалось (единственное ломающее изменение v10 — `setHeaders`, не используется), e2e 3/3, раздача `dist/` идентична baseline. Добавлен `server/static.test.ts` (5 тестов), в CI `Build` перенесён перед `Test`. Остаётся только `esbuild` 0.18.20 (moderate через `drizzle-kit` → `@esbuild-kit/*`) — dev-only, вне контейнера. Решение и анализ — [ADR-0029](adr/0029-audit-fastify-static-upgrade-deferred.md).

- [x] **Актуализация документации** (2026-09-30, [#100](https://github.com/frostiks777/ai-for-developers-project-386/issues/100)) — выполненные планы и снятые документы перенесены в [`docs/archive/`](archive/README.md) (`ai-tuning-plan.md`, `archi-scheme.md`, `ci_cd.md`, внешний бэклог Gemini, инструкция по редизайну «Доступности», `roadmap.html`); у каждого — шапка-статус, в архиве — `README`-канон. Ссылки обновлены в `AGENTS.md`, `MEMORY.md`, `README.md`, ADR и `ci_cd_render.md`, битые ссылки в `docs/design/v2/adr/*` исправлены. Вычищены устаревшие утверждения: Basic-auth/`ADMIN_PASSWORD` в живых доках (заменено на [ADR-0028](adr/0028-dashboard-access-without-login.md)), e2e-порт 3100 → 3210 в `README.md`, версия релиза в критериях приёмки, файловый снимок в `MEMORY.md` вынесен в архив. `MEMORY.md` и этот файл пересобраны по факту на 2026-09-30.


### Backlog: редизайн v2

> Старт 2026-09-28 (ветка `feat/redesign-v2-mint`, issue [#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)):
> пакет дизайна перенесён в `docs/design/v2/`, ADR-0022…0024 лежат в `docs/adr/` (Proposed),
> скилл `apply-design-v2` — в `.agents/skills/`. Этап 0 выполнен.
> **Завершено 2026-09-28:** этапы 0–13 влиты в `main` (PR #54), issue #48 закрыт; мобильные правки приёмки — PR #63, #67.

- [x] **Этап 0 — подготовка** — ветка `feat/redesign-v2-mint`, пакет в [`docs/design/v2/`](design/v2/), ADR-0022…0024 в [`docs/adr/`](adr/) (Proposed), скилл `apply-design-v2` в `.agents/skills/` и в `AGENTS.md`.
- [x] **Этап 1** — контакты гостей не в публичном разделе ([ADR-0022](adr/0022-private-bookings-list.md)): публичная страница `/events` удалена, редирект `302` на `/admin/bookings`; после [ADR-0028](adr/0028-dashboard-access-without-login.md) список броней доступен в панели без логина.
- [x] **Этап 2** — баги времени: `formatWeekdayShort` (дни недели в ленте), пояс гостя при отмене (`formatZoneShort`).
- [x] **Этап 3** — токены, живой фон, стеклянные поверхности, шапка (`ambient-background`, `app-shell`, `glass-bar`, `formatZoneShort`).
- [x] **Этап 4** — десктоп «Дни» (A): `event-type-picker`, `two-week-grid`, `slot-groups`, `booking-form`, `timezone-card`; форма в колонке, без автовыбора слота.
- [x] **Этап 5** — вид «Неделя» (B): `view-toggle`, `use-booking-view`, `week-grid`.
- [x] **Этап 6** — мобильный мастер C1–C3: `booking-wizard`, `day-list`, `day-switcher`, `booking-bar`.
- [x] **Этап 7** — экран подтверждения C4: рестайл `booking-success`, ссылки переноса/отмены, «Скопировать ссылку».
- [x] **Этап 8** — конфликт 409: сохранение полей, `slot-suggestions`, toast убран.
- [x] **Этап 9** — страница управления встречей M: `manage-booking-page` (перенос + отмена), старые страницы объединены.
- [x] **Этап 10** — панель: разделы-экраны, «Обзор» (`dashboard-overview`), раскрытие строк, «Скопировать текст для гостя».
- [x] **Этап 11** — доступность и пояс ([ADR-0024](adr/0024-slots-in-host-timezone.md)): генерация слотов в поясе хоста, широкие поля времени, `availability-preview`.
- [x] **Этап 12** — лендинг и «Мои встречи»: имя организатора без дубля, одна CTA `bg-highlight`, блок «Форматы встречи» (`/book/:slug?type=…`), карточки `glass`.
- [x] **Этап 13** — документация: ADR-0022…0024 → Accepted, ADR-0007 дополнен ADR-0023, `docs/design/README.md` (v2 — текущий, v1 — история), «Отклонения» в `docs/design/v2/README.md`; `MEMORY.md`/`docs/todo.md`/`README.md` синхронизированы. Визуальная приёмка — за человеком.
- [x] **ADRs v2** — [`docs/adr/`](adr/): 0022 (private-bookings-list), 0023 (redesign-v2-mint), 0024 (slots-in-host-timezone) — **Accepted** 2026-09-28.
- [x] **Макеты/скриншоты v2** — `docs/design/v2/{mockups,screenshots,current}/`: визуальная приёмка пройдена человеком 2026-09-28, расхождений нет (см. «Актуальный план»).
- [x] **Архив v1** — [`docs/design/`](design/): v1-пакет сохранён как история, в `docs/design/README.md` помечено, что текущий дизайн — v2 ([ADR-0023](adr/0023-redesign-v2-mint.md)).

## Ключевые расхождения со спекой (закрыты)

> Целевое состояние зафиксировано в утверждённой спецификации `docs/spec.md` (Шаг 2). Ниже — расхождения кода **на конец Шага 2**, которые закрыты на Шаге 3 и позже. Актуальное состояние описано в [`docs/architecture.md`](architecture.md) и ADR; новые расхождения не накапливаются здесь.

1. ~~**Схема БД**: нет `event_types`, `bookings.status`/`eventTypeId`, `availability_ranges`~~ ✅ **закрыто**: `server/db/migrate.ts` (идемпотентные миграции), [ADR-0011](adr/0011-event-types-status-and-availability-ranges.md); позже — PostgreSQL ([ADR-0013](adr/0013-postgres-migration.md)), `time_blocks` ([ADR-0014](adr/0014-time-blocks.md)), per-host правила ([ADR-0020](adr/0020-per-host-availability-rules.md)).
2. ~~**API**: `/api/v1` реализован частично~~ ✅ **закрыто**: реализованы все операции `api/main.tsp` (хосты, слоты, типы встреч, доступность, брони, блокировки, отмена/перенос по id), контракт покрыт `server/contract.test.ts` ([ADR-0012](adr/0012-contract-tests-and-e2e.md)). Легаси `/api/*` сохранён; админские операции открыты (Basic-auth снят в [ADR-0028](adr/0028-dashboard-access-without-login.md)).
3. ~~**Форма**: нет `guests`/согласия/`Idempotency-Key`~~ ✅ **закрыто**: [ADR-0015](adr/0015-booking-guests-consent-idempotency.md).
4. ~~**Экраны**: `/dashboard` без auth, только токены~~ ✅ **закрыто**: маршруты `/booking/:uuid/{confirmed,cancel,reschedule}`, `/my`, `/admin/*` ([ADR-0019](adr/0019-my-bookings-on-device.md)), редизайн v2 ([ADR-0023](adr/0023-redesign-v2-mint.md)).

## Backlog из внешней спеки (Gemini, [`archive/gemini-code-1790192589378.md`](archive/gemini-code-1790192589378.md))

Сверка пунктов спеки с фактическим кодом: DONE здесь не дублируется, ниже — только MISSING и PARTIAL (`<частично: …>` — что уже есть и чего не хватает).
Умышленные расхождения MVP, закрытые позже (формулировка ниже была актуальна на 2026-09-25): один хост → мульти-хост ([ADR-0018](adr/0018-multi-host-model.md)); токены вместо uuid → маршруты `/booking/:uuid/*`; форма без `guests`/согласия → [ADR-0015](adr/0015-booking-guests-consent-idempotency.md); `/dashboard` без auth → [ADR-0017](adr/0017-dashboard-basic-auth.md).

### P0 — Публичный флоу бронирования (§1.1–1.3)

- [x] Маршрут `/book/:slug` (§1.1) — **сделано** (ADR-0010): лендинг `/`, бронь `/book/:slug`
- [x] `TimezoneSelector`: поиск по IANA (§1.1) — **сделано**: `TimeZoneSelect` переделан в combobox (`role="combobox"` + `role="listbox"`), поиск по подстроке (`searchTimeZones` в `src/utils/timezone.ts`, `Intl.supportedValuesOf`), фокус открывает список популярных поясов; unit + RTL-тесты
- [x] Переключатель 12/24-часового формата (§1.1) — **сделано**: `TimeFormatProvider` + `useTimeFormat` (localStorage `call-calendar-hour12`), `TimeFormatToggle` в `HostInfo` и мобильной шапке; формат учитывают `SlotGrid`, `BookingBar`, `BookingDialog`, `BookingSuccess`; RTL-тест
- [x] Валидация имени min 2 (§1.2) — **сделано**: `min(2, 'Имя от 2 символов')` в `src/lib/validation.ts` ↔ `server/validation.ts` (legacy `name` и v1 `clientName`), inline-ошибка в диалоге
- [x] Маска телефона (§1.2) — **сделано**: `src/utils/phone.ts` (`formatPhoneInput`, RU-маска `+7 (900) 000-00-00`, иностранные — цифры с `+`), применяется в диалоге; unit-тесты
- [x] Лимит `notes` 500 (§1.2) — **сделано**: `max(500)` в зеркалах схем, `maxLength={500}` и счётчик «N / 500» в диалоге
- [x] Поле `guests` — массив email с добавлением по Enter (§1.2) — **сделано**: `CreateBookingRequest.guests`/`Booking.clientGuests`, `bookings.guests` (JSON), чипы в диалоге, API + RTL-тесты ([ADR-0015](adr/0015-booking-guests-consent-idempotency.md))
- [x] Чекбокс согласия с правилами/ПДн (§1.2) — **сделано**: обязательный `consentAccepted` в контракте/v1-валидации, `bookings.consentAccepted`, чекбокс блокирует submit ([ADR-0015](adr/0015-booking-guests-consent-idempotency.md))
- [x] Заголовок `Idempotency-Key` (§1.2) — **сделано**: `@header("Idempotency-Key")`, `bookings.idempotencyKey` (UNIQUE), повтор возвращает ту же бронь ([ADR-0015](adr/0015-booking-guests-consent-idempotency.md))
- [x] Обработка 409 (§1.2) — **сделано**: inline-алерт `role="alert"` «Этот слот только что заняли. Выберите другое время.» (`booking-dialog`), тост + refetch
- [x] Экран `/booking/:uuid/confirmed` (§1.3) — **сделано**: `src/pages/confirmed-page.tsx` (`GET /api/v1/bookings/:id`), название встречи, аватар/имя организатора, дата/время с поясом, способ связи (`locationType`), GCal/.ics, ссылки «Перенести»/«Отменить»; 2 RTL-теста.
- [x] Ссылка «Отменить встречу» на экране успеха (§1.3) — **сделано**: прямая кнопка `Link` на `/cancel/:token` в `BookingSuccess`

### P1 — Self-service (§2.1–2.2)

- [x] Роуты `/booking/:uuid/cancel` и `/booking/:uuid/reschedule` (§2.1–2.2) — **сделано**: добавлены алиасы (`/cancel/:token`, `/reschedule/:token` сохранены); `CancelPage`/`ReschedulePage` читают `token ?? uuid`
- [x] Детали встречи на странице отмены (§2.1) — **сделано**: `CancelPage` тянет `GET /api/v1/bookings/:id` и показывает «Когда» (дата/время + пояс) и «Длительность»
- [x] Поле `cancellation_reason` (§2.1) — **сделано**: колонка `bookings.cancellationReason`, `POST /api/v1/bookings/:id/cancel` принимает `{reason}`, поле + модалка подтверждения на `/cancel/:token`
- [x] Модалка подтверждения отмены (§2.1) — **сделано**: `Dialog` «Вы уверены, что хотите отменить бронирование?» с полем причины
- [x] `POST /api/bookings/:uuid/cancel` (§2.1) — **закрыто как не требуется**: покрыто `POST /api/v1/bookings/:id/cancel` (по токену) и `/booking/:uuid/cancel`; отдельный легаси-роут не нужен.

### P1 — Дашборд организатора (§3.1–3.3)

- [x] Роут `/admin/availability` (§3.1) — **сделано**: маршрут ведёт на панель организатора (секция «Доступность»)
- [x] Несколько интервалов в день (§3.1) — ✅ **сделано**: `availability_ranges` (несколько окон на день), форма `/dashboard` — «Добавить интервал»
- [x] Кнопка «Скопировать понедельник на будни» (§3.1) — **покрыто** общим диалогом копирования дня на выбранные дни (`Copy` → выбор целевых дней)
- [x] `buffer_before` / `buffer_after` (§3.1) — **сделано**: `bufferBeforeMin`/`bufferAfterMin` в контракте/БД/форме ([ADR-0016](adr/0016-split-buffers.md))
- [x] Пресеты `max_future_days` 14/30/60 (§3.1) — **сделано**: кнопки-пресеты рядом с `horizonDays` в форме доступности
- [x] `/admin/event-types` + `EventForm` (`title`/`slug`/`description`/`location_type`) (§3.2) — **сделано**: маршрут открывает секцию типов встреч (`initialSection="event-types"`), `EventTypesEditor` покрывает `title`/`slug`/`description`/`durationMin`/`locationType`; отдельная страница не требуется.
- [x] Роут `/admin/bookings` (§3.3) — **сделано**: маршрут ведёт на панель организатора
- [x] Табы Upcoming / Past / Canceled (§3.3) — **сделано**: `BookingFilter` → «Предстоящие / Прошедшие / Отменённые», отмена только для предстоящих
- [x] Поиск по имени и email (§3.3) — **сделано**: поле поиска в панели (desktop и mobile), фильтр по имени/email
- [x] `BlockTimeModal` + форма блокировки времени (§3.3) — **сделано**: таблица `time_blocks`, API `/api/v1/hosts/:slug/blocks`, `BlocksEditor` + `BlockTimeModal` в панели; блокировки исключают слоты и дают `409`

## Backlog продукта (сверх курса)

> Сверка списка «что развивать как продукт после успешной проверки» с текущей реализацией (2026-09-29). Ниже — только MISSING; уже сделанное помечено ✅.

**Уже сделано:**

- ✅ **Гибкое расписание** — окна доступности по дням недели и несколько интервалов (перерывы) на день: `availability_ranges` ([ADR-0016](adr/0016-split-buffers.md), [ADR-0020](adr/0020-per-host-availability-rules.md)); исключения/праздничные дни закрываются блокировками времени (`time_blocks`, [ADR-0014](adr/0014-time-blocks.md)).
- ✅ **Часовые пояса** — зона владельца хранится и применяется при генерации слотов, гость смотрит расписание в своём поясе: [ADR-0024](adr/0024-slots-in-host-timezone.md).
- ✅ **Перенос и отмена бронирований** — `manage-booking-page`, [ADR-0006](adr/0006-cancellation-by-token.md), [ADR-0008](adr/0008-reschedule-by-token.md).
- ✅ **Буфер между встречами** — `bufferBeforeMin`/`bufferAfterMin`: [ADR-0016](adr/0016-split-buffers.md).

**Нужно сделать:**

- [ ] **Регистрация и аккаунты** — self-service: регистрация/логин, у каждого пользователя свои календари и типы встреч. Сейчас есть мульти-хост ([ADR-0018](adr/0018-multi-host-model.md)), но панель **открыта без логина** ([ADR-0028](adr/0028-dashboard-access-without-login.md)): владелец один и заранее задан, разграничения прав нет. Требует ADR по аутентификации и владению календарями.
- [ ] **Интеграции с внешними календарями** — двусторонняя синхронизация занятости/событий (Google/Outlook). Сейчас только экспорт: `.ics` и ссылка Google Calendar (`src/utils/calendar.ts`), односторонне.
- [x] **Уведомления** — ✅ 2026-09-29: Brevo HTTP API, гостю — подтверждение/перенос/отмена/напоминание за 24 ч, организатору — новая бронь/отмена; без `EMAIL_API_KEY` — no-op. Напоминания — ленивая проверка + `POST /api/internal/reminders` (cron-job.org). [ADR-0026](adr/0026-email-notifications.md), [#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83).
- [ ] **Повторяющиеся события** — серии встреч (еженедельно/по будням и т.п.) и повторяющиеся брони.
- [ ] **Аналитика по записям** — сводки/метрики панели (загрузка, конверсия, популярные слоты/типы).

**Предлагаемый порядок захода:** уведомления ✅ → регистрация/аккаунты → интеграции с календарями → повторяющиеся события → аналитика.