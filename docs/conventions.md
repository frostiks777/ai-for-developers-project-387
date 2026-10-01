# Конвенции кодирования

Правила стиля и паттерны проекта «Календарь звонков». Краткая сводка есть в `AGENTS.md`, здесь — детали и примеры. Форматирование контролируется Prettier (`semi: false`, `singleQuote: true`), качество — ESLint и TypeScript в strict-режиме.

## Именование

| Сущность | Стиль | Пример |
|---|---|---|
| Файлы | kebab-case | `user-card.tsx`, `booking-form.tsx` |
| Компоненты | PascalCase | `UserCard`, `BookingForm` |
| Файлы хуков | kebab-case с префиксом `use-` | `use-slots.ts` |
| Хуки | camelCase с префиксом `use` | `useSlots`, `useBookingForm` |
| Типы и интерфейсы | PascalCase | `Slot`, `Booking`, `UserCardProps` |
| Функции и переменные | camelCase | `fetchSlots`, `isLoading` |

## Экспорты

По умолчанию — **именованные экспорты везде**. Они дают стабильные имена при рефакторинге и честный поиск по коду.

```tsx
// Плохо: default-экспорт компонента
export default function UserCard() {
  return <div>…</div>
}

// Хорошо: именованный экспорт
export function UserCard() {
  return <div>…</div>
}
```

Единственное исключение — **страницы** в `src/pages/`: там допустим (и ожидаем) default-экспорт, чтобы страницы было удобно подключать в роутер через ленивую загрузку.

```tsx
// src/pages/calendar-page.tsx — страница, default допустим
export default function CalendarPage() {
  return <main>…</main>
}
```

## TypeScript

- **Strict-режим включён** (`tsconfig.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`) — код должен проходить `npm run typecheck` без подавления ошибок.
- Для пропсов компонентов — **interface** (или `type` для объединений и алиасов).
- Из-за `verbatimModuleSyntax` типы импортируются отдельно через **`import type`**:

```ts
// Плохо: смешанный импорт значений и типов
import { Slot } from '@/types/slot'

// Хорошо: тип импортируется явно как тип
import type { Slot } from '@/types/slot'
```

- **Без `any`.** Если тип неизвестен на границе системы (ответ сервера, JSON) — сужаем до конкретного интерфейса или используем `unknown` с проверкой.

## Стиль кода

- Без точек с запятой, одинарные кавычки, висячие запятые — за этим следит Prettier, вручную не форматируем.
- Стилизация — **Tailwind-классы вместо инлайн-стилей**. Атрибут `style={{ }}` не используем.
- Условные и составные классы собираем через хелпер **`cn()`** из `@/lib/utils`:

```tsx
// Плохо: инлайн-стиль и ручная конкатенация классов
<div style={{ marginTop: 16 }} className={'card ' + (isActive ? 'active' : '')}>

// Хорошо: Tailwind + cn()
<div className={cn('mt-4 rounded-lg border p-4', isActive && 'border-primary')}>
```

## Структура типового компонента

Порядок в файле: импорты → интерфейс пропсов сверху → функция компонента → именованный экспорт.

```tsx
// src/components/user-card.tsx
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UserCardProps {
  name: string
  email: string
  isActive?: boolean
  onSelect: (email: string) => void
}

export function UserCard({ name, email, isActive = false, onSelect }: UserCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', isActive && 'border-primary')}>
      <h3 className="text-lg font-medium">{name}</h3>
      <p className="text-sm text-muted-foreground">{email}</p>
      <Button variant="outline" onClick={() => onSelect(email)}>
        Выбрать
      </Button>
    </div>
  )
}
```

## Пример хука

Хук инкапсулирует состояние и обращение к API-слою; компонент получает готовые данные и флаги.

```ts
// src/hooks/use-slots.ts
import { useEffect, useState } from 'react'
import { fetchSlots } from '@/api/slots'
import type { Slot } from '@/types/slot'

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSlots()
      .then(setSlots)
      .catch(() => setError('Не удалось загрузить слоты'))
      .finally(() => setIsLoading(false))
  }, [])

  return { slots, isLoading, error }
}
```

## Пример функции API-слоя

Все обращения к бэкенду — только из `src/api/`. Компоненты и хуки не вызывают `fetch` напрямую. Пути относительные (`/api/...`): в dev-режиме их проксирует Vite на Fastify.

```ts
// src/api/bookings.ts
import type { Booking, NewBooking } from '@/types/booking'

export async function createBooking(data: NewBooking): Promise<Booking> {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Не удалось создать бронирование')
  }

  return response.json()
}
```

## Куда класть файлы

| Что | Куда | Пример |
|---|---|---|
| UI-компонент приложения | `src/components/` | `src/components/user-card.tsx` |
| Компонент shadcn/ui | `src/components/ui/` | `src/components/ui/button.tsx` |
| Страница / маршрут | `src/pages/` | `src/pages/calendar-page.tsx` |
| Кастомный хук | `src/hooks/` | `src/hooks/use-slots.ts` |
| Функция обращения к API | `src/api/` | `src/api/bookings.ts` |
| Утилита, хелпер | `src/utils/` (или `src/lib/`) | `src/utils/format-date.ts` |
| Общий тип / интерфейс | `src/types/` | `src/types/slot.ts` |
| Серверный код | `server/` | `server/index.ts` |
| Схема БД | `server/db/` | `server/db/schema.ts` |
| Тест | рядом с кодом или в `__tests__` | `user-card.test.tsx` |
| Статика | `public/` | `public/favicon.svg` |
