import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { searchTimeZones, timeZoneOptionLabel } from '@/utils/timezone'

interface TimeZoneSelectProps {
  value: string
  onChange: (timeZone: string) => void
  labelIcon?: ReactNode
  hideLabel?: boolean
  className?: string
}

export function TimeZoneSelect({
  value,
  onChange,
  labelIcon,
  hideLabel = false,
  className,
}: TimeZoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const options = useMemo(() => searchTimeZones(query), [query])

  const handleSelect = (timeZone: string) => {
    onChange(timeZone)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className={cn('relative grid gap-2', className)}>
      <Label htmlFor="timezone" className={cn('flex items-center gap-2', hideLabel && 'sr-only')}>
        {labelIcon}
        Часовой пояс
      </Label>
      <input
        id="timezone"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="timezone-listbox"
        aria-autocomplete="list"
        autoComplete="off"
        value={isOpen ? query : value}
        placeholder="Поиск пояса…"
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          setIsOpen(true)
          setQuery('')
        }}
        onBlur={() => setIsOpen(false)}
        className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />

      {isOpen && (
        <ul
          id="timezone-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card p-1 text-sm shadow-soft"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground">Ничего не найдено</li>
          )}
          {options.map((timeZone) => (
            <li key={timeZone}>
              <button
                type="button"
                role="option"
                aria-selected={timeZone === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(timeZone)}
                className={cn(
                  'flex w-full items-center rounded-md px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground',
                  timeZone === value && 'bg-accent/60 font-medium',
                )}
              >
                {timeZoneOptionLabel(timeZone)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
