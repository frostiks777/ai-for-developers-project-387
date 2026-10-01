import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { parseDateKey, toDateKey } from '@/utils/dates'
import { pluralRu } from '@/utils/plural'
import { toDateKeyInZone } from '@/utils/timezone'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface TwoWeekGridProps {
  slots: TimeSlot[]
  selectedDate: string | null
  timeZone: string
  horizonEnd: string | null
  onSelectDate: (dateKey: string) => void
  rows?: 1 | 2
}

export function TwoWeekGrid({
  slots,
  selectedDate,
  timeZone,
  horizonEnd,
  onSelectDate,
  rows = 2,
}: TwoWeekGridProps) {
  const freeByDate = useMemo(() => {
    const map = new Map<string, number>()

    for (const slot of slots) {
      if (slot.isBooked) {
        continue
      }

      const key = toDateKeyInZone(new Date(slot.startAt), timeZone)
      map.set(key, (map.get(key) ?? 0) + 1)
    }

    return map
  }, [slots, timeZone])

  const dateKeys = useMemo(() => {
    const earliest = Array.from(freeByDate.keys()).sort()[0] ?? toDateKey(new Date())
    const firstDate = parseDateKey(earliest)
    const mondayOffset = (firstDate.getDay() + 6) % 7
    const monday = new Date(firstDate)
    monday.setDate(firstDate.getDate() - mondayOffset)

    return Array.from({ length: rows * 7 }, (_, index) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + index)

      return toDateKey(day)
    })
  }, [freeByDate, rows])

  const todayKey = toDateKey(new Date())

  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((weekday) => (
        <span
          key={weekday}
          className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {weekday}
        </span>
      ))}

      {dateKeys.map((dateKey) => {
        const freeCount = freeByDate.get(dateKey) ?? 0
        const weekday = parseDateKey(dateKey).getDay()
        const isWeekend = weekday === 0 || weekday === 6
        const isPast = dateKey < todayKey
        const isBeyondHorizon = horizonEnd !== null && dateKey > horizonEnd
        const isDisabled = freeCount === 0 || isPast || isBeyondHorizon
        const isSelected = dateKey === selectedDate

        const caption = isDisabled
          ? isWeekend && freeCount === 0
            ? 'выходной'
            : '—'
          : `${freeCount} ${pluralRu(freeCount, ['окно', 'окна', 'окон'])}`

        return (
          <button
            key={dateKey}
            type="button"
            aria-label={dateKey}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => onSelectDate(dateKey)}
            className={cn(
              'flex h-[60px] flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected && 'border-primary bg-primary text-primary-foreground',
              !isSelected && !isDisabled && 'border-transparent bg-accent text-accent-foreground hover:bg-accent/70',
              isDisabled && 'border-dashed border-border text-disabled-foreground',
            )}
          >
            <span className="text-lg font-bold leading-none">{Number(dateKey.slice(8))}</span>
            <span className="text-[11px] leading-none">{caption}</span>
          </button>
        )
      })}
    </div>
  )
}
