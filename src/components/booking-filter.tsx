import { cn } from '@/lib/utils'

export type BookingFilterValue = 'upcoming' | 'past' | 'canceled'

interface BookingFilterProps {
  value: BookingFilterValue
  onChange: (value: BookingFilterValue) => void
}

const options: Array<{ value: BookingFilterValue; label: string }> = [
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'past', label: 'Прошедшие' },
  { value: 'canceled', label: 'Отменённые' },
]

export function BookingFilter({ value, onChange }: BookingFilterProps) {
  return (
    // На мобильном табы занимают всю ширину и делят её поровну: иначе группа
    // inline-flex не может сжаться и «Отменённые» вылезает за карточку.
    <div
      role="tablist"
      aria-label="Статус"
      className="flex w-full min-w-0 rounded-lg bg-secondary p-0.5 sm:w-auto sm:inline-flex"
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 min-w-0 flex-1 rounded-md px-2 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-none sm:px-3.5 sm:text-[13px]',
              isActive ? 'bg-segment-active font-semibold text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
