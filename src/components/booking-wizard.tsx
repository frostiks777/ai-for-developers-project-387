import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Sparkles } from 'lucide-react'

import type { EventType } from '@/api/generated'
import { BookingForm } from '@/components/booking-form'
import { DayList } from '@/components/day-list'
import { DaySwitcher } from '@/components/day-switcher'
import { EventTypePicker } from '@/components/event-type-picker'
import { SlotGroups } from '@/components/slot-groups'
import { TimeZoneSelect } from '@/components/timezone-select'
import { useTimeFormat } from '@/hooks/use-time-format'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { pluralRu } from '@/utils/plural'
import {
  formatDayShortTitle,
  formatTimeInZone,
  formatTimeRange,
  formatZoneShort,
  toDateKeyInZone,
} from '@/utils/timezone'

type Step = 'day' | 'time' | 'contacts'

const STEP_INDEX: Record<Step, number> = { day: 1, time: 2, contacts: 3 }
const STEP_LABEL: Record<Step, string> = { day: 'ДЕНЬ', time: 'ВРЕМЯ', contacts: 'КОНТАКТЫ' }
const PROGRESS_WIDTH: Record<Step, string> = {
  day: 'w-1/3',
  time: 'w-2/3',
  contacts: 'w-full',
}

interface BookingWizardProps {
  slots: TimeSlot[]
  timeZone: string
  onTimeZoneChange: (timeZone: string) => void
  eventTypes: EventType[]
  selectedTypeId: string | null
  onSelectType: (type: EventType) => void
  selectedTypeTitle: string | null
  hostSlug: string
  hostName: string
  selectedSlot: TimeSlot | null
  onSelectSlot: (slot: TimeSlot) => void
  suggestions?: TimeSlot[]
  onSelectSuggestion?: (slot: TimeSlot) => void
  onBooked: (booking: CreatedBooking) => void
  onConflict: (slot: TimeSlot) => void
  // CAPTCHA (ADR-0025) — пробрасывается в форму на шаге «Контакты».
  captchaRequired?: boolean
  captchaSiteKey?: string | null
}

export function BookingWizard({
  slots,
  timeZone,
  onTimeZoneChange,
  eventTypes,
  selectedTypeId,
  onSelectType,
  selectedTypeTitle,
  hostSlug,
  hostName,
  selectedSlot,
  onSelectSlot,
  suggestions = [],
  onSelectSuggestion,
  onBooked,
  onConflict,
  captchaRequired = false,
  captchaSiteKey = null,
}: BookingWizardProps) {
  const { hour12 } = useTimeFormat()
  const [step, setStep] = useState<Step>('day')
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false)
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const freeSlots = useMemo(
    () =>
      slots
        .filter((slot) => !slot.isBooked)
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)),
    [slots],
  )

  const dateKeys = useMemo(
    () => Array.from(new Set(freeSlots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone)))).sort(),
    [freeSlots, timeZone],
  )

  const effectiveDate =
    activeDate !== null && dateKeys.includes(activeDate) ? activeDate : (dateKeys[0] ?? null)
  const visibleSlots = effectiveDate
    ? slots.filter((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone) === effectiveDate)
    : []
  const freeCount = visibleSlots.filter((slot) => !slot.isBooked).length

  const nearest = freeSlots[0] ?? null

  useEffect(() => {
    const onPop = () => {
      setStep((current) => (current === 'contacts' ? 'time' : 'day'))
    }

    window.addEventListener('popstate', onPop)

    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (step !== 'day') {
      headingRef.current?.focus()
    }
  }, [step])

  const advance = (next: Step) => {
    window.history.pushState({ step: next }, '')
    setStep(next)
  }

  const activeTypes = eventTypes.filter((type) => type.isActive)
  const durationMin = slots[0]?.durationMin ?? null

  const progressFor = (stepName: Step) => (
    <div className="mb-3">
      <p className="text-[12px] font-semibold tracking-wide text-muted-foreground">
        ШАГ {STEP_INDEX[stepName]} ИЗ 3 · {STEP_LABEL[stepName]}
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full bg-gradient-to-r from-primary to-highlight ${PROGRESS_WIDTH[stepName]}`} />
      </div>
    </div>
  )

  const dayView = (
    <div className="flex flex-col gap-5">
        {progressFor('day')}

        <section>
          <p className="text-[13px] text-muted-foreground">{hostName}</p>
          <h2 className="mt-1 font-serif text-[26px] font-semibold leading-tight">
            {selectedTypeTitle ?? 'Встреча'}
          </h2>
          <button
            type="button"
            aria-expanded={isTypePickerOpen}
            onClick={() => setIsTypePickerOpen((open) => !open)}
            className="mt-2 text-[13px] text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {durationMin !== null ? `${durationMin} мин · онлайн` : 'Онлайн-звонок'} · другой формат
          </button>
          {isTypePickerOpen && (
            <div className="mt-3">
              <EventTypePicker
                types={activeTypes}
                selectedId={selectedTypeId}
                onSelect={(type) => {
                  onSelectType(type)
                  setIsTypePickerOpen(false)
                }}
              />
            </div>
          )}
        </section>

        {nearest && (
          <section className="glass rounded-2xl p-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-highlight px-2.5 py-1 text-[11px] font-bold text-highlight-foreground">
              <Sparkles className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
              БЛИЖАЙШЕЕ СВОБОДНОЕ
            </span>
            <p className="mt-2 text-lg font-bold">
              {formatDayShortTitle(toDateKeyInZone(new Date(nearest.startAt), timeZone))},{' '}
              {formatTimeInZone(nearest.startAt, timeZone, hour12)}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectSlot(nearest)
                advance('contacts')
              }}
              className="mt-3 h-12 w-full rounded-xl bg-highlight text-base font-semibold text-highlight-foreground shadow-glow transition-colors hover:bg-highlight/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Выбрать это время
            </button>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-[15px] font-semibold">Или выберите день</h3>
          <div className="glass rounded-2xl p-2">
            <DayList
              slots={slots}
              timeZone={timeZone}
              onSelectDate={(dateKey) => {
                setActiveDate(dateKey)
                advance('time')
              }}
            />
          </div>
        </section>

        <div>
          <button
            type="button"
            aria-expanded={isTimezoneOpen}
            onClick={() => setIsTimezoneOpen((open) => !open)}
            className="text-[13px] text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Время по поясу {formatZoneShort(timeZone)} · изменить
          </button>
          {isTimezoneOpen && (
            <div className="mt-3">
              <TimeZoneSelect value={timeZone} onChange={onTimeZoneChange} />
            </div>
          )}
        </div>
      </div>
  )

    const dateIndex = effectiveDate ? dateKeys.indexOf(effectiveDate) : -1
    const prevDate = dateIndex > 0 ? dateKeys[dateIndex - 1] : null
    const nextDate =
      dateIndex >= 0 && dateIndex < dateKeys.length - 1 ? dateKeys[dateIndex + 1] : null
    const startAt = effectiveDate ? formatDayShortTitle(effectiveDate) : ''

    const timeView = (
      <div className="flex flex-col gap-5 pb-28">
        {progressFor('time')}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep('day')}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} aria-hidden="true" /> Дни
          </button>
          <h2 ref={step === 'time' ? headingRef : undefined} tabIndex={-1} className="truncate text-sm font-semibold">
            {selectedTypeTitle ?? 'Встреча'}
          </h2>
        </div>

        {effectiveDate && (
          <DaySwitcher
            dateTitle={startAt}
            subtitle={`${freeCount} ${pluralRu(freeCount, ['свободное окно', 'свободных окна', 'свободных окон'])} · ${formatZoneShort(timeZone)}`}
            onPrev={() => prevDate && setActiveDate(prevDate)}
            onNext={() => nextDate && setActiveDate(nextDate)}
            canPrev={prevDate !== null}
            canNext={nextDate !== null}
          />
        )}

        <SlotGroups
          slots={visibleSlots}
          selectedSlotId={selectedSlot?.id ?? null}
          timeZone={timeZone}
          columns={3}
          onSelect={onSelectSlot}
        />

        {selectedSlot && (
          <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-white/75 bg-card/80 px-5 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-white/10">
            <div className="mx-auto flex w-full max-w-md items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {formatDayShortTitle(toDateKeyInZone(new Date(selectedSlot.startAt), timeZone))}
                </p>
                <p className="text-lg font-bold">
                  {formatTimeRange(selectedSlot, timeZone, hour12)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => advance('contacts')}
                className="h-14 shrink-0 rounded-[14px] bg-highlight px-7 text-[17px] font-semibold text-highlight-foreground shadow-glow transition-colors hover:bg-highlight/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Далее
              </button>
            </div>
          </div>
        )}
      </div>
  )

  const contactsView = (
    <div className="flex flex-col gap-5 pb-28">
      {progressFor('contacts')}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStep('time')}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} aria-hidden="true" /> Время
        </button>
        <h2 ref={step === 'contacts' ? headingRef : undefined} tabIndex={-1} className="text-lg font-semibold">
          Ваши данные
        </h2>
      </div>

      {selectedSlot && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-accent p-3.5">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-accent-foreground">
              {formatDayShortTitle(toDateKeyInZone(new Date(selectedSlot.startAt), timeZone))},{' '}
              {formatTimeRange(selectedSlot, timeZone, hour12)}
            </p>
            <p className="text-[13px] text-accent-foreground/80">
              {selectedTypeTitle ?? 'Встреча'} · {formatZoneShort(timeZone)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep('time')}
            className="shrink-0 text-[13px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Изменить
          </button>
        </div>
      )}

      <BookingForm
        slot={selectedSlot}
        hostSlug={hostSlug}
        eventTypeId={selectedTypeId}
        eventTypeTitle={selectedTypeTitle}
        timeZone={timeZone}
        variant="step"
        suggestions={suggestions}
        onSelectSuggestion={onSelectSuggestion}
        onBooked={onBooked}
        onConflict={onConflict}
        captchaRequired={captchaRequired}
        captchaSiteKey={captchaSiteKey}
      />
    </div>
  )

  return (
    <>
      <div hidden={step !== 'day'}>{dayView}</div>
      <div hidden={step !== 'time'}>{timeView}</div>
      <div hidden={step !== 'contacts'}>{contactsView}</div>
    </>
  )
}
