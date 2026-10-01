import { useState } from 'react'
import { Calendar, ChevronDown, Copy, Mail, MessageSquare, Phone } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { BookingWithSlot } from '@/types/booking'
import { buildGuestMessage } from '@/utils/guest-message'
import {
  defaultTimeZone,
  formatDayTitle,
  formatTimeInZone,
  toDateKeyInZone,
} from '@/utils/timezone'
interface BookingsListProps {
  bookings: BookingWithSlot[]
  onCancel: (booking: BookingWithSlot) => void
  showCancel?: boolean
  hostSlug?: string
}

function endTimeIso(booking: BookingWithSlot): string {
  const end = new Date(new Date(booking.startAt).getTime() + booking.durationMin * 60_000)
  return end.toISOString()
}

function groupByDay(bookings: BookingWithSlot[]): Array<{ dateKey: string; items: BookingWithSlot[] }> {
  const groups = new Map<string, BookingWithSlot[]>()

  for (const booking of bookings) {
    const key = toDateKeyInZone(new Date(booking.startAt), defaultTimeZone)
    const list = groups.get(key)

    if (list) {
      list.push(booking)
    } else {
      groups.set(key, [booking])
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dateKey, items]) => ({
      dateKey,
      items: [...items].sort((a, b) =>
        a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0,
      ),
    }))
}

export function BookingsList({
  bookings,
  onCancel,
  showCancel = true,
  hostSlug = 'default',
}: BookingsListProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Calendar className="size-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className="text-[15px] text-muted-foreground">Пока нет ни одной брони</p>
      </div>
    )
  }

  const copyGuestText = async (booking: BookingWithSlot) => {
    try {
      await navigator.clipboard.writeText(
        buildGuestMessage(booking, { hostSlug, timeZone: defaultTimeZone }),
      )
      toast.success('Текст об отмене скопирован')
    } catch {
      toast.error('Не удалось скопировать текст')
    }
  }

  const groups = groupByDay(bookings)

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.dateKey} aria-label={formatDayTitle(group.dateKey)}>
          <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            {formatDayTitle(group.dateKey)}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.items.map((booking) => {
              const isExpanded = expandedId === booking.id
              // Тот же признак, что делит вкладки панели (dashboard-page.tsx):
              // начало прошло — встречу уже не отменить и не перенести.
              const isPast = Date.parse(booking.startAt) < Date.now()

              return (
                <li key={booking.id} className="rounded-xl border bg-card">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="w-[70px] shrink-0 text-[15px] font-bold tabular-nums">
                      {formatTimeInZone(booking.startAt, defaultTimeZone)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold">{booking.name}</div>
                      <div className="truncate text-[13px] text-muted-foreground">
                        {booking.eventTypeTitle ?? 'Встреча'} · {booking.durationMin} мин
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-3">
                      <div className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                          {booking.email}
                        </span>
                        {booking.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                            {booking.phone}
                          </span>
                        )}
                        {booking.comment && (
                          <span className="flex items-start gap-1.5">
                            <MessageSquare
                              className="mt-0.5 size-3.5 shrink-0"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            {booking.comment}
                          </span>
                        )}
                        <span className="tabular-nums">
                          до {formatTimeInZone(endTimeIso(booking), defaultTimeZone)}
                        </span>
                      </div>

                      {(!isPast || showCancel) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!isPast && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10"
                              onClick={() => copyGuestText(booking)}
                            >
                              <Copy className="size-4" strokeWidth={1.8} aria-hidden="true" />
                              Скопировать текст об отмене
                            </Button>
                          )}
                          {showCancel && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 border-destructive-border text-destructive hover:bg-accent hover:text-destructive"
                              onClick={() => onCancel(booking)}
                            >
                              Отменить
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isDesktop && showCancel && !isExpanded && (
                    <div className="sr-only">
                      <Button type="button" onClick={() => onCancel(booking)}>
                        Отменить
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}