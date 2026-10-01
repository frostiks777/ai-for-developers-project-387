import type { AvailabilitySettings } from '@/types/availability-settings'
import type { TimeSlot } from '@/types/booking'
import { cn } from '@/lib/utils'
import { weekdayAndMinuteInZone } from '@/utils/timezone'

interface AvailabilityPreviewProps {
  settings: AvailabilitySettings
  slots?: TimeSlot[]
}

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
}

const minuteToLabel = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`

// «Неделя глазами гостя»: сетка Пн–Пт × времена начал по черновику правил.
// Часы показаны в поясе правил (settings.timeZone). Если переданы слоты,
// занятые окна (isBooked) помечаются как встречи.
// Шаг сетки — slotDurationMin: буферы сетку не двигают (#89).
export function AvailabilityPreview({ settings, slots = [] }: AvailabilityPreviewProps) {
  const step = settings.slotDurationMin

  const times = new Set<string>()

  for (const range of settings.ranges) {
    for (
      let minute = range.startMinute;
      minute + settings.slotDurationMin <= range.endMinute;
      minute += step
    ) {
      times.add(minuteToLabel(minute))
    }
  }

  const timeLabels = Array.from(times).sort()

  if (timeLabels.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных для превью</p>
  }

  const meetings = new Set<string>()
  const meetingWeekdays = new Set<number>()

  for (const slot of slots) {
    if (!slot.isBooked) {
      continue
    }

    const { weekday, minute } = weekdayAndMinuteInZone(slot.startAt, settings.timeZone)
    meetings.add(`${weekday}:${minuteToLabel(minute)}`)
    meetingWeekdays.add(weekday)
  }

  // Колонки берём из правил, а не из захардкоженного Пн–Пт: организатор вправе
  // добавить субботу или воскресенье, и превью обязано это показывать (#76).
  // Дни со встречами добавляем тоже — иначе занятые слоты на снятом дне стали
  // бы невидимыми (регрессия #57).
  const weekdays = Array.from(
    new Set([...settings.ranges.map((range) => range.weekday), ...meetingWeekdays]),
  )
    .sort((a, b) => a - b)
    .map((value) => ({ value, label: WEEKDAY_LABELS[value] ?? String(value) }))

  const hasFree = (weekday: number, timeLabel: string): boolean =>
    settings.ranges.some((range) => {
      const [hours, minutes] = timeLabel.split(':').map(Number)
      const minute = hours * 60 + minutes

      return (
        range.weekday === weekday &&
        minute >= range.startMinute &&
        minute + settings.slotDurationMin <= range.endMinute
      )
    })

  return (
    <div className="w-full">
      {/*
        Сетка растягивается на ширину блока (table-fixed + w-full), ячейки
        получают равные доли, а отступы между ними задаёт border-spacing.
        -mx-1 компенсирует внешний отступ border-spacing слева и справа, чтобы
        крайние ячейки вставали ровно по краю карточки — как остальные пункты
        формы (текст, поля, переключатели).
      */}
      <table className="-mx-1 w-full table-fixed border-separate border-spacing-1 text-[12px]">
        <colgroup>
          <col className="w-14 sm:w-20" />
          {weekdays.map((day) => (
            <col key={day.value} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th />
            {weekdays.map((day) => (
              <th key={day.value} className="px-1 text-center font-normal text-muted-foreground">
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeLabels.map((timeLabel) => (
            <tr key={timeLabel}>
              <td className="pr-1 text-right align-middle tabular-nums text-muted-foreground">
                {timeLabel}
              </td>
              {weekdays.map((day) => {
                const key = `${day.value}:${timeLabel}`
                const state = meetings.has(key)
                  ? 'meeting'
                  : hasFree(day.value, timeLabel)
                    ? 'free'
                    : 'off'

                return (
                  <td key={key} data-state={state} className="h-4 p-0 align-middle">
                    <span
                      className={cn(
                        'block h-4 w-full rounded-[3px]',
                        state === 'meeting' && 'bg-primary',
                        state === 'free' && 'bg-accent',
                        state === 'off' && 'bg-secondary/40',
                      )}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
