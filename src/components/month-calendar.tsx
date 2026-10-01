import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { parseDateKey, startOfDay, toDateKey } from '@/utils/dates'
import { toDateKeyInZone } from '@/utils/timezone'

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthTitleFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

interface MonthCalendarProps {
  slots: TimeSlot[]
  selectedDate: string
  timeZone: string
  onSelectDate: (dateKey: string) => void
}

function buildMonthDays(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }

  return cells
}

export function MonthCalendar({
  slots,
  selectedDate,
  timeZone,
  onSelectDate,
}: MonthCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateKey(selectedDate))

  useEffect(() => {
    setVisibleMonth(parseDateKey(selectedDate))
  }, [selectedDate])

  const availableDates = new Set(
    slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone)),
  )
  const today = startOfDay(new Date())
  const todayKey = toDateKey(today)
  const days = buildMonthDays(visibleMonth)
  const monthStartKey = toDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1))
  const hasEarlierDates = Array.from(availableDates).some((dateKey) => dateKey < monthStartKey)

  const shiftMonth = (offset: number) => {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1))
  }

  return (
    <section className="flex h-full flex-col">
      <h2 className="text-lg font-semibold">Выберите дату</h2>

      <div className="mt-[clamp(0.75rem,2.9vh,1.5rem)] flex items-center justify-between">
        <p className="font-semibold capitalize">{monthTitleFormatter.format(visibleMonth)}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-[clamp(2.25rem,5.4vh,2.75rem)] rounded-full"
            aria-label="Предыдущий месяц"
            disabled={!hasEarlierDates}
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-[18px]" strokeWidth={1.8} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-[clamp(2.25rem,5.4vh,2.75rem)] rounded-full"
            aria-label="Следующий месяц"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-[18px]" strokeWidth={1.8} />
          </Button>
        </div>
      </div>

      <div className="mt-[clamp(0.5rem,2.4vh,1.25rem)] grid grid-cols-7 text-center text-xs uppercase tracking-wide text-muted-foreground">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="mt-[clamp(0.25rem,1vh,0.5rem)] grid grid-cols-7 justify-items-center gap-y-[clamp(0.125rem,0.5vh,0.25rem)]">
        {days.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} />
          }

          const dateKey = toDateKey(date)
          const isAvailable = availableDates.has(dateKey)
          const isPast = date < today
          const isSelected = dateKey === selectedDate
          const isToday = dateKey === todayKey

          return (
            <button
              key={dateKey}
              type="button"
              aria-label={dateKey}
              aria-pressed={isSelected}
              disabled={isPast || !isAvailable}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                'relative flex size-[clamp(2.25rem,6.4vh,3.25rem)] items-center justify-center rounded-full text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isSelected && 'bg-primary font-semibold text-primary-foreground',
                !isSelected && isAvailable && !isPast && 'bg-accent font-semibold text-accent-foreground hover:bg-accent/70',
                (isPast || !isAvailable) && 'text-disabled-foreground',
                isToday && !isSelected && 'ring-1 ring-border',
              )}
            >
              {date.getDate()}
              {isToday && (
                <span
                  className="absolute bottom-[9px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-[clamp(0.75rem,2.9vh,1.5rem)] text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent ring-1 ring-inset ring-accent-foreground/30" />
          Есть свободное время
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" />
          Выбрано
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full ring-1 ring-border" />
          Сегодня
        </span>
      </div>
    </section>
  )
}
