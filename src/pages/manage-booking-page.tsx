import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import type { Booking as ApiBooking } from '@/api/generated'
import { BookingStatus } from '@/api/generated'
import { toTimeSlot } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { SlotGroups } from '@/components/slot-groups'
import { TwoWeekGrid } from '@/components/two-week-grid'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { host } from '@/config/host'
import { useActiveHost } from '@/hooks/use-active-host'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTimeFormat } from '@/hooks/use-time-format'
import type { TimeSlot } from '@/types/booking'
import { buildIcs, downloadIcs, googleCalendarUrl } from '@/utils/calendar'
import { addDays, startOfWeek } from '@/utils/dates'
import { updateMyBookingTime } from '@/utils/my-bookings'
import {
  defaultTimeZone,
  formatDateTimeInZone,
  formatDayShortTitle,
  formatTimeRange,
  formatZoneShort,
  toDateKeyInZone,
} from '@/utils/timezone'

interface ManageBookingPageProps {
  mode: 'reschedule' | 'cancel'
}

function durationMinutes(startAt: string, endAt: string): number {
  return Math.max(1, Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60_000))
}

export default function ManageBookingPage({
  mode,
}: ManageBookingPageProps) {
  const params = useParams<{ token?: string; uuid?: string }>()
  const token = params.token ?? params.uuid
  const { activeSlug } = useActiveHost()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { hour12 } = useTimeFormat()

  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [weekStartOverride, setWeekStartOverride] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const isCancelFocus = mode === 'cancel'
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<'moved' | 'cancelled' | null>(null)

  const timeZone = defaultTimeZone

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      setLoadError('Бронь не найдена или ссылка недействительна')
      return
    }

    setIsLoading(true)

    try {
      const current = await call(api.bookingsClient.getBooking(token))
      const allSlots = await call(
        api.listSlots(current.hostSlug, { eventTypeId: current.eventTypeId }),
      )

      setBooking(current)
      setSlots(allSlots.slots.map(toTimeSlot))
      setLoadError(null)
    } catch {
      setLoadError('Бронь не найдена или ссылка недействительна')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const currentSlotId = booking
    ? (slots.find((slot) => slot.startAt === booking.startAt)?.id ?? null)
    : null
  const freeSlots = slots.filter((slot) => !slot.isBooked)
  const dateKeys = Array.from(
    new Set(freeSlots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone))),
  ).sort()
  const allDateKeys = Array.from(
    new Set(slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone))),
  ).sort()
  const activeDate =
    selectedDate !== null && dateKeys.includes(selectedDate) ? selectedDate : (dateKeys[0] ?? null)
  const visibleSlots = activeDate
    ? freeSlots.filter((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone) === activeDate)
    : freeSlots
  const baseWeekStart = allDateKeys[0] ? startOfWeek(allDateKeys[0]) : null
  const weekStart = weekStartOverride ?? (activeDate ? startOfWeek(activeDate) : baseWeekStart)
  const lastDateKey = allDateKeys[allDateKeys.length - 1]

  const handleReschedule = async () => {
    if (!token || !selectedSlot) {
      return
    }

    try {
      const updated = await call(
        api.bookingsClient.rescheduleBooking(token, { startAt: selectedSlot.startAt }),
      )
      setBooking(updated)
      setResult('moved')
      updateMyBookingTime(token, selectedSlot.startAt)
      toast.success('Встреча перенесена')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось перенести встречу')
    }
  }

  const handleCancel = async () => {
    if (!token) {
      return
    }

    setIsCancelling(true)

    try {
      const trimmed = reason.trim()
      await call(
        api.bookingsClient.cancelBooking(token, {
          body: trimmed ? { reason: trimmed } : undefined,
        }),
      )
      setResult('cancelled')
      setIsCancelOpen(false)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось отменить встречу')
    } finally {
      setIsCancelling(false)
    }
  }

  const tabs = [
    { to: `/book/${activeSlug}`, label: 'Записаться', active: false },
    { to: '/my', label: 'Мои встречи', active: false },
  ]

  if (isLoading) {
    return (
      <AppShell>
        <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </main>
      </AppShell>
    )
  }

  if (loadError || !booking) {
    return (
      <AppShell>
        <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
          <p className="text-sm text-destructive">
            {loadError ?? 'Бронь не найдена или ссылка недействительна'}
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to={`/book/${activeSlug}`}>К странице записи</Link>
          </Button>
        </main>
      </AppShell>
    )
  }

  const localDateKey = toDateKeyInZone(new Date(booking.startAt), timeZone)
  const whenLabel = `${formatDayShortTitle(localDateKey)}, ${formatTimeRange(
    { startAt: booking.startAt, durationMin: durationMinutes(booking.startAt, booking.endAt) },
    timeZone,
    hour12,
  )} ${formatZoneShort(timeZone)}`
  const durationMin = durationMinutes(booking.startAt, booking.endAt)
  const hostName = host.name
  const eventTitle = host.meetingTitle

  const statusBadge =
    result === 'cancelled' || booking.status === BookingStatus.Cancelled ? (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
        отменена
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success">
        подтверждена
      </span>
    )

  return (
    <AppShell>
      <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <Link
          to="/my"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Все мои встречи
        </Link>

        <div
          className={
            isCancelFocus
              ? 'mt-4 grid gap-6 lg:grid-cols-[1fr_400px]'
              : 'mt-4 grid gap-6 lg:grid-cols-[400px_1fr]'
          }
        >
          <section className="glass rounded-2xl p-5">
            {result === 'cancelled' ? (
              <>
                <h2 className="font-serif text-[28px] font-semibold">Встреча отменена</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Слот снова свободен. Можно записаться на другое время.
                </p>
                <Button
                  asChild
                  className="mt-5 h-12 w-full rounded-xl bg-highlight text-highlight-foreground shadow-glow hover:bg-highlight/90"
                >
                  <Link to={`/book/${booking.hostSlug || activeSlug}`}>Записаться снова</Link>
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-[30px] font-semibold leading-tight">Ваша встреча</h1>
                  {statusBadge}
                </div>

                <dl className="mt-4 grid gap-3 text-[15px]">
                  <div>
                    <dt className="text-[13px] text-muted-foreground">Когда</dt>
                    <dd className="font-semibold">{whenLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted-foreground">Формат</dt>
                    <dd className="font-semibold">
                      {eventTitle} · {durationMin} мин
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted-foreground">Организатор</dt>
                    <dd className="font-semibold">{hostName}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted-foreground">Вы</dt>
                    <dd className="font-semibold">
                      {booking.clientName} · {booking.clientEmail}
                    </dd>
                  </div>
                </dl>

                <Button
                  variant="outline"
                  className="mt-4 h-11 w-full"
                  onClick={() => {
                    const slot: TimeSlot = {
                      id: 0,
                      startAt: booking.startAt,
                      durationMin,
                      isBooked: true,
                    }
                    const created = {
                      id: booking.id,
                      name: booking.clientName,
                      phone: booking.clientPhone ?? null,
                      email: booking.clientEmail,
                      comment: booking.clientNotes ?? null,
                      createdAt: booking.createdAt,
                      cancelToken: booking.id,
                    }
                    window.open(googleCalendarUrl(created, slot, { title: eventTitle }), '_blank')
                  }}
                >
                  <Calendar className="size-4" strokeWidth={1.8} aria-hidden="true" />
                  Добавить в календарь
                </Button>

                {result !== 'moved' && (
                  <div className="mt-5 border-t border-border pt-4">
                    {!isCancelOpen ? (
                      <Button
                        variant="outline"
                        className="h-11 w-full border-destructive-border text-destructive"
                        onClick={() => setIsCancelOpen(true)}
                      >
                        Отменить встречу
                      </Button>
                    ) : (
                      <div className="rounded-2xl border border-destructive-border bg-destructive/5 p-4">
                        <h2 className="text-[15px] font-semibold">
                          Вы уверены, что хотите отменить бронирование?
                        </h2>
                        <p className="mt-1.5 text-[13px] text-muted-foreground">
                          Встреча {formatDayShortTitle(localDateKey)} в{' '}
                          {formatDateTimeInZone(booking.startAt, timeZone, hour12).split(', ').pop()}.
                          Время освободится для других. Вернуть эту запись будет нельзя, только
                          записаться заново.
                        </p>
                        <div className="mt-3 grid gap-1.5">
                          <Label htmlFor="cancellation-reason">
                            Причина отмены (необязательно)
                          </Label>
                          <Textarea
                            id="cancellation-reason"
                            value={reason}
                            maxLength={500}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Например: не смогу присутствовать"
                          />
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <Button
                            className="h-11 flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isCancelling}
                            onClick={handleCancel}
                          >
                            {isCancelling ? 'Отмена…' : 'Да, отменить'}
                          </Button>
                          <Button
                            variant="outline"
                            className="h-11 flex-1"
                            onClick={() => setIsCancelOpen(false)}
                          >
                            Оставить встречу
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            {result === 'moved' ? (
              <>
                <h2 className="font-serif text-[28px] font-semibold">Встреча перенесена</h2>
                <p className="mt-2 text-[16px] font-semibold">
                  {formatDayShortTitle(toDateKeyInZone(new Date(booking.startAt), timeZone))},{' '}
                  {formatTimeRange(
                    {
                      startAt: booking.startAt,
                      durationMin,
                    },
                    timeZone,
                    hour12,
                  )}
                </p>
                <p className="text-[13px] text-muted-foreground">{formatZoneShort(timeZone)}</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <Button
                    asChild
                    className="h-12 rounded-xl bg-highlight text-highlight-foreground shadow-glow hover:bg-highlight/90"
                  >
                    <a href="#" onClick={(event) => event.preventDefault()}>
                      Обновить в Google Календаре
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={() => {
                      const slot: TimeSlot = {
                        id: 0,
                        startAt: booking.startAt,
                        durationMin,
                        isBooked: true,
                      }
                      const created = {
                        id: booking.id,
                        name: booking.clientName,
                        phone: booking.clientPhone ?? null,
                        email: booking.clientEmail,
                        comment: booking.clientNotes ?? null,
                        createdAt: booking.createdAt,
                        cancelToken: booking.id,
                      }
                      downloadIcs(`booking-${booking.id}.ics`, buildIcs(created, slot, { title: eventTitle }))
                    }}
                  >
                    Скачать .ics
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Перенести на другое время</h2>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  Текущее время: {whenLabel}. Выберите новое — ничего не изменится до подтверждения.
                </p>

                {freeSlots.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Нет доступных слотов для переноса
                  </p>
                ) : (
                  <>
                    <div className="mt-4">
                      <TwoWeekGrid
                        slots={freeSlots}
                        selectedDate={activeDate}
                        timeZone={timeZone}
                        horizonEnd={null}
                        rows={isDesktop ? 1 : 2}
                        onSelectDate={(dateKey) => {
                          setSelectedDate(dateKey)
                          setSelectedSlot(null)
                        }}
                      />
                    </div>

                    {weekStart && weekStart <= lastDateKey && (
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          type="button"
                          aria-label="Предыдущая неделя"
                          disabled={!baseWeekStart || weekStart <= baseWeekStart}
                          onClick={() => setWeekStartOverride(addDays(weekStart, -7))}
                          className="text-sm text-primary disabled:opacity-40"
                        >
                          ←
                        </button>
                        <p className="text-[13px] text-muted-foreground">
                          {formatDayShortTitle(weekStart)} –{' '}
                          {formatDayShortTitle(addDays(weekStart, 6))}
                        </p>
                        <button
                          type="button"
                          aria-label="Следующая неделя"
                          disabled={addDays(weekStart, 6) >= lastDateKey}
                          onClick={() => setWeekStartOverride(addDays(weekStart, 7))}
                          className="text-sm text-primary disabled:opacity-40"
                        >
                          →
                        </button>
                      </div>
                    )}

                    <div className="mt-4">
                      <SlotGroups
                        slots={visibleSlots}
                        selectedSlotId={selectedSlot?.id ?? null}
                        currentSlotId={currentSlotId}
                        timeZone={timeZone}
                        columns={isDesktop ? 4 : 3}
                        onSelect={setSelectedSlot}
                      />
                    </div>

                    {selectedSlot && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4">
                        <div className="text-[13px] text-muted-foreground">
                          <span className="line-through">
                            {formatDayShortTitle(toDateKeyInZone(new Date(booking.startAt), timeZone))}
                            , {formatTimeRange({ startAt: booking.startAt, durationMin }, timeZone, hour12)}
                          </span>
                        </div>
                        <span aria-hidden="true">→</span>
                        <div className="text-[18px] font-bold text-accent-foreground">
                          {formatDayShortTitle(
                            toDateKeyInZone(new Date(selectedSlot.startAt), timeZone),
                          )}
                          ,{' '}
                          {formatTimeRange(
                            {
                              startAt: selectedSlot.startAt,
                              durationMin: selectedSlot.durationMin,
                            },
                            timeZone,
                            hour12,
                          )}
                        </div>
                        <Button
                          className="ml-auto h-11 rounded-xl bg-highlight text-highlight-foreground shadow-glow hover:bg-highlight/90"
                          onClick={handleReschedule}
                        >
                          Перенести встречу
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  )
}
