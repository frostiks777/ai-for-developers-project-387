import { ArrowRight } from 'lucide-react'

import { useTimeFormat } from '@/hooks/use-time-format'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { formatTimeInZone, formatTimeRange } from '@/utils/timezone'

interface SlotGridProps {
  slots: TimeSlot[]
  selectedSlotId: number | null
  timeZone: string
  onSelect: (slot: TimeSlot) => void
  onConfirm: () => void
  columns?: 2 | 3
}

export function SlotGrid({
  slots,
  selectedSlotId,
  timeZone,
  onSelect,
  onConfirm,
  columns = 2,
}: SlotGridProps) {
  const isDesktop = columns === 2
  const { hour12 } = useTimeFormat()

  return (
    <div className={cn('grid gap-2', isDesktop ? 'grid-cols-2' : 'grid-cols-3')}>
      {slots.map((slot) => {
        const isSelected = slot.id === selectedSlotId
        const time = formatTimeInZone(slot.startAt, timeZone, hour12)

        if (slot.isBooked) {
          return (
            <button
              key={slot.id}
              type="button"
              disabled
              aria-label={`${time}, занято`}
              className={cn(
                'flex h-12 items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-background text-[15px] text-disabled-foreground',
                isDesktop && 'col-span-1',
              )}
            >
              <span className="line-through">{time}</span>
              {isDesktop && <span>занято</span>}
            </button>
          )
        }

        if (isSelected && isDesktop) {
          return (
            <button
              key={slot.id}
              type="button"
              aria-label="Забронировать"
              aria-pressed="true"
              onClick={onConfirm}
              className="col-span-2 flex h-12 overflow-hidden rounded-lg text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex flex-1 items-center justify-center bg-selected text-selected-foreground">
                {formatTimeRange(slot, timeZone, hour12)}
              </span>
              <span className="flex items-center gap-1.5 bg-primary px-4 text-primary-foreground">
                Забронировать
                <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </button>
          )
        }

        return (
          <button
            key={slot.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(slot)}
            className={cn(
              'h-12 rounded-lg border text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-primary bg-card text-primary hover:bg-accent',
            )}
          >
            {time}
          </button>
        )
      })}
    </div>
  )
}
