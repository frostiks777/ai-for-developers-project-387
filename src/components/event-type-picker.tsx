import { LocationType, type EventType } from '@/api/generated'
import { cn } from '@/lib/utils'

interface EventTypePickerProps {
  types: EventType[]
  selectedId: string | null
  onSelect: (type: EventType) => void
  layout?: 'cards' | 'chips'
  className?: string
}

const LOCATION_SHORT: Record<LocationType, string> = {
  [LocationType.Online]: 'онлайн',
  [LocationType.Offline]: 'офлайн',
  [LocationType.Phone]: 'звонок',
}

export function EventTypePicker({
  types,
  selectedId,
  onSelect,
  layout = 'cards',
  className,
}: EventTypePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Тип встречи"
      className={cn(
        layout === 'cards' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2',
        className,
      )}
    >
      {types.map((type) => {
        const isSelected = type.id === selectedId

        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(type)}
            className={cn(
              'border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              layout === 'cards' ? 'h-[60px] rounded-xl px-3.5' : 'h-10 rounded-lg px-3 text-sm',
              isSelected
                ? 'border-primary bg-accent text-accent-foreground'
                : 'border-transparent bg-secondary/60 text-foreground hover:bg-accent/60',
            )}
          >
            {layout === 'cards' ? (
              <>
                <span className="block truncate text-sm font-semibold">{type.title}</span>
                <span
                  className={cn(
                    'mt-0.5 block truncate text-xs',
                    isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {type.durationMin} мин · {LOCATION_SHORT[type.locationType]}
                </span>
              </>
            ) : (
              <span className="whitespace-nowrap">
                {type.title} · {type.durationMin} мин
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
