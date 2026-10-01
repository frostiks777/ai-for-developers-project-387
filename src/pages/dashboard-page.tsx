import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { toBookingWithSlot, toTimeSlot } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { AvailabilitySettingsForm } from '@/components/availability-settings-form'
import { BlocksEditor } from '@/components/blocks-editor'
import { BookingFilter, type BookingFilterValue } from '@/components/booking-filter'
import { BookingsList } from '@/components/bookings-list'
import { DashboardOverview } from '@/components/dashboard-overview'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { EventTypesEditor } from '@/components/event-types-editor'
import { HostSelect } from '@/components/host-select'
import { HostsEditor } from '@/components/hosts-editor'
import { Input } from '@/components/ui/input'
import { useActiveHost } from '@/hooks/use-active-host'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { AvailabilitySettings } from '@/types/availability-settings'
import type { BookingWithSlot, TimeSlot } from '@/types/booking'

function applySelection(
  bookings: BookingWithSlot[],
  filter: BookingFilterValue,
  search: string,
  now: number,
): BookingWithSlot[] {
  const matchesTab = (booking: BookingWithSlot) => {
    if (filter === 'canceled') {
      return booking.status === 'cancelled'
    }

    if (booking.status !== 'confirmed') {
      return false
    }

    const start = Date.parse(booking.startAt)
    return filter === 'past' ? start < now : start >= now
  }

  const normalized = search.trim().toLowerCase()
  const matchesSearch = (booking: BookingWithSlot) =>
    normalized === '' ||
    booking.name.toLowerCase().includes(normalized) ||
    booking.email.toLowerCase().includes(normalized)

  return bookings.filter((booking) => matchesTab(booking) && matchesSearch(booking))
}

export type DashboardSection =
  | 'overview'
  | 'bookings'
  | 'event-types'
  | 'availability'
  | 'blocks'
  | 'hosts'

interface DashboardPageProps {
  initialSection?: DashboardSection
}

const SECTION_HEADING: Record<DashboardSection, { title: string; subtitle: string }> = {
  overview: { title: 'Обзор', subtitle: 'Сводка по встречам и доступности' },
  bookings: { title: 'Встречи', subtitle: 'Брони по статусу и дню' },
  'event-types': { title: 'Типы встреч', subtitle: 'Что может выбрать гость при записи' },
  availability: { title: 'Доступность', subtitle: 'Из этих правил собираются свободные слоты' },
  blocks: {
    title: 'Блокировки времени',
    subtitle: 'Отпуск и личные дела — гости не увидят эти слоты',
  },
  hosts: { title: 'Организаторы', subtitle: 'Отдельные расписания и брони для каждого' },
}

export default function DashboardPage({ initialSection }: DashboardPageProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { activeSlug } = useActiveHost()
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const [settings, setSettings] = useState<AvailabilitySettings | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [rulesError, setRulesError] = useState<string | null>(null)

  const [filter, setFilter] = useState<BookingFilterValue>('upcoming')
  const [search, setSearch] = useState('')
  const section: DashboardSection = initialSection ?? 'overview'

  const loadBookings = useCallback(async () => {
    setIsLoadingBookings(true)

    try {
      const [rows, types] = await Promise.all([
        call(api.hostBookingsClient.listHostBookings(activeSlug)),
        call(api.eventTypesClient.listEventTypes(activeSlug)).catch(() => []),
      ])
      const titleById = new Map(types.map((type) => [type.id, type.title]))

      setBookings(rows.map((row) => toBookingWithSlot(row, titleById.get(row.eventTypeId) ?? null)))
      setBookingsError(null)
    } catch {
      setBookingsError('Не удалось загрузить брони')
    } finally {
      setIsLoadingBookings(false)
    }
  }, [activeSlug])

  useEffect(() => {
    setSettings(null)
    void (async () => {
      try {
        setSettings(await call(api.availabilityClient.getAvailability(activeSlug)))
        setRulesError(null)
      } catch {
        setRulesError('Не удалось загрузить настройки доступности')
      }
    })()
    void (async () => {
      try {
        const day = await call(api.listSlots(activeSlug))
        setSlots(day.slots.map(toTimeSlot))
      } catch {
        setSlots([])
      }
    })()
  }, [activeSlug])

  // Разделы панели — один и тот же компонент, поэтому при клиентской навигации
  // инстанс переиспользуется: перезапрашиваем брони при смене раздела, иначе
  // счётчик и списки не увидят новые заявки гостей.
  useEffect(() => {
    void loadBookings()
  }, [section, loadBookings])

  const handleCancel = async (booking: BookingWithSlot) => {
    try {
      await call(api.bookingsClient.cancelBooking(booking.id))
      toast.success('Бронь отменена')
      await loadBookings()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось отменить бронь')
    }
  }

  const handleSaveRules = async (next: AvailabilitySettings): Promise<boolean> => {
    setIsSavingRules(true)

    try {
      const saved = await call(api.availabilityClient.updateAvailability(activeSlug, next))
      setSettings(saved)
      toast.success('Настройки сохранены')
      return true
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить настройки')
      return false
    } finally {
      setIsSavingRules(false)
    }
  }

  const now = Date.now()
  const upcomingCount = bookings.filter(
    (booking) => booking.status === 'confirmed' && Date.parse(booking.startAt) >= now,
  ).length
  const filteredBookings = applySelection(bookings, filter, search, now)

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return (
          <DashboardOverview bookings={bookings} hostSlug={activeSlug} onCancel={handleCancel} />
        )
      case 'bookings':
        return (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-[32px] font-semibold leading-tight">Встречи</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Брони по статусу и дню</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по имени и email"
                  aria-label="Поиск по имени и email"
                  // На мобильном поиск занимает всю ширину, табы уходят на
                  // следующую строку и делят её поровну (см. BookingFilter)
                  className="h-9 w-full sm:w-[240px]"
                />
                <BookingFilter value={filter} onChange={setFilter} />
              </div>
            </div>

            {isLoadingBookings && <p>Загрузка броней…</p>}
            {bookingsError && <p className="text-destructive">{bookingsError}</p>}
            {!isLoadingBookings && !bookingsError && (
              <BookingsList
                bookings={filteredBookings}
                onCancel={handleCancel}
                showCancel={filter === 'upcoming'}
                hostSlug={activeSlug}
              />
            )}
          </div>
        )
      case 'event-types':
        return (
          <section className="glass rounded-2xl p-6">
            <EventTypesEditor slug={activeSlug} />
          </section>
        )
      case 'availability':
        return (
          <section className="glass rounded-2xl p-6">
            {rulesError && <p className="text-destructive">{rulesError}</p>}
            {!rulesError && !settings && <p>Загрузка настроек…</p>}
            {settings && (
              <AvailabilitySettingsForm
                settings={settings}
                isSaving={isSavingRules}
                onSave={handleSaveRules}
                slots={slots}
              />
            )}
          </section>
        )
      case 'blocks':
        return (
          <section className="glass rounded-2xl p-6">
            <BlocksEditor slug={activeSlug} />
          </section>
        )
      case 'hosts':
        return (
          <section className="glass rounded-2xl p-6">
            <HostsEditor />
          </section>
        )
    }
  }

  const heading = SECTION_HEADING[section]

  if (isDesktop) {
    return (
      <AppShell>
        <div className="flex min-h-screen">
          <DashboardSidebar bookingCount={upcomingCount} />
          <main className="flex min-w-0 flex-1 flex-col gap-6 p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="font-serif text-[28px] font-semibold leading-tight">
                Панель организатора
              </h1>
              <HostSelect />
            </div>
            <div>
              <h2 className="font-serif text-[24px] font-semibold leading-tight">{heading.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{heading.subtitle}</p>
            </div>
            {renderSection()}
          </main>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AppHeader linkTo={`/book/${activeSlug}`} linkLabel="Бронирование" variant="mobile" />
      <main className="mx-auto w-full max-w-md px-4 py-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-[28px] font-semibold leading-tight">Панель организатора</h2>
          <HostSelect />
        </div>

        <div
          role="tablist"
          aria-label="Разделы панели"
          className="mt-4 flex flex-wrap gap-1 rounded-xl bg-secondary p-0.5"
        >
          {(
            [
              ['overview', 'Обзор'],
              ['bookings', 'Встречи'],
              ['event-types', 'Типы'],
              ['availability', 'Доступность'],
              ['blocks', 'Блокировки'],
              ['hosts', 'Хосты'],
            ] as [DashboardSection, string][]
          ).map(([value, label]) => (
            <Link
              key={value}
              to={value === 'overview' ? '/dashboard' : `/admin/${value}`}
              role="tab"
              aria-selected={section === value}
              className={cn(
                'flex h-11 shrink-0 items-center rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                section === value
                  ? 'bg-segment-active font-semibold shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {label}
              {value === 'bookings' && ` · ${upcomingCount}`}
            </Link>
          ))}
        </div>

        <div className="mt-4">{renderSection()}</div>
      </main>
    </AppShell>
  )
}
