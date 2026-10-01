import { useTimeFormat } from '@/hooks/use-time-format'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { formatDayShortTitle, formatTimeInZone, toDateKeyInZone } from '@/utils/timezone'

interface SlotSuggestionsProps {
  slots: TimeSlot[]
  timeZone: string
  limit?: number
  onSelect: (slot: TimeSlot) => void
}

export function SlotSuggestions({
  slots,
  timeZone,
  limit = 3,
  onSelect,
}: SlotSuggestionsProps) {
  const { hour12 } = useTimeFormat()
  const suggestions = slots.slice(0, limit)

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {suggestions.map((slot) => (
        <button
          key={slot.id}
          type="button"
          onClick={() => onSelect(slot)}
          className={cn(
            'flex h-[46px] items-center gap-1.5 rounded-[10px] border border-primary bg-card/60 px-3 text-[15px] font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          title={formatDayShortTitle(toDateKeyInZone(new Date(slot.startAt), timeZone))}
        >
          {formatTimeInZone(slot.startAt, timeZone, hour12)}
        </button>
      ))}
    </div>
  )
}
