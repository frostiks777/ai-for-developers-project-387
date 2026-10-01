import { useEffect, useMemo, useState } from 'react'
import { CalendarX, Clock, Hourglass, Video } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'

import type { EventType } from '@/api/generated'
import { api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { BookingForm } from '@/components/booking-form'
import { BookingSuccess } from '@/components/booking-success'
import { BookingWizard } from '@/components/booking-wizard'
import { EventTypePicker } from '@/components/event-type-picker'
import { SlotGroups } from '@/components/slot-groups'
import { TimezoneCard } from '@/components/timezone-card'
import { TwoWeekGrid } from '@/components/two-week-grid'
import { ViewToggle } from '@/components/view-toggle'
import { WeekGrid } from '@/components/week-grid'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'
import { useActiveHost } from '@/hooks/use-active-host'
import { useAvailability } from '@/hooks/use-availability'
import { useBookingView } from '@/hooks/use-booking-view'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTimeFormat } from '@/hooks/use-time-format'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { addDays, parseDateKey, startOfWeek, toDateKey } from '@/utils/dates'
import { saveMyBooking } from '@/utils/my-bookings'
import { pluralRu } from '@/utils/plural'
import {
  defaultTimeZone,
  formatDayTitle,
  formatTimeInZone,
  toDateKeyInZone,
} from '@/utils/timezone'

function SlotsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="h-[46px] animate-pulse rounded-[10px] bg-muted" />
      ))}
    </div>
  )
}

function DaysSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-7 gap-2">
      {Array.from({ length: 14 }, (_, index) => (
        <div key={index} className="h-[60px] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

function formatMonthDay(dateKey: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
  }).format(parseDateKey(dateKey))
}

export default function HomePage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')
  const { activeSlug, hosts } = useActiveHost()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const { slots, isLoading, error, refetch } = useAvailability(
    slug ?? '',
    selectedTypeId ?? undefined,
  )
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [bookedBooking, setBookedBooking] = useState<CreatedBooking | null>(null)
  const [bookedSlot, setBookedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [conflictSlot, setConflictSlot] = useState<TimeSlot | null>(null)
  const [timeZone, setTimeZone] = useState(defaultTimeZone)
  const [minNoticeMin, setMinNoticeMin] = useState<number | null>(null)
  const [horizonDays, setHorizonDays] = useState<number | null>(null)
  // CAPTCHA (ADR-0025). По умолчанию выключена: если запрос настроек не
  // прошёл, форма работает как раньше, а сервер всё равно требует токен
  // только при заданном TURNSTILE_SECRET_KEY.
  const [captcha, setCaptcha] = useState<{ required: boolean; siteKey: string | null }>({
    required: false,
    siteKey: null,
  })
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { hour12 } = useTimeFormat()
  const { view, setView } = useBookingView()
  const [weekStartOverride, setWeekStartOverride] = useState<string | null>(null)

  const activeHost = hosts.find((item) => item.slug === slug || item.id === slug) ?? null
  const hostName = activeHost?.name?.trim() || host.name

  const slotDates = useMemo(
    () => slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone)).sort(),
    [slots, timeZone],
  )
  const activeDate =
    selectedDate !== null && slotDates.includes(selectedDate) ? selectedDate : (slotDates[0] ?? null)
  const visibleSlots = useMemo(
    () =>
      activeDate
        ? slots.filter((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone) === activeDate)
        : slots,
    [slots, activeDate, timeZone],
  )

  useEffect(() => {
    let isActive = true

    call(api.getHostSettings(slug ?? ''))
      .then((settings) => {
        if (isActive) {
          setCaptcha({
            required: Boolean(settings?.captcha?.required),
            siteKey: settings?.captcha?.siteKey ?? null,
          })
        }
      })
      .catch(() => {
        if (isActive) {
          setCaptcha({ required: false, siteKey: null })
        }
      })

    return () => {
      isActive = false
    }
  }, [slug])

  useEffect(() => {
    let isActive = true

    call(api.availabilityClient.getAvailability(slug ?? ''))
      .then((rules) => {
        if (isActive) {
          setMinNoticeMin(typeof rules?.minNoticeMin === 'number' ? rules.minNoticeMin : null)
          setHorizonDays(typeof rules?.horizonDays === 'number' ? rules.horizonDays : null)
        }
      })
      .catch(() => {
        if (isActive) {
          setMinNoticeMin(null)
          setHorizonDays(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [slug])

  useEffect(() => {
    let isActive = true

    call(api.eventTypesClient.listEventTypes(slug ?? ''))
      .then((types) => {
        if (!isActive) {
          return
        }

        setEventTypes(types)
        setSelectedTypeId((current) => {
          if (current) {
            return current
          }

          if (typeParam && types.some((type) => type.id === typeParam && type.isActive)) {
            return typeParam
          }

          return types.find((type) => type.isActive)?.id ?? null
        })
      })
      .catch(() => {
        if (isActive) {
          setEventTypes([])
        }
      })

    return () => {
      isActive = false
    }
  }, [slug, typeParam])

  const selectedType = eventTypes.find((type) => type.id === selectedTypeId) ?? null
  const activeTypes = eventTypes.filter((type) => type.isActive)
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null
  const freeCount = visibleSlots.filter((slot) => !slot.isBooked).length
  const durationMin = slots[0]?.durationMin ?? null

  const firstDayKey = slotDates[0] ?? null
  const lastDayKey = slotDates[slotDates.length - 1] ?? null
  const baseWeekStart = firstDayKey ? startOfWeek(firstDayKey) : null
  const weekStart = weekStartOverride ?? (activeDate ? startOfWeek(activeDate) : baseWeekStart)
  const weekEnd = weekStart ? addDays(weekStart, 6) : null
  const canPrevWeek = Boolean(weekStart && baseWeekStart && weekStart > baseWeekStart)
  const canNextWeek = Boolean(weekStart && lastDayKey && addDays(weekStart, 6) < lastDayKey)
  const weekFreeCount = useMemo(() => {
    if (!weekStart) {
      return 0
    }

    const end = addDays(weekStart, 7)

    return slots.filter((slot) => {
      const key = toDateKeyInZone(new Date(slot.startAt), timeZone)

      return !slot.isBooked && key >= weekStart && key < end
    }).length
  }, [slots, weekStart, timeZone])

  const horizonEnd = useMemo(() => {
    if (horizonDays === null) {
      return null
    }

    const end = new Date()
    end.setDate(end.getDate() + horizonDays)

    return toDateKey(end)
  }, [horizonDays])

  const suggestion = useMemo(() => {
    const byDate = new Map<string, TimeSlot[]>()

    for (const slot of slots) {
      if (slot.isBooked) {
        continue
      }

      const key = toDateKeyInZone(new Date(slot.startAt), timeZone)
      const list = byDate.get(key) ?? []
      list.push(slot)
      byDate.set(key, list)
    }

    const keys = Array.from(byDate.keys()).sort()

    for (const key of keys) {
      if (activeDate !== null && key <= activeDate) {
        continue
      }

      const list = byDate.get(key)

      if (list && list.length >= 4) {
        return { date: key, count: list.length, first: list[0] }
      }
    }

    return null
  }, [slots, timeZone, activeDate])

  const handleSelectType = (type: EventType) => {
    setSelectedTypeId(type.id)
    setSelectedSlotId(null)
    setSelectedDate(null)
    setWeekStartOverride(null)
  }

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey)
    setSelectedSlotId(null)
  }

  const handleBooked = (booking: CreatedBooking) => {
    if (selectedSlot) {
      saveMyBooking({
        id: booking.cancelToken,
        startAt: selectedSlot.startAt,
        durationMin: selectedSlot.durationMin,
        eventTypeTitle: selectedType?.title ?? null,
        hostSlug: slug ?? activeSlug,
      })
    }

    setBookedSlot(selectedSlot)
    setBookedBooking(booking)
    refetch()
  }

  const handleReset = () => {
    setBookedBooking(null)
    setBookedSlot(null)
    setSelectedSlotId(null)
    refetch()
  }

  const handleConflict = (slot: TimeSlot) => {
    setConflictSlot(slot)
    setSelectedSlotId(null)
    refetch()
  }

  const handleSelectSuggestion = (slot: TimeSlot) => {
    setConflictSlot(null)
    setSelectedSlotId(slot.id)
  }

  const suggestions = useMemo(() => {
    if (!conflictSlot) {
      return []
    }

    return slots
      .filter((slot) => !slot.isBooked && Date.parse(slot.startAt) > Date.parse(conflictSlot.startAt))
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
      .slice(0, 3)
  }, [slots, conflictSlot])

  const hostBlurb = (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          {host.initials}
        </span>
        <p className="text-[13px] text-muted-foreground">Организатор</p>
      </div>
      <p className="mt-2 truncate font-semibold">{hostName}</p>
    </div>
  )

  const rules = (
    <ul className="mt-4 grid gap-2 text-[13px] text-muted-foreground">
      {durationMin !== null && (
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          {selectedType ? `${selectedType.durationMin} мин` : `${durationMin} мин`}
        </li>
      )}
      <li className="flex items-center gap-2">
        <Video className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        Онлайн-звонок, ссылка придёт в подтверждении
      </li>
      {minNoticeMin !== null && (
        <li className="flex items-start gap-2">
          <Hourglass className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          Записаться можно не позже чем за {Math.round(minNoticeMin / 60)} ч
        </li>
      )}
    </ul>
  )

  const typePicker = activeTypes.length > 0 && (
    <EventTypePicker types={activeTypes} selectedId={selectedTypeId} onSelect={handleSelectType} />
  )

  const slotsBlock = (
    <>
      {isLoading && <SlotsSkeleton />}

      <span className="sr-only" aria-live="polite">
        Загрузка слотов…
      </span>

      {!isLoading && error && (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="font-medium">Не удалось загрузить слоты</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      )}

      {!isLoading && !error && slots.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="font-medium">Нет доступных слотов</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Загляните позже — организатор ещё не открыл время.
          </p>
        </div>
      )}

      {!isLoading && !error && activeDate && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{formatDayTitle(activeDate)}</h2>
            <p className="text-[13px] text-muted-foreground" aria-live="polite">
              {freeCount}{' '}
              {pluralRu(freeCount, ['свободное окно', 'свободных окна', 'свободных окон'])}
              {durationMin !== null && ` по ${durationMin} минут`}
            </p>
          </div>
          <div className="mt-4">
            <SlotGroups
              slots={visibleSlots}
              selectedSlotId={selectedSlotId}
              timeZone={timeZone}
              columns={isDesktop ? 5 : 3}
              onSelect={(slot) => setSelectedSlotId(slot.id)}
            />
          </div>
        </>
      )}
    </>
  )

  return (
    <AppShell className="min-h-screen">
      <AppHeader
        variant={isDesktop ? 'desktop' : 'mobile'}
        tabs={[
          { to: `/book/${slug ?? activeSlug}`, label: 'Записаться', active: true },
          { to: '/my', label: 'Мои встречи', active: false },
        ]}
      />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 lg:px-10 lg:py-10">
        {bookedBooking && bookedSlot ? (
          <div className="mx-auto max-w-[600px]">
            <BookingSuccess
              booking={bookedBooking}
              slot={bookedSlot}
              timeZone={timeZone}
              eventTypeTitle={selectedType?.title ?? null}
              onReset={handleReset}
            />
          </div>
        ) : isDesktop ? (
          view === 'week' ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="glass rounded-card p-6">
                <div className="flex flex-wrap items-center gap-3">
                  {activeTypes.length > 0 && (
                    <EventTypePicker
                      types={activeTypes}
                      selectedId={selectedTypeId}
                      onSelect={handleSelectType}
                      layout="chips"
                    />
                  )}
                  <div className="ml-auto flex flex-wrap items-center gap-3">
                    {weekStart && weekEnd && (
                      <div className="text-right">
                        <p className="text-[15px] font-semibold">
                          {formatMonthDay(weekStart)} – {formatMonthDay(weekEnd)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {weekFreeCount} окон · время по {timeZone}
                        </p>
                      </div>
                    )}
                    <ViewToggle value={view} onChange={setView} />
                  </div>
                </div>
                <div className="mt-4">
                  {isLoading ? (
                    <DaysSkeleton />
                  ) : error ? (
                    <div className="rounded-xl border bg-card p-6 text-center">
                      <p className="font-medium">Не удалось загрузить слоты</p>
                      <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                        Повторить
                      </Button>
                    </div>
                  ) : (
                    slots.length > 0 &&
                    weekStart && (
                      <WeekGrid
                        slots={slots}
                        weekStart={weekStart}
                        timeZone={timeZone}
                        selectedSlotId={selectedSlotId}
                        onSelect={(slot) => setSelectedSlotId(slot.id)}
                        onPrevWeek={() => setWeekStartOverride(addDays(weekStart, -7))}
                        onNextWeek={() => setWeekStartOverride(addDays(weekStart, 7))}
                        canPrev={canPrevWeek}
                        canNext={canNextWeek}
                      />
                    )
                  )}
                </div>
              </section>
              <aside className="glass rounded-card bg-card/35 p-6">
                <BookingForm
                  slot={selectedSlot}
                  hostSlug={slug ?? ''}
                  eventTypeId={selectedTypeId}
                  eventTypeTitle={selectedType?.title ?? null}
                  timeZone={timeZone}
                  variant="column"
                  onBooked={handleBooked}
                  onConflict={handleConflict}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                  captchaRequired={captcha.required}
                  captchaSiteKey={captcha.siteKey}
                />
              </aside>
            </div>
          ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)_340px] xl:grid-cols-[260px_minmax(0,1fr)_380px]">
            <aside className="glass rounded-card p-5">
              {hostBlurb}
              <div className="mt-5">
                <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
                  Формат встречи
                </p>
                {typePicker}
              </div>
              {rules}
              <div className="mt-5">
                <TimezoneCard timeZone={timeZone} onTimeZoneChange={setTimeZone} />
              </div>
            </aside>

            <section className="glass rounded-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Выберите день</h2>
                <ViewToggle value={view} onChange={setView} />
              </div>

              {isLoading ? (
                <div className="mt-4">
                  <DaysSkeleton />
                </div>
              ) : (
                !error &&
                slots.length > 0 && (
                  <div className="mt-4">
                    <TwoWeekGrid
                      slots={slots}
                      selectedDate={activeDate}
                      timeZone={timeZone}
                      horizonEnd={horizonEnd}
                      onSelectDate={handleSelectDate}
                    />
                  </div>
                )
              )}

              {!isLoading && !error && activeDate && (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Под датой — сколько окон свободно.
                </p>
              )}

              <div className="my-5 border-t border-border" />

              {freeCount < 4 && activeDate && suggestion && (
                <div className="mb-4 rounded-xl bg-secondary p-3 text-[13px]">
                  <p>
                    Нет подходящего времени? Во {formatDayTitle(suggestion.date).toLowerCase()},
                    свободно {suggestion.count}{' '}
                    {pluralRu(suggestion.count, ['окно', 'окна', 'окон'])} с{' '}
                    {formatTimeInZone(suggestion.first.startAt, timeZone, hour12)}.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectDate(suggestion.date)}
                    className="mt-1.5 font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Показать {formatDayTitle(suggestion.date).split(',')[0].toLowerCase()}
                  </button>
                </div>
              )}

              {slotsBlock}
            </section>

            <aside className="glass rounded-card bg-card/35 p-6">
              <BookingForm
                slot={selectedSlot}
                hostSlug={slug ?? ''}
                eventTypeId={selectedTypeId}
                eventTypeTitle={selectedType?.title ?? null}
                timeZone={timeZone}
                variant="column"
                onBooked={handleBooked}
                onConflict={handleConflict}
                suggestions={suggestions}
                onSelectSuggestion={handleSelectSuggestion}
                captchaRequired={captcha.required}
                captchaSiteKey={captcha.siteKey}
              />
            </aside>
          </div>
          )
        ) : (
          <div className="mx-auto w-full max-w-md">
            {isLoading ? (
              <DaysSkeleton />
            ) : error ? (
              <div className="rounded-xl border bg-card p-6 text-center">
                <p className="font-medium">Не удалось загрузить слоты</p>
                <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                  Повторить
                </Button>
              </div>
            ) : slots.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarX className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Свободных слотов нет
              </p>
            ) : (
              <BookingWizard
                slots={slots}
                timeZone={timeZone}
                onTimeZoneChange={setTimeZone}
                eventTypes={eventTypes}
                selectedTypeId={selectedTypeId}
                onSelectType={handleSelectType}
                selectedTypeTitle={selectedType?.title ?? null}
                hostSlug={slug ?? ''}
                hostName={hostName}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
                suggestions={suggestions}
                onSelectSuggestion={handleSelectSuggestion}
                onBooked={handleBooked}
                onConflict={handleConflict}
                captchaRequired={captcha.required}
                captchaSiteKey={captcha.siteKey}
              />
            )}
          </div>
        )}
      </main>
    </AppShell>
  )
}
