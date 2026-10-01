import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DaySwitcherProps {
  dateTitle: string
  subtitle: string
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}

export function DaySwitcher({
  dateTitle,
  subtitle,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: DaySwitcherProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        aria-label="Предыдущий день"
        disabled={!canPrev}
        onClick={onPrev}
        className="flex size-11 items-center justify-center rounded-full border border-input bg-card transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
      <div className="min-w-0 text-center">
        <p className="truncate text-lg font-bold">{dateTitle}</p>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      <button
        type="button"
        aria-label="Следующий день"
        disabled={!canNext}
        onClick={onNext}
        className="flex size-11 items-center justify-center rounded-full border border-input bg-card transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  )
}
