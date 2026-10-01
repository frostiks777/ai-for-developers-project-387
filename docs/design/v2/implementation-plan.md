# План внедрения дизайна v2

Порядок жёсткий: один этап — один коммит (или несколько коммитов одного типа) в формате Conventional Commits со ссылкой на issue. После каждого этапа зелёные `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; на этапах, где меняется сценарий записи, — ещё `npm run test:e2e`.

Перед началом прочитать: `AGENTS.md`, `MEMORY.md`, `docs/conventions.md`, затем в этой папке `README.md` → `design-spec.md` → `ux-cases.md` → `test-contract.md`. Открыть `screenshots/`.

Решения, принятые с пользователем (не пересматривать без него):
- палитра «Мята и солнце» + тёмная тема, других палитр нет;
- на десктопе два вида записи: «Дни» (A) и «Неделя» (B) с переключателем;
- на телефоне — мастер из трёх шагов (C);
- первый свободный слот за гостя не выбирается, форма на десктопе — в колонке, не в диалоге; тесты обновляются под это;
- список броней в API закрывается паролем организатора; сервер для этого менять можно.

Этапы 1–2 — исправления, их можно выкатывать сразу. Этапы 3–13 — редизайн.

---

## Этап 0. Подготовка

- `git checkout -b feat/redesign-v2-mint`. `.github/workflows/hexlet-check.yml` и имя репозитория не трогать.
- Скопировать `docs/design/v2/adr/*.md` в `docs/adr/` (статус **Proposed**) и добавить строки в `docs/adr/README.md`. Статус **Accepted** ставится на этапе 13.
- Скилл уже лежит в `.agents/skills/apply-design-v2/SKILL.md`; добавить его в список скиллов в `AGENTS.md` (раздел «Skills (OpenCode)»).
- Коммит: `docs: add redesign v2 package and draft ADR-0022..0024`.

## Этап 1. Контакты гостей только для организатора — `fix(api): require admin auth for bookings list` + `feat(web): move upcoming events into organizer panel`

Сценарий П1 (`ux-cases.md`), [ADR-0022](adr/0022-private-bookings-list.md).

Сервер, `server/app.ts`, функция `requiresAdminAuth`:
```ts
if (rest === 'bookings') {
  return method === 'GET' // список броней — только организатору; POST (создание) остаётся публичным
}
```
- В `buildApp()` до SPA-фолбэка: `app.get('/events', (_, reply) => reply.redirect('/admin/bookings'))`. Редирект серверный, а не `<Navigate>`: по ADR-0017 (п. 7) вход в панель возможен только полной навигацией, иначе браузер не спросит пароль.

Тесты `server/admin-auth.test.ts`: с `ADMIN_PASSWORD` — `GET /api/v1/hosts/default/bookings` без заголовка → 401, с верным Basic → 200; `POST` без заголовка → не 401; `GET /events` → 302 на `/admin/bookings`. Без `ADMIN_PASSWORD` всё открыто, как раньше (на этом держатся unit- и e2e-тесты).

Фронтенд:
- `src/App.tsx`: убрать маршрут `/events`. Удалить `src/pages/events-page.tsx` и `events-page.test.tsx`.
- Убрать вкладку «Предстоящие события» из `tabs` в `landing-page.tsx`, `home-page.tsx`, `my-bookings-page.tsx`, `confirmed-page.tsx`.

Готово, когда: пункты «Готово, когда» сценария П1 в `ux-cases.md` выполнены; `docs/adr/0017-dashboard-basic-auth.md` дополнен строкой «Частично заменён ADR-0022».

## Этап 2. Баги времени — `fix(web): correct weekday labels and show cancel time in guest zone`

- `src/utils/timezone.ts`: добавить `formatWeekdayShort(dateKey)` — как `formatDayShortTitle`, через `Date.UTC(...)` и `timeZone: 'UTC'`, возвращает «Пн».
- `src/components/date-strip.tsx`: заменить `parseDateKey` + `timeZone: 'UTC'` на `formatWeekdayShort` и `Number(dateKey.slice(8))` для числа. (Компонент удаляется на этапе 6, но фикс нужен на проде раньше.)
- Тест `date-strip.test.tsx`: `2026-09-28` → «Пн» при `process.env.TZ = 'Europe/Moscow'` (или `vi.stubEnv`) — тест должен падать на старом коде.
- `src/pages/cancel-page.tsx`: время в `defaultTimeZone` (пояс браузера) без приписки «(UTC)»; формат «Пн, 28 сентября, 14:20 – 14:50» + «по Москве (UTC+3)» (`formatZoneShort`, см. этап 3).

## Этап 3. Токены, фон, стекло, шапка — `feat(ui): add v2 tokens, ambient background and glass surfaces`

- `src/index.css`: блоки `:root` и `.dark` заменить на `docs/design/v2/tokens.css` (токены + `@layer components` со `.ambient`, `.ambient-blob`, `.glass`, `.glass-bar` + правило reduced motion).
- `tailwind.config.js`: все цвета перевести на `hsl(var(--x) / <alpha-value>)`; влить `extendV2` из `tailwind.config.snippet.js` (цвета `highlight`, `blob`, тени `glow`, `glow-lg`, `glass`, keyframes и animation `blob-a…d`).
- `src/components/ambient-background.tsx` — разметка из `design-spec.md` §1.2.
- `src/components/app-shell.tsx` — `AmbientBackground` + обёртка `relative z-10 flex min-h-screen flex-col`. Обернуть в `AppShell` все страницы (лендинг, запись, «Мои встречи», подтверждение, отмена/перенос, 404, панель).
- `src/components/app-header.tsx`: `glass-bar`, логотип с градиентом, на телефоне — логотип и «Мои встречи».
- `src/utils/timezone.ts`: `formatZoneShort(timeZone)` → «по Москве (UTC+3)» (словарь предложного падежа для частых зон, иначе «по {IANA}»; смещение — из `timeZoneOptionLabel`). Юнит-тесты на Europe/Moscow, UTC, America/New_York.
- Тест: `ambient-background` рендерится с `aria-hidden="true"`.

Готово, когда: все существующие страницы (ещё в старой раскладке) лежат на живом фоне, карточки стеклянные, в тёмной теме нет белых рамок; анимация выключается в DevTools → Rendering → prefers-reduced-motion.

## Этап 4. Запись, вид «Дни» (A) — `feat(ui): redesign desktop booking as single-screen days view`

Сценарии Г2–Г6. Эталон — `screenshots/A-booking-days.png`, `design-spec.md` §3.1.

Новые компоненты (`src/components/`):
- `event-type-picker.tsx` — `radiogroup` «Тип встречи», варианты `layout="cards" | "chips"`.
- `two-week-grid.tsx` — пропсы `slots`, `selectedDate`, `timeZone`, `horizonEnd`, `onSelectDate`, `rows?: 1 | 2`. Строит недели от понедельника первой доступной даты до `horizonEnd`; ячейки — `button aria-label="YYYY-MM-DD"`.
- `slot-groups.tsx` — заменяет `slot-grid.tsx`: пропсы `slots`, `selectedSlotId`, `currentSlotId?`, `timeZone`, `columns: 3 | 4 | 5`, `onSelect`. Группировка «Утром / Днём / Вечером» по часу начала в `timeZone`. Никакой кнопки «Забронировать» внутри.
- `booking-form.tsx` — логика из `booking-dialog.tsx` без `Dialog`: пропсы `slot | null`, `hostSlug`, `eventTypeId`, `eventTypeTitle`, `timeZone`, `variant: 'column' | 'step'`, `onBooked`, `onConflict`. Состояние полей живёт в компоненте и **не сбрасывается** при смене `slot`; сбрасывается только после успешной брони. Ключ идемпотентности — новый на каждый выбранный слот.
- `timezone-card.tsx` — «Часовой пояс» (`TimeZoneSelect`), `TimeFormatToggle`, строка «Время показано по поясу…».

`src/pages/home-page.tsx` (десктоп):
- Удалить `useEffect` автовыбора первого свободного слота. `selectedSlotId` = `null` после загрузки и при смене дня, типа, пояса.
- Сетка `grid-cols-[260px_minmax(0,1fr)_380px]` (1024–1279: `220px / 1fr / 340px`), карточка `glass rounded-card`.
- `horizonEnd` = сегодня + `horizonDays` из `getAvailability` (уже запрашивается ради `minNoticeMin`).
- Подсказка «Нет подходящего времени?» — ближайший следующий день, где ≥ 4 свободных окон.
- `month-calendar.tsx` на странице записи больше не используется (остаётся, пока его использует перенос; удалить на этапе 9, если ссылок не останется).
- `booking-dialog.tsx` удалить вместе с `booking-dialog.test.tsx`, тесты перенести в `booking-form.test.tsx` (см. `test-contract.md`).

`src/lib/validation.ts` — сообщения email по `design-spec.md` §5 (схема та же, меняется только текст; зеркало `server/validation.ts` не трогаем — там свои сообщения API).

Тесты: `two-week-grid.test.tsx` (выходные `disabled`, подпись «10 окон»), `slot-groups.test.tsx` (группы, занятое `disabled` с `aria-label`), `booking-form.test.tsx`, обновлённый `home-page.test.tsx`.

## Этап 5. Вид «Неделя» (B) — `feat(ui): add week view to desktop booking`

Эталон — `screenshots/B-booking-week.png`, `design-spec.md` §3.2.

- `src/components/view-toggle.tsx` — `tablist` «Вид выбора времени», стрелки ←/→.
- `src/hooks/use-booking-view.ts` — `'days' | 'week'` в `localStorage['call-calendar-booking-view']` (try/catch, по умолчанию `days`).
- `src/components/week-grid.tsx` — пропсы `slots`, `weekStart`, `timeZone`, `selectedSlotId`, `onSelect`, `onPrevWeek`, `onNextWeek`, `canPrev`, `canNext`.
- `home-page.tsx`: при `week` — `grid-cols-[minmax(0,1fr)_380px]`, тулбар с `EventTypePicker layout="chips"`, навигацией и `ViewToggle`.

Тесты: `week-grid.test.tsx` (строки по временам, пустые ячейки без кнопок, выбор), тест переключения и сохранения вида.

## Этап 6. Телефон: мастер C1–C3 — `feat(ui): mobile booking wizard`

Эталоны — `C1-day.png`, `C2-time.png`, `C3-contacts.png`, `design-spec.md` §3.3.

- `src/components/booking-wizard.tsx` — шаги `day | time | contacts`, прогресс, `history.pushState({ step })` при переходе вперёд и обработчик `popstate`.
- `src/components/day-list.tsx` (C1), `src/components/day-switcher.tsx` (C2), нижняя панель — переиспользовать и обновить `booking-bar.tsx` (текст кнопки «Далее»).
- «Ближайшее свободное» — первый свободный слот по всему окну; «Выбрать это время» → шаг `contacts`.
- `BookingForm variant="step"`: поля `h-[52px] text-base`, `sticky` кнопка.
- Удалить `date-strip.tsx` и `date-strip.test.tsx` (фикс этапа 2 переносится в `day-list`: подписи дней через `formatDayTitle`).

Тесты: мобильный тест `home-page.test.tsx` переписать на мастер (см. `test-contract.md`).

## Этап 7. Подтверждение C4 — `feat(ui): restyle booking success`

- `src/components/booking-success.tsx` по `design-spec.md` §3.4. Использовать и в `home-page.tsx`, и в `confirmed-page.tsx`.
- «Перенести» / «Отменить встречу» → `/booking/:uuid/reschedule` и `/booking/:uuid/cancel` (при наличии только токена — `/reschedule/:token`, `/cancel/:token`).
- «Скопировать ссылку» — `navigator.clipboard.writeText` в обработчике клика, при ошибке выделить текст ссылки.

## Этап 8. Время заняли (409) — `feat(ui): keep form data and suggest nearby slots on conflict`

- `booking-form.tsx`: при 409 вызвать `onConflict(slot)`, не сбрасывать поля; показать `role="alert"` из §3.6.
- `home-page.tsx`: `onConflict` → `refetch()`, `setSelectedSlotId(null)`, запомнить `conflictSlot`.
- `src/components/slot-suggestions.tsx` — до трёх ближайших свободных слотов после `conflictSlot` (сначала тот же день, потом следующий).
- `src/hooks/use-booking.ts`: toast при 409 не показывать.

Тест: 409 → поля сохранены, `fetch` слотов вызван повторно, кнопки-предложения есть, клик выбирает слот.

## Этап 9. Управление встречей M — `feat(ui): unified manage booking page`

Эталон — `screenshots/M-manage-booking.png`, `design-spec.md` §3.5.

- `src/pages/manage-booking-page.tsx` с пропсом `mode: 'reschedule' | 'cancel'`; четыре маршрута в `App.tsx` указывают на него. `cancel-page.tsx` и `reschedule-page.tsx` удалить, их тесты объединить в `manage-booking-page.test.tsx`.
- Перенос: `TwoWeekGrid rows={1}` + `SlotGroups currentSlotId`; панель «было → станет»; запрос переноса только по кнопке «Перенести встречу».
- Отмена: раскрывающийся блок вместо модалки, тексты из §3.5.
- После переноса/отмены обновлять запись в «Моих встречах» (`utils/my-bookings.ts`).

## Этап 10. Панель: разделы, обзор, встречи — `feat(ui): split organizer panel into screens and add overview`

Эталон — `screenshots/D-dashboard-overview.png`, `design-spec.md` §4.1–4.3.

- `src/pages/dashboard-page.tsx`: `DashboardSection` += `'overview'`; рендерить **только** выбранный раздел. Маршрут `/admin/hosts` в `App.tsx`. Убрать прокрутку к якорю.
- `src/components/dashboard-sidebar.tsx`: ссылки `NavLink` на маршруты вместо `#якорей`; «Обзор» со счётчиком; блок «Ссылка для записи» + «Скопировать».
- `src/components/dashboard-overview.tsx`: плитки, «Ближайшие встречи», «Неделя глазами гостя» (`availability-preview.tsx`, общий с этапом 11).
- `src/components/bookings-list.tsx`: раскрытие строки (`aria-expanded`), «Скопировать текст для гостя» (`src/utils/guest-message.ts` + юнит-тест).

## Этап 11. Доступность и пояс — `feat(api): generate slots in host time zone` + `feat(ui): availability time zone, wider time inputs and preview`

[ADR-0024](adr/0024-slots-in-host-timezone.md). Это единственный этап, где меняется генерация слотов, поэтому он идёт отдельным PR.

Сервер:
- `server/availability.ts`: `generateSlotStartsFromRanges(now, settings)` строит дни и минуты в `settings.timeZone`. Добавить `zonedTimeToUtc(year, month, day, minute, timeZone): number` через `Intl.DateTimeFormat(..., { timeZone, timeZoneName: 'longOffset' })` с повторной проверкой смещения (переходы на летнее время). Для `UTC` результат совпадает с текущим.
- `PUT /api/v1/hosts/:slug/availability`: если `timeZone` из тела валиден (`isValidTimeZone`) и отличается от `hosts.timezone` — сохранить его в `hosts.timezone`, затем перегенерировать будущие свободные слоты (`regenerateFutureSlots`). Брони не трогаются.
- Тесты `server/availability.test.ts`: диапазон 10:00–11:00 в `Europe/Moscow` → слоты `07:00Z`, `07:40Z`; в `UTC` — как раньше; день перехода на летнее время для `Europe/Berlin` без дублей и пропусков. `server/availability-settings.test.ts`: PUT с новым поясом меняет `settings.timeZone` в ответе.

Фронтенд (`availability-settings-form.tsx`):
- `TimeZoneSelect` с меткой «Часовой пояс правил» вместо строки-подписи.
- Поля времени `h-11 w-[112px] text-sm`, `step={600}`, `lang="ru"`.
- Баннер несовпадения пояса (§4.2) здесь и в «Обзоре»; «Считать по Москве» сохраняет правила с `timeZone = defaultTimeZone`, часы не пересчитывает.
- `availability-preview.tsx` по черновику формы.

## Этап 12. Лендинг и «Мои встречи» — `feat(ui): landing formats and my bookings in v2 style`

- `landing-page.tsx`: имя организатора без дубля, одна кнопка `bg-highlight`, блок «Форматы встречи» со ссылками `/book/:slug?type=…`.
- `home-page.tsx`: читать `type` из `useSearchParams` и выбирать формат.
- `my-bookings-page.tsx`: карточки `glass`, «Перенести»/«Отменить» → страница управления.

## Этап 13. Документация и приёмка — `docs: record redesign v2`

- ADR-0022, ADR-0023, ADR-0024 → **Accepted** с датой мержа; ADR-0007 — «Дополнен ADR-0023».
- `docs/design/README.md` — ссылка на `v2/` как текущий дизайн; `v1` оставить как историю.
- `MEMORY.md`, `docs/todo.md`, `README.md` (страницы: `/events` больше не публичная; скриншоты v2).
- `e2e/guest-booking.spec.ts` обновить (см. `test-contract.md`).
- Раздел «Отклонения» в `docs/design/v2/README.md` — всё, что сделано не как на макете, с причиной.

## Приёмка (каждый этап и в конце)

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — зелёные; на этапах 4–9 ещё `npm run test:e2e`.
- [ ] Визуальная сверка со `screenshots/` на 1280×820 и 390×844 в обеих темах; различия — только из-за реальных данных.
- [ ] 360 px — без горизонтальной прокрутки.
- [ ] Сценарий «формат → день → время → имя/email → записаться → подтверждение → перенести → отменить» проходится с клавиатуры, фокус виден.
- [ ] Пункты «Готово, когда» из `ux-cases.md` для затронутых сценариев отмечены в описании PR.
- [ ] Нет inline `style={{}}`, нет hex в компонентах, нет `any`, именованные экспорты (кроме страниц), файлы в kebab-case.
- [ ] `.github/workflows/hexlet-check.yml` не менялся (`git diff --stat main`).
