import { useState } from 'react'
import { Copy, Globe, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvailabilityPreview } from '@/components/availability-preview'
import { TimeZoneSelect } from '@/components/timezone-select'
import { cn } from '@/lib/utils'
import type { AvailabilityRange, AvailabilitySettings } from '@/types/availability-settings'
import type { TimeSlot } from '@/types/booking'

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 7, label: 'Вс' },
]

const DEFAULT_INTERVAL: AvailabilityRange = { weekday: 0, startMinute: 600, endMinute: 1080 }

const PRESETS: { label: string; weekdays: number[]; startMinute: number; endMinute: number }[] = [
  { label: 'Пн–Пт, 10:00–18:00', weekdays: [1, 2, 3, 4, 5], startMinute: 600, endMinute: 1080 },
  { label: 'Пн–Пт, 09:00–18:00', weekdays: [1, 2, 3, 4, 5], startMinute: 540, endMinute: 1080 },
  { label: 'Каждый день, 10:00–20:00', weekdays: [1, 2, 3, 4, 5, 6, 7], startMinute: 600, endMinute: 1200 },
]

const minuteToTime = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`

const timeToMinute = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

interface PositionedRange {
  index: number
  range: AvailabilityRange
}

function sortedDayRanges(ranges: AvailabilityRange[], weekday: number): PositionedRange[] {
  return ranges
    .map((range, index) => ({ index, range }))
    .filter((item) => item.range.weekday === weekday)
    .sort((a, b) => a.range.startMinute - b.range.startMinute)
}

function computeErrors(ranges: AvailabilityRange[], slotDurationMin: number): Map<string, string> {
  const errors = new Map<string, string>()

  for (const { value: weekday } of WEEKDAYS) {
    const dayRanges = ranges
      .filter((range) => range.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute)

    dayRanges.forEach((range, position) => {
      if (range.endMinute <= range.startMinute) {
        errors.set(`${weekday}:${position}:end`, 'Время окончания должно быть позже времени начала')
        return
      }

      if (range.endMinute - range.startMinute < slotDurationMin) {
        errors.set(`${weekday}:${position}:end`, `Интервал не короче ${slotDurationMin} мин`)
      }
    })

    for (let position = 1; position < dayRanges.length; position += 1) {
      if (dayRanges[position].startMinute < dayRanges[position - 1].endMinute) {
        errors.set(`${weekday}:${position}:start`, 'Интервалы пересекаются')
        errors.set(`${weekday}:${position - 1}:end`, 'Интервалы пересекаются')
      }
    }
  }

  return errors
}

interface AvailabilitySettingsFormProps {
  settings: AvailabilitySettings
  isSaving: boolean
  onSave: (settings: AvailabilitySettings) => Promise<boolean>
  slots?: TimeSlot[]
}

export function AvailabilitySettingsForm({
  settings,
  isSaving,
  onSave,
  slots = [],
}: AvailabilitySettingsFormProps) {
  const [draft, setDraft] = useState<AvailabilitySettings>(settings)
  const [copySource, setCopySource] = useState<number | null>(null)
  const [copyTargets, setCopyTargets] = useState<number[]>([])

  const rangesFor = (weekday: number) =>
    draft.ranges
      .filter((range) => range.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute)

  const errors = computeErrors(draft.ranges, draft.slotDurationMin)
  const hasErrors = errors.size > 0

  const toggleDay = (weekday: number) => {
    setDraft((prev) => {
      const hasDay = prev.ranges.some((range) => range.weekday === weekday)

      return {
        ...prev,
        ranges: hasDay
          ? prev.ranges.filter((range) => range.weekday !== weekday)
          : [...prev.ranges, { ...DEFAULT_INTERVAL, weekday }],
      }
    })
  }

  const addInterval = (weekday: number) => {
    setDraft((prev) => {
      const dayRanges = prev.ranges.filter((range) => range.weekday === weekday)
      const lastEnd = dayRanges.length
        ? Math.max(...dayRanges.map((range) => range.endMinute))
        : DEFAULT_INTERVAL.startMinute
      const lengthMin = 60
      const startMinute = Math.min(lastEnd, 24 * 60 - lengthMin)
      const endMinute = Math.min(startMinute + lengthMin, 24 * 60)

      return {
        ...prev,
        ranges: [...prev.ranges, { weekday, startMinute, endMinute }],
      }
    })
  }

  const updateInterval = (
    weekday: number,
    position: number,
    patch: Partial<AvailabilityRange>,
  ) => {
    setDraft((prev) => {
      const target = sortedDayRanges(prev.ranges, weekday)[position]

      if (!target) {
        return prev
      }

      return {
        ...prev,
        ranges: prev.ranges.map((range, index) =>
          index === target.index ? { ...range, ...patch } : range,
        ),
      }
    })
  }

  const removeInterval = (weekday: number, position: number) => {
    setDraft((prev) => {
      const target = sortedDayRanges(prev.ranges, weekday)[position]

      if (!target) {
        return prev
      }

      return {
        ...prev,
        ranges: prev.ranges.filter((_, index) => index !== target.index),
      }
    })
  }

  const applyPreset = (weekdays: number[], startMinute: number, endMinute: number) => {
    const previous = draft
    setDraft((prev) => ({
      ...prev,
      ranges: weekdays.map((weekday) => ({ weekday, startMinute, endMinute })),
    }))
    toast.success('Пресет применён', {
      action: { label: 'Отменить', onClick: () => setDraft(previous) },
    })
  }

  const openCopy = (weekday: number) => {
    setCopySource(weekday)
    setCopyTargets([])
  }

  const toggleCopyTarget = (weekday: number) => {
    setCopyTargets((prev) =>
      prev.includes(weekday) ? prev.filter((value) => value !== weekday) : [...prev, weekday],
    )
  }

  const applyCopy = () => {
    if (copySource === null || copyTargets.length === 0) {
      return
    }

    const source = draft.ranges.filter((range) => range.weekday === copySource)

    setDraft((prev) => ({
      ...prev,
      ranges: [
        ...prev.ranges.filter((range) => !copyTargets.includes(range.weekday)),
        ...copyTargets.flatMap((weekday) => source.map((range) => ({ ...range, weekday }))),
      ],
    }))
    setCopySource(null)
  }

  const hasAnyDay = draft.ranges.length > 0

  const firstRange = [...draft.ranges].sort(
    (a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute,
  )[0]
  // Шаг сетки — только длительность слота: буферы не входят в сетку (#89).
  const slotsPerDay = firstRange
    ? Math.max(
        0,
        Math.floor((firstRange.endMinute - firstRange.startMinute) / draft.slotDurationMin),
      )
    : 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!hasAnyDay || hasErrors) {
      return
    }

    await onSave(draft)
  }

  const copySourceLabel = WEEKDAYS.find(({ value }) => value === copySource)?.label

  const renderTimeInputs = (
    weekday: number,
    label: string,
    position: number,
    range: AvailabilityRange,
  ) => {
    const startError = errors.get(`${weekday}:${position}:start`)
    const endError = errors.get(`${weekday}:${position}:end`)

    // Обёртка держит минимальную ширину пары полей: если места в строке не хватает,
    // переносится вся группа, а поля не «вылезают» под кнопки (#49).
    return (
      <div className="flex min-w-[208px] flex-1 items-center gap-1 sm:min-w-0 sm:flex-none">
        <input
          type="time"
          aria-label={`${label}: начало ${position + 1}`}
          value={minuteToTime(range.startMinute)}
          onChange={(event) => {
            if (!event.target.value) {
              return
            }
            updateInterval(weekday, position, { startMinute: timeToMinute(event.target.value) })
          }}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm sm:w-[112px] sm:flex-none',
            startError ? 'border-destructive' : 'border-input',
          )}
          step={600}
          lang="ru"
        />
        <span className="shrink-0 text-muted-foreground">–</span>
        <input
          type="time"
          aria-label={`${label}: конец ${position + 1}`}
          value={minuteToTime(range.endMinute)}
          onChange={(event) => {
            if (!event.target.value) {
              return
            }
            updateInterval(weekday, position, { endMinute: timeToMinute(event.target.value) })
          }}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm sm:w-[112px] sm:flex-none',
            endError ? 'border-destructive' : 'border-input',
          )}
          step={600}
          lang="ru"
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <TimeZoneSelect
          value={draft.timeZone}
          onChange={(timeZone) => setDraft((prev) => ({ ...prev, timeZone }))}
          labelIcon={<Globe className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />}
        />
        <p className="text-[13px] text-muted-foreground">
          Часы ниже — в этом поясе. Гости видят их в своём.
        </p>
      </div>

      <AvailabilityPreview settings={draft} slots={slots} />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset.weekdays, preset.startMinute, preset.endMinute)}
          >
            {preset.label}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset([], 0, 0)}>
          Очистить всё
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {WEEKDAYS.map(({ value, label }) => {
          const ranges = rangesFor(value)
          const isEnabled = ranges.length > 0

          return (
            <div key={value} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={`${label}: доступность`}
                  onClick={() => toggleDay(value)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isEnabled ? 'bg-primary' : 'bg-input',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-4 rounded-full bg-background shadow transition-transform',
                      isEnabled ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </button>
                <span
                  className={cn(
                    'w-6 shrink-0 text-sm font-semibold',
                    !isEnabled && 'text-muted-foreground/60',
                  )}
                >
                  {label}
                </span>

                {isEnabled ? (
                  <>
                    {renderTimeInputs(value, label, 0, ranges[0])}
                    {/* На узком экране группа переносится на вторую строку и прижимается вправо */}
                    <div className="flex shrink-0 items-center gap-1 max-sm:ml-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Добавить интервал: ${label}`}
                        onClick={() => addInterval(value)}
                        className="h-9 w-9 shrink-0 sm:h-7 sm:w-7"
                      >
                        <Plus className="size-4" strokeWidth={1.8} aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Скопировать интервал: ${label}`}
                        onClick={() => openCopy(value)}
                        className="h-9 w-9 shrink-0 sm:h-7 sm:w-7"
                      >
                        <Copy className="size-4" strokeWidth={1.8} aria-hidden="true" />
                      </Button>
                      {ranges.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Убрать интервал: ${label} 1`}
                          onClick={() => removeInterval(value, 0)}
                          className="h-9 w-9 shrink-0 sm:h-7 sm:w-7"
                        >
                          <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Недоступен</span>
                )}
              </div>

              {isEnabled && (errors.get(`${value}:0:start`) ?? errors.get(`${value}:0:end`)) && (
                <p className="pl-9 text-xs text-destructive">
                  {errors.get(`${value}:0:start`) ?? errors.get(`${value}:0:end`)}
                </p>
              )}

              {ranges.slice(1).map((range, index) => {
                const position = index + 1
                const error = errors.get(`${value}:${position}:start`) ?? errors.get(`${value}:${position}:end`)

                return (
                  <div key={`${value}-${position}`} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 pl-9">
                      {renderTimeInputs(value, label, position, range)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Убрать интервал: ${label} ${position + 1}`}
                        onClick={() => removeInterval(value, position)}
                        className="h-9 w-9 shrink-0 sm:h-7 sm:w-7"
                      >
                        <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
                      </Button>
                    </div>
                    {error && <p className="pl-9 text-xs text-destructive">{error}</p>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="buffer-before">Буфер до, мин</Label>
          <Input
            id="buffer-before"
            type="number"
            min={0}
            max={480}
            value={draft.bufferBeforeMin}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, bufferBeforeMin: Number(event.target.value) }))
            }
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="buffer-after">Буфер после, мин</Label>
          <Input
            id="buffer-after"
            type="number"
            min={0}
            max={480}
            value={draft.bufferAfterMin}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, bufferAfterMin: Number(event.target.value) }))
            }
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="min-notice">Не позже чем за, мин</Label>
          <Input
            id="min-notice"
            type="number"
            min={0}
            max={10080}
            value={draft.minNoticeMin}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, minNoticeMin: Number(event.target.value) }))
            }
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="horizon-days">Открыто на, дней</Label>
          <Input
            id="horizon-days"
            type="number"
            min={1}
            max={90}
            value={draft.horizonDays}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, horizonDays: Number(event.target.value) }))
            }
          />
          <div className="flex gap-1">
            {[14, 30, 60].map((days) => (
              <Button
                key={days}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={draft.horizonDays === days}
                onClick={() => setDraft((prev) => ({ ...prev, horizonDays: days }))}
                className="h-7 px-2 text-xs"
              >
                {days}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">
        ≈ {slotsPerDay} слотов в рабочий день. Интервалы одного дня не должны пересекаться.
      </p>

      {!hasAnyDay && <p className="text-destructive">Выберите хотя бы один рабочий день</p>}

      <Button type="submit" disabled={isSaving || !hasAnyDay || hasErrors}>
        Сохранить
      </Button>

      <Dialog
        open={copySource !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCopySource(null)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Скопировать «{copySourceLabel}» на дни</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {WEEKDAYS.filter(({ value }) => value !== copySource).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={copyTargets.includes(value)}
                  onChange={() => toggleCopyTarget(value)}
                  className="size-4 rounded border-input"
                />
                {label}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" disabled={copyTargets.length === 0} onClick={applyCopy}>
              Скопировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
