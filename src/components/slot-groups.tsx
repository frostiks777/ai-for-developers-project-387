import { Check } from 'lucide-react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { useTimeFormat } from '@/hooks/use-time-format'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { formatTimeInZone, hourInZone } from '@/utils/timezone'

interface SlotGroupsProps {
  slots: TimeSlot[]
  selectedSlotId: number | null
  currentSlotId?: number | null
  timeZone: string
  columns?: 3 | 4 | 5
  onSelect: (slot: TimeSlot) => void
}

const GROUPS = [
  { id: 'morning', label: 'Утром', test: (hour: number) => hour < 12 },
  { id: 'day', label: 'Днём', test: (hour: number) => hour >= 12 && hour < 16 },
  { id: 'evening', label: 'Вечером', test: (hour: number) => hour >= 16 },
] as const

export function SlotGroups({
  slots,
  selectedSlotId,
  currentSlotId = null,
  timeZone,
  columns = 5,
  onSelect,
}: SlotGroupsProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { hour12 } = useTimeFormat()

  const groups = GROUPS.map((group) => ({
    ...group,
    slots: slots.filter((slot) => group.test(hourInZone(slot.startAt, timeZone))),
  })).filter((group) => group.slots.length > 0)

  const buttonSize = isDesktop
    ? 'h-[46px] rounded-[10px] text-[15px] font-semibold'
    : 'h-[52px] rounded-[14px] text-base font-bold'

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const labelId = `slot-group-${group.id}`

        return (
          <div key={group.id} role="group" aria-labelledby={labelId}>
            <p
              id={labelId}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {group.label}
            </p>
            <div
              className={cn(
                'mt-2 grid gap-2',
                columns === 3 && 'grid-cols-3',
                columns === 4 && 'grid-cols-4',
                columns === 5 && 'grid-cols-5',
              )}
            >
              {group.slots.map((slot) => {
                const time = formatTimeInZone(slot.startAt, timeZone, hour12)
                const isCurrent = slot.id === currentSlotId

                if (isCurrent) {
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled
                      aria-label={`${time}, текущее время`}
                      className={cn(
                        'flex flex-col items-center justify-center border-2 border-selected bg-secondary text-[13px] font-semibold text-selected-foreground',
                        buttonSize,
                      )}
                    >
                      <span className="line-through">{time}</span>
                      <span className="text-[11px] font-normal">сейчас</span>
                    </button>
                  )
                }

                if (slot.isBooked) {
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled
                      aria-label={`${time}, занято`}
                      className={cn(
                        'flex flex-col items-center justify-center border border-dashed border-input bg-[repeating-linear-gradient(135deg,hsl(var(--secondary))_0_6px,hsl(var(--card))_6px_12px)] text-disabled-foreground',
                        buttonSize,
                      )}
                    >
                      <span className="line-through">{time}</span>
                      <span className="text-[11px] font-normal">занято</span>
                    </button>
                  )
                }

                const isSelected = slot.id === selectedSlotId

                return (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(slot)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      buttonSize,
                      isSelected
                        ? 'border-highlight bg-highlight text-highlight-foreground shadow-glow'
                        : 'border-primary bg-card/60 text-primary hover:bg-accent',
                    )}
                  >
                    {isSelected && <Check className="size-4" strokeWidth={1.8} aria-hidden="true" />}
                    {time}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
