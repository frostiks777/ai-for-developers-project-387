import { cn } from '@/lib/utils'
import { useTimeFormat } from '@/hooks/use-time-format'

interface TimeFormatToggleProps {
  className?: string
}

export function TimeFormatToggle({ className }: TimeFormatToggleProps) {
  const { hour12, setHour12 } = useTimeFormat()

  return (
    <div
      role="group"
      aria-label="Формат времени"
      className={cn(
        'inline-flex w-fit items-center rounded-full border border-input bg-card p-0.5 text-[13px]',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={!hour12}
        onClick={() => setHour12(false)}
        className={cn(
          'rounded-full px-2 py-0.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !hour12 ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        )}
      >
        24 ч
      </button>
      <button
        type="button"
        aria-pressed={hour12}
        onClick={() => setHour12(true)}
        className={cn(
          'rounded-full px-2 py-0.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          hour12 ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        )}
      >
        12 ч
      </button>
    </div>
  )
}
