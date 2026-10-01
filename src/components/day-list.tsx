import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'

import type { TimeSlot } from '@/types/booking'
import { addDays, parseDateKey } from '@/utils/dates'
import { pluralRu } from '@/utils/plural'
import { formatDayTitle, formatTimeInZone, toDateKeyInZone } from '@/utils/timezone'

interface DayListProps {
  slots: TimeSlot[]
  timeZone: string
  onSelectDate: (dateKey: string) => void
}

interface DayEntry {
  dateKey: string
  freeCount: number
  firstTime: string | null
}

interface WeekendEntry {
  key: string
  isWeekend: true
}

function isWeekend(dateKey: string): boolean {
  const weekday = parseDateKey(dateKey).getDay()

  return weekday === 0 || weekday === 6
}

export function DayList({ slots, timeZone, onSelectDate }: DayListProps) {
  const blocks = useMemo(() => {
    const freeByDate = new Map<string, DayEntry>()

    for (const slot of slots) {
      if (slot.isBooked) {
        continue
      }

      const dateKey = toDateKeyInZone(new Date(slot.startAt), timeZone)
      const entry = freeByDate.get(dateKey) ?? { dateKey, freeCount: 0, firstTime: slot.startAt }
      entry.freeCount += 1

      if (slot.startAt < (entry.firstTime ?? slot.startAt)) {
        entry.firstTime = slot.startAt
      }

      freeByDate.set(dateKey, entry)
    }

    const keys = Array.from(freeByDate.keys()).sort()

    if (keys.length === 0) {
      return []
    }

    const result: (DayEntry | WeekendEntry)[] = []
    let weekendRunStart: string | null = null

    const flushWeekend = () => {
      if (weekendRunStart) {
        result.push({ key: `weekend-${weekendRunStart}`, isWeekend: true })
        weekendRunStart = null
      }
    }

    let cursor = keys[0]

    while (cursor <= keys[keys.length - 1]) {
      const entry = freeByDate.get(cursor)

      if (entry) {
        flushWeekend()
        result.push(entry)
      } else if (isWeekend(cursor)) {
        weekendRunStart ??= cursor
      }

      cursor = addDays(cursor, 1)
    }

    flushWeekend()

    return result
  }, [slots, timeZone])

  return (
    <ul className="flex flex-col gap-2">
      {blocks.map((block) =>
        'isWeekend' in block ? (
          <li
            key={block.key}
            className="flex h-[30px] items-center px-3 text-[12px] text-muted-foreground"
          >
            Суббота и воскресенье — выходные
          </li>
        ) : (
          <li key={block.dateKey}>
            <button
              type="button"
              aria-label={block.dateKey}
              onClick={() => onSelectDate(block.dateKey)}
              className="flex h-[52px] w-full items-center justify-between gap-3 rounded-xl px-3.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">
                  {formatDayTitle(block.dateKey)}
                </span>
                <span className="block text-[12px] text-muted-foreground">
                  {block.freeCount} {pluralRu(block.freeCount, ['окно', 'окна', 'окон'])}
                  {block.firstTime && ` · с ${formatTimeInZone(block.firstTime, timeZone)}`}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>
          </li>
        ),
      )}
    </ul>
  )
}
