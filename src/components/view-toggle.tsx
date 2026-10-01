import type { BookingView } from '@/hooks/use-booking-view'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  value: BookingView
  onChange: (view: BookingView) => void
  className?: string
}

const VIEWS: { value: BookingView; label: string }[] = [
  { value: 'days', label: 'Дни' },
  { value: 'week', label: 'Неделя' },
]

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Вид выбора времени"
      className={cn(
        'inline-flex h-9 items-center rounded-full bg-secondary p-[3px] text-[13px]',
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' && value === 'days') {
          event.preventDefault()
          onChange('week')
        }

        if (event.key === 'ArrowLeft' && value === 'week') {
          event.preventDefault()
          onChange('days')
        }
      }}
    >
      {VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          role="tab"
          aria-selected={value === view.value}
          onClick={() => onChange(view.value)}
          className={cn(
            'h-[30px] rounded-full px-3.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === view.value
              ? 'bg-card font-semibold text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
