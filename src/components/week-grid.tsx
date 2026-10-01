import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTimeFormat } from '@/hooks/use-time-format'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { addDays } from '@/utils/dates'
import { formatTimeInZone, formatTimeRange, formatWeekdayShort, toDateKeyInZone } from '@/utils/timezone'

interface WeekGridProps {
  slots: TimeSlot[]
  weekStart: string
  timeZone: string
  selectedSlotId: number | null
  onSelect: (slot: TimeSlot) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  canPrev: boolean
  canNext: boolean
}

export function WeekGrid({
  slots,
  weekStart,
  timeZone,
  selectedSlotId,
  onSelect,
  onPrevWeek,
  onNextWeek,
  canPrev,
  canNext,
}: WeekGridProps) {
  const { hour12 } = useTimeFormat()

  const dayKeys = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  )

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Map<string, TimeSlot>>()

    for (const slot of slots) {
      const dayKey = toDateKeyInZone(new Date(slot.startAt), timeZone)
      const timeKey = formatTimeInZone(slot.startAt, timeZone, false)
      const day = map.get(dayKey) ?? new Map<string, TimeSlot>()
      day.set(timeKey, slot)
      map.set(dayKey, day)
    }

    return map
  }, [slots, timeZone])

  const times = useMemo(() => {
    const set = new Set<string>()
    const spanStart = weekStart
    const spanEnd = addDays(weekStart, 7)

    for (const slot of slots) {
      const dayKey = toDateKeyInZone(new Date(slot.startAt), timeZone)

      if (dayKey >= spanStart && dayKey < spanEnd) {
        set.add(formatTimeInZone(slot.startAt, timeZone, false))
      }
    }

    return Array.from(set).sort()
  }, [slots, weekStart, timeZone])

  const activeDays = dayKeys.filter((dayKey) => (slotsByDay.get(dayKey)?.size ?? 0) > 0)

  if (activeDays.length === 0 || times.length === 0) {
    return <p className="text-sm text-muted-foreground">На этой неделе нет свободных окон.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="w-14" />
            {activeDays.map((dayKey) => {
              const freeCount = Array.from(slotsByDay.get(dayKey)?.values() ?? []).filter(
                (slot) => !slot.isBooked,
              ).length

              return (
                <th key={dayKey} className="pb-1 text-left font-normal">
                  <span className="block text-[14px] font-bold">
                    {formatWeekdayShort(dayKey)} {Number(dayKey.slice(8))}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {freeCount > 0 ? `${freeCount} свободно` : '—'}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {times.map((timeKey) => (
            <tr key={timeKey}>
              <td className="pr-2 text-right align-middle text-xs tabular-nums text-muted-foreground">
                {timeKey}
              </td>
              {activeDays.map((dayKey) => {
                const slot = slotsByDay.get(dayKey)?.get(timeKey)

                if (!slot) {
                  return <td key={dayKey} />
                }

                const time = formatTimeInZone(slot.startAt, timeZone, hour12)

                if (slot.isBooked) {
                  return (
                    <td key={dayKey}>
                      <button
                        type="button"
                        disabled
                        aria-label={`${time}, занято`}
                        className="flex h-11 w-full items-center justify-center rounded-[9px] border border-dashed border-input text-disabled-foreground"
                      >
                        <span className="line-through">{time}</span>
                      </button>
                    </td>
                  )
                }

                const isSelected = slot.id === selectedSlotId

                return (
                  <td key={dayKey}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={time}
                      onClick={() => onSelect(slot)}
                      className={cn(
                        'h-11 w-full rounded-[9px] border px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        isSelected
                          ? 'border-highlight bg-highlight text-highlight-foreground shadow-glow'
                          : 'border-primary/40 bg-accent/50 text-accent-foreground hover:bg-accent',
                      )}
                    >
                      {isSelected ? formatTimeRange(slot, timeZone, hour12) : time}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Предыдущая неделя"
          disabled={!canPrev}
          onClick={onPrevWeek}
          className="size-10 rounded-full"
        >
          <ChevronLeft className="size-[18px]" strokeWidth={1.8} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Следующая неделя"
          disabled={!canNext}
          onClick={onNextWeek}
          className="size-10 rounded-full"
        >
          <ChevronRight className="size-[18px]" strokeWidth={1.8} />
        </Button>
      </div>
    </div>
  )
}
