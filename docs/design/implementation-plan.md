# План внедрения дизайна

Порядок жёсткий: каждый этап — отдельный коммит в формате Conventional Commits, после каждого этапа зелёные `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Бэкенд (`server/`) не трогаем.

Перед началом прочитать: `AGENTS.md`, `docs/conventions.md`, `docs/design/design-spec.md`, `docs/design/test-contract.md`. Открыть эталонные скриншоты `docs/design/screenshots/`.

---

## Этап 0. Ветка

`git checkout -b feat/redesign-a-d-themes`. Ветку `main` напрямую не трогать, `.github/workflows/hexlet-check.yml` не редактировать.

## Этап 1. Токены, шрифты, тема — `feat(ui): add design tokens, fonts and light/dark theme`

Файлы:
- `package.json` — `npm i @fontsource/golos-text @fontsource/lora`.
- `src/main.tsx` — импорты `@fontsource/golos-text/{400,500,600,700}.css`, `@fontsource/lora/{500,600}.css`; обернуть приложение в `ThemeProvider`.
- `src/index.css` — заменить блоки `:root` и `.dark` содержимым `docs/design/tokens.css` (включая `color-scheme` и `font-sans` для body).
- `tailwind.config.js` — добавить ключи из `docs/design/tailwind.config.snippet.js` (цвета `surface`, `selected`, `success`, `segment-active`, `disabled-foreground`, `destructive-border`; `fontFamily`; `borderRadius.xl/card`; `boxShadow.card`).
- `index.html` — в `<head>` до скриптов inline-скрипт без мигания:
  ```html
  <script>
    try {
      var t = localStorage.getItem('call-calendar-theme')
      var dark = t === 'dark' || ((!t || t === 'system') && matchMedia('(prefers-color-scheme: dark)').matches)
      if (dark) document.documentElement.classList.add('dark')
    } catch (e) {}
  </script>
  ```
  Проверить, что CSP/линтер не мешают (в проекте CSP нет).
- `src/components/theme-provider.tsx` — контекст `{ theme: 'light' | 'dark' | 'system', resolvedTheme: 'light' | 'dark', setTheme }`; синхронизирует класс `dark` на `document.documentElement`, пишет в `localStorage` (try/catch), в режиме `system` слушает `matchMedia('(prefers-color-scheme: dark)')`.
- `src/hooks/use-theme.ts` — `useTheme()` поверх контекста.
- `src/components/theme-toggle.tsx` — круглая кнопка 40 px (`size-10 rounded-full border bg-card`), иконки `Moon`/`Sun`, `aria-label` «Включить тёмную тему» / «Включить светлую тему».
- `src/components/ui/sonner.tsx` — `theme={resolvedTheme}` вместо жёсткого `"light"`.
- `src/hooks/use-media-query.ts` — `useMediaQuery(query, fallback = true)` на `useSyncExternalStore`; если `window.matchMedia` нет → `fallback`.
- `src/test/setup.ts` — заглушка `matchMedia` (см. `test-contract.md`, п. 3).

Тесты: `theme-toggle.test.tsx` — клик ставит/снимает класс `dark` на `<html>` и пишет значение в `localStorage`; меняется `aria-label`.

Готово, когда: при переключении темы вся существующая страница (ещё в старой раскладке) корректно перекрашивается, при перезагрузке тема сохраняется, при первой загрузке нет вспышки светлой темы.

## Этап 2. Шапка и гостевая страница на десктопе — `feat(ui): redesign booking page desktop layout`

Файлы:
- `src/config/host.ts` — `export const host = { name: 'Организатор', initials: 'О', meetingTitle: 'Звонок-консультация', format: 'Онлайн-звонок' }` + комментарий «заменить на реальные данные».
- `src/components/app-header.tsx` — лого, `h1` «Календарь звонков», ссылка (проп), `ThemeToggle`. Варианты `desktop` / `mobile` (высота 64/60 px, отступы).
- `src/components/host-info.tsx` — колонка «Инфо» (аватар, имя, название встречи как `h2` Lora, мета-список, выбор пояса). Правило «не позже чем за…» — из `fetchAvailability()` (`minNoticeMin` → «2 часа» / «30 минут», с падежами); ошибка → строку не показываем.
- `src/components/timezone-select.tsx` — стиль `h-11 rounded-lg border-input bg-card`, иконка `Globe` у метки; `id="timezone"` и метку «Часовой пояс» сохранить.
- `src/components/month-calendar.tsx` — новые стили ячеек (круг 52 px, 4 состояния), круглые кнопки навигации 44 px, uppercase-шапка дней, легенда, отметка «сегодня». API компонента и `aria-label` не меняются.
- `src/components/slot-grid.tsx` (новый) — сетка слотов: пропсы `slots`, `selectedSlotId`, `timeZone`, `onSelect`, `onConfirm`, `columns` (2 на десктопе, 3 на телефоне). Выбранный слот на десктопе — `col-span-2`, плашка + «Забронировать →»; занятый — `disabled`, `aria-label="HH:mm, занято"`.
- `src/utils/timezone.ts` — добавить `formatTimeInZone(iso, tz)` → «14:20», `formatDayTitle(dateKey, tz)` → «Четверг, 24 сентября», `formatTimeRange(slot, tz)` → «14:20 – 14:50».
- `src/utils/plural.ts` — `pluralRu(n, ['окно', 'окна', 'окон'])` на `Intl.PluralRules('ru')`.
- `src/pages/home-page.tsx` — раскладка A (шапка + карточка из трёх колонок), состояние `selectedSlotId` с авто-выбором первого свободного слота при смене даты/пояса/после `refetch`; скелетоны загрузки; карточка ошибки с «Повторить».

Тесты: существующие `home-page.test.tsx`, `App.test.tsx` проходят **без изменений**. Новый тест — авто-выбор: после загрузки выбран первый свободный слот (`aria-pressed`), клик по другому переносит выбор.

## Этап 3. Телефонная раскладка — `feat(ui): add mobile booking layout`

Файлы:
- `src/components/date-strip.tsx` — горизонтальная лента доступных дат (64×72, `snap-x`, `aria-label="YYYY-MM-DD"`, `aria-pressed`), прокрутка к выбранной дате.
- `src/components/booking-bar.tsx` — sticky-панель снизу с выбранным временем и «Забронировать»; `pb-[max(1.5rem,env(safe-area-inset-bottom))]`.
- `src/pages/home-page.tsx` — при `useMediaQuery('(min-width: 1024px)') === false` раскладка D: `AppHeader variant="mobile"`, блок организатора с «таблетками», `DateStrip` + кнопка «Весь месяц» (`aria-expanded`), раскрывающая `MonthCalendar`; `SlotGrid columns={3}`; `BookingBar`.
- Контейнер `mx-auto w-full max-w-md`, нижний отступ под панель.

Тесты: `date-strip.test.tsx` (показываются только доступные даты, клик вызывает `onSelect`); тест страницы с `matchMedia` → `false`: есть лента, нет сетки месяца, пока не нажато «Весь месяц».

## Этап 4. Форма брони — `feat(ui): restyle booking dialog`

- `src/components/ui/dialog.tsx` — затемнение `bg-stone-900/45 dark:bg-black/60`; у `DialogContent` проп `hideClose`, чтобы поставить свою кнопку «Закрыть».
- `src/components/booking-dialog.tsx`:
  - заголовок Lora, сводка с иконкой `Calendar` («Чт, 24 сентября 2026, 14:20–14:50 · 30 мин»);
  - порядок полей **Имя → Email → Телефон → Комментарий**, «необязательно» справа от меток телефона и комментария;
  - счётчик «N / 1000» под комментарием (`aria-live="polite"` не нужен, `aria-describedby` на textarea);
  - десктоп: `max-w-[480px] rounded-card p-7`, кнопки «Отмена» + «Забронировать» справа;
  - телефон (`useMediaQuery` false): панель снизу `inset-x-0 bottom-0 top-[88px] rounded-t-3xl`, ручка сверху, одна кнопка «Забронировать» во всю ширину, h-14; поля h-[52px] text-base;
  - фокус на поле «Имя» при открытии (`onOpenAutoFocus`).
- Ошибка 409/400 из API: toast (уже есть в `useBooking`) + закрыть диалог + `refetch` + снять выбор (сделать в `home-page.tsx`).

Тесты: `booking-dialog.test.tsx` проходит без изменений; новый тест счётчика комментария.

## Этап 5. Экран успеха — `feat(ui): restyle booking success screen`

- `src/components/booking-success.tsx` — стиль по `design-spec.md` §3.4 (десктоп — карточка 600 px, телефон — колонка с кнопками внизу). «Назад» — `button` ghost со стрелкой.
- **Опционально (5b) `feat(ui): add calendar export on success screen`:** `src/utils/calendar-export.ts` — `googleCalendarUrl({ title, start, end, details })` (`https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=YYYYMMDDTHHmmssZ/YYYYMMDDTHHmmssZ&details=…`) и `buildIcs(...)` (VCALENDAR/VEVENT, `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, CRLF-переводы строк) + скачивание через `Blob` и `URL.createObjectURL`. Кнопки «Google Календарь» (ссылка `target="_blank" rel="noopener noreferrer"`) и «Скачать .ics». Юнит-тесты на обе функции. Без 5b кнопок и подзаголовка про календарь нет.

## Этап 6. Панель организатора — `feat(ui): redesign organizer dashboard`

- `src/components/dashboard-sidebar.tsx` — десктопный сайдбар (лого-`h1`, «Встречи» со счётчиком, «Доступность» → `#availability`, «Страница бронирования», подпись пояса, `ThemeToggle`).
- `src/components/bookings-list.tsx` вместо `bookings-table.tsx` — группировка по дню (`toDateKeyInZone`), заголовок группы, карточки `<li>` (время / имя-контакты-комментарий / «Отменить»). Пустое состояние «Пока нет ни одной брони». Старый `bookings-table.tsx` удалить.
- `src/components/booking-filter.tsx` — сегменты «Все / Неделя / Сегодня» (`role="tablist"`), фильтр на клиенте (неделя = ближайшие 7 дней от сегодня).
- `src/components/availability-form.tsx` — дизайн §4.1: дни-«таблетки» (label + скрытый checkbox), `select` часов для окна, подсказка в локальном поясе, radio-сегменты длительности 15/30/45/60 (+ текущее нестандартное значение), поля «Буфер», «Не позже чем за», «Открыто на» с единицами, подсказка «≈ N слотов в рабочий день», кнопка «Сохранить» во всю ширину. `id` полей сохранить. Валидация — прежняя zod-схема.
- `src/pages/dashboard-page.tsx` — десктоп: сайдбар + колонка броней + `sticky` панель доступности 360 px; телефон: `AppHeader variant="mobile"` (ссылка «Бронирование»), заголовок, табы «Встречи · N» / «Доступность».

Тесты: в `dashboard-page.test.tsx` только `closest('tr')` → `closest('li')`. Новые: группировка по дням, фильтр «Сегодня», подсказка «≈ 12 слотов» для 10–18, 30 мин, буфер 10.

## Этап 7. Документация — `docs: record redesign and themes`

- `docs/adr/0007-visual-redesign-and-themes.md` — положить из пакета, статус **Accepted** с датой мержа; строка в индексе `docs/adr/README.md`.
- `MEMORY.md` и `docs/todo.md` — отметить сделанное.
- `README.md` — упомянуть светлую/тёмную тему; по желанию — скриншоты из `docs/design/screenshots/`.

## Приёмка (для каждого этапа и в конце)

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — зелёные.
- [ ] Визуальная сверка с `docs/design/screenshots/` в `npm run dev` на 1280×820 и 390×844, в обеих темах. Отличия допустимы только из-за реальных данных (даты, число слотов).
- [ ] 360 px ширины — без горизонтальной прокрутки страницы.
- [ ] Весь сценарий «выбрать дату → слот → форма → успех → другое время» проходится с клавиатуры (Tab/Enter/Space/Esc), фокус виден.
- [ ] В тёмной теме нет «белых вспышек»: нативный `select`, автозаполнение и toast тёмные.
- [ ] Нет inline `style={{}}`, нет `any`, именованные экспорты (кроме страниц), файлы в kebab-case.
- [ ] `.github/workflows/hexlet-check.yml` не менялся (`git diff --stat main`).
