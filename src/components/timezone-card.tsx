import { Globe } from 'lucide-react'

import { TimeFormatToggle } from '@/components/time-format-toggle'
import { TimeZoneSelect } from '@/components/timezone-select'
import { formatZoneShort } from '@/utils/timezone'

interface TimezoneCardProps {
  timeZone: string
  onTimeZoneChange: (timeZone: string) => void
}

export function TimezoneCard({ timeZone, onTimeZoneChange }: TimezoneCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3">
      <TimeZoneSelect
        value={timeZone}
        onChange={onTimeZoneChange}
        labelIcon={<Globe className="size-4 text-muted-foreground" strokeWidth={1.8} />}
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Формат: 24 ч / 12 ч</span>
        <TimeFormatToggle />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Время показано по поясу: {formatZoneShort(timeZone)}
      </p>
    </div>
  )
}
