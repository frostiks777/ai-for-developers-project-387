import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { Booking as ApiBooking, EventType } from '@/api/generated'
import { toCreatedBooking } from '@/api/mappers'
import { api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { BookingSuccess } from '@/components/booking-success'
import { host } from '@/config/host'
import { useActiveHost } from '@/hooks/use-active-host'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { TimeSlot } from '@/types/booking'
import { defaultTimeZone } from '@/utils/timezone'

const LOCATION_LABEL: Record<string, string> = {
  online: 'Онлайн-звонок',
  offline: 'Очная встреча',
  phone: 'Телефонный звонок',
}

function durationMinutes(startAt: string, endAt: string): number {
  return Math.max(1, Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60_000))
}

export default function ConfirmedPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { activeSlug } = useActiveHost()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [hostName, setHostName] = useState(host.name)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uuid) {
      setError('Бронь не найдена')
      setIsLoading(false)
      return
    }

    let isActive = true

    Promise.all([
      call(api.bookingsClient.getBooking(uuid)),
      call(api.getHostSettings(activeSlug)).catch(() => null),
      call(api.eventTypesClient.listEventTypes(activeSlug)).catch(() => []),
    ])
      .then(([found, settings, types]) => {
        if (!isActive) {
          return
        }

        setBooking(found)
        if (settings) {
          setHostName(settings.name)
        }
        setEventTypes(types)
        setError(null)
      })
      .catch(() => {
        if (isActive) {
          setError('Бронь не найдена')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [uuid, activeSlug])

  const eventType = booking
    ? (eventTypes.find((type) => type.id === booking.eventTypeId) ?? null)
    : null

  const tabs = [
    { to: `/book/${activeSlug}`, label: 'Записаться', active: false },
    { to: '/my', label: 'Мои встречи', active: false },
  ]

  if (isLoading || error || !booking) {
    return (
      <AppShell>
        <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />
        <main className="mx-auto w-full max-w-[600px] flex-1 px-4 py-16 text-center">
          {isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
          {!isLoading && error && <p className="text-sm text-destructive">{error}</p>}
        </main>
      </AppShell>
    )
  }

  const created = toCreatedBooking(booking)
  const slot: TimeSlot = {
    id: 0,
    startAt: booking.startAt,
    durationMin: durationMinutes(booking.startAt, booking.endAt),
    isBooked: true,
  }
  const title = eventType?.title ?? host.meetingTitle

  return (
    <AppShell>
      <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />

      <main className="mx-auto w-full max-w-[600px] flex-1 px-4 py-10 lg:px-6 lg:py-14">
        <BookingSuccess
          booking={created}
          slot={slot}
          timeZone={booking.timeZone ?? defaultTimeZone}
          eventTypeTitle={title}
          formatLabel={LOCATION_LABEL[eventType?.locationType ?? 'online'] ?? host.format}
          hostName={hostName}
          onReset={() => navigate(`/book/${activeSlug}`)}
        />
      </main>
    </AppShell>
  )
}
