import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { toTimeSlot } from '@/api/mappers'
import { api, call } from '@/api/sdk'
import { AvailabilityPreview } from '@/components/availability-preview'
import { BookingsList } from '@/components/bookings-list'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { AvailabilitySettings } from '@/types/availability-settings'
import type { BookingWithSlot, TimeSlot } from '@/types/booking'
import { toDateKey } from '@/utils/dates'
import { pluralRu } from '@/utils/plural'
import { formatDayTitle, defaultTimeZone, toDateKeyInZone } from '@/utils/timezone'

interface DashboardOverviewProps {
  bookings: BookingWithSlot[]
  hostSlug: string
  onCancel: (booking: BookingWithSlot) => void
}

interface Tile {
  label: string
  value: string
}

function formatShortDay(date: Date): string {
  const raw = new Intl.DateTimeFormat('ru-RU', {
    timeZone: defaultTimeZone,
    weekday: 'short',
    day: 'numeric',
  }).format(date)

  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(',', '')
}

function formatShortTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: defaultTimeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function DashboardOverview({ bookings, hostSlug, onCancel }: DashboardOverviewProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null)

  useEffect(() => {
    let isActive = true

    call(api.listSlots(hostSlug))
      .then((day) => {
        if (isActive) {
          setSlots(day.slots.map(toTimeSlot))
        }
      })
      .catch(() => {
        if (isActive) {
          setSlots([])
        }
      })

    return () => {
      isActive = false
    }
  }, [hostSlug])

  useEffect(() => {
    let isActive = true

    call(api.availabilityClient.getAvailability(hostSlug))
      .then((loaded) => {
        if (isActive) {
          setSettings(loaded)
        }
      })
      .catch(() => {
        // настройки недоступны — превью и баннер скрыты
      })

    return () => {
      isActive = false
    }
  }, [hostSlug])

  const now = Date.now()
  const upcoming = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === 'confirmed' && Date.parse(booking.startAt) >= now)
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)),
    [bookings, now],
  )
  const nextSevenDays = useMemo(() => {
    const limit = now + 7 * 24 * 60 * 60 * 1000

    return upcoming.filter((booking) => Date.parse(booking.startAt) <= limit)
  }, [upcoming, now])

  const todayKey = toDateKey(new Date())
  const todayCount = upcoming.filter(
    (booking) => toDateKeyInZone(new Date(booking.startAt), defaultTimeZone) === todayKey,
  ).length
  const weekStartKey = toDateKey(new Date(now))
  const weekEndKey = toDateKey(new Date(now + 6 * 24 * 60 * 60 * 1000))
  const weekCount = upcoming.filter((booking) => {
    const key = toDateKeyInZone(new Date(booking.startAt), defaultTimeZone)
    return key >= weekStartKey && key <= weekEndKey
  }).length
  const freeCount = slots.filter((slot) => !slot.isBooked).length

  const tiles: Tile[] = [
    { label: 'Сегодня', value: todayCount > 0 ? String(todayCount) : 'Выходной' },
    {
      label: 'Следующая встреча',
      value: upcoming[0] ? `${formatShortDay(new Date(upcoming[0].startAt))}, ${formatShortTime(upcoming[0].startAt)}` : '—',
    },
    { label: 'На неделе', value: `${weekCount} ${pluralRu(weekCount, ['встреча', 'встречи', 'встреч'])}` },
    { label: 'Свободно на 14 дней', value: `${freeCount} ${pluralRu(freeCount, ['окно', 'окна', 'окон'])}` },
  ]

  const todayTitle = formatDayTitle(todayKey)
  const mismatch = settings !== null && settings.timeZone !== defaultTimeZone

  return (
    <div className="flex flex-col gap-6">
      {mismatch && settings && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-highlight/50 bg-highlight/15 p-3.5 text-[13px]">
          <span>
            <strong>Часы работы заданы в {formatClientTz(settings.timeZone)}.</strong> Гости видят
            их в своём поясе.
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => toast.info('Пояс правил можно изменить в «Доступности»')}
          >
            Считать по {formatClientTz(settings.timeZone)}
          </Button>
        </div>
      )}

      <h1 className="font-serif text-[30px] font-semibold leading-tight">{todayTitle}</h1>

      <div className={`grid gap-3 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {tiles.map((tile) => (
          <div key={tile.label} className="glass rounded-2xl p-4">
            <p className="text-[12px] text-muted-foreground">{tile.label}</p>
            <p className="mt-1 text-[18px] font-bold">{tile.value}</p>
          </div>
        ))}
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ближайшие встречи</h2>
          <span className="text-[13px] text-muted-foreground">7 дней</span>
        </div>

        {nextSevenDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет ни одной брони</p>
        ) : (
          <BookingsList bookings={nextSevenDays} onCancel={onCancel} hostSlug={hostSlug} />
        )}

        <div className="mt-4">
          <a
            href="/admin/bookings"
            className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            Все встречи →
          </a>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Неделя глазами гостя</h2>
          <a
            href="/admin/blocks"
            className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            Заблокировать время
          </a>
        </div>
        {settings ? (
          <AvailabilityPreview settings={settings} slots={slots} />
        ) : (
          <p className="text-sm text-muted-foreground">Нет данных для превью</p>
        )}
      </section>
    </div>
  )
}

function formatClientTz(timeZone: string): string {
  const city = timeZone.split('/').pop() ?? timeZone

  return city.replace(/_/g, ' ')
}
