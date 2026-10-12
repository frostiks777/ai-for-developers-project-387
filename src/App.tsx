import { lazy, Suspense } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'

import { HostProvider } from '@/components/host-provider'
import { TimeFormatProvider } from '@/components/time-format-provider'
import { useActiveHost } from '@/hooks/use-active-host'
import LandingPage from '@/pages/landing-page'

// Лендинг — точка входа и LCP-элемент, поэтому грузится сразу. Остальные
// маршруты — через React.lazy: без этого весь код панели организатора,
// редакторов и zod-валидации брони попадает в первый бандл и тормозит
// первый экран (Lighthouse unused JS 52 КиБ, TBT 3.4 c — issue #50).
const HomePage = lazy(() => import('@/pages/home-page'))
const ConfirmedPage = lazy(() => import('@/pages/confirmed-page'))
const DashboardPage = lazy(() => import('@/pages/dashboard-page'))
const ManageBookingPage = lazy(() => import('@/pages/manage-booking-page'))
const MyBookingsPage = lazy(() => import('@/pages/my-bookings-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center text-muted-foreground"
    >
      Загружаем страницу…
    </div>
  )
}

// Публичная ссылка хоста: slug (например, 'default') или UUID (ADR-0018)
const HOST_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function BookingRoute() {
  const { slug } = useParams<{ slug: string }>()
  const { hosts, isLoading } = useActiveHost()

  // Пока список хостов не загружен, не показываем 404 — иначе будет мигание
  if (isLoading) {
    return null
  }

  const isKnownHost =
    Boolean(slug) &&
    (hosts.some((host) => host.slug === slug || host.id === slug) ||
      (hosts.length === 0 && HOST_UUID_PATTERN.test(slug ?? '')))

  return isKnownHost ? <HomePage /> : <NotFoundPage />
}

export function App() {
  return (
    <TimeFormatProvider>
      <HostProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book/:slug" element={<BookingRoute />} />
            <Route path="/my" element={<MyBookingsPage />} />
            <Route path="/booking/:uuid/confirmed" element={<ConfirmedPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/admin/bookings"
              element={<DashboardPage initialSection="bookings" />}
            />
            <Route
              path="/admin/availability"
              element={<DashboardPage initialSection="availability" />}
            />
            <Route
              path="/admin/event-types"
              element={<DashboardPage initialSection="event-types" />}
            />
            <Route path="/admin/blocks" element={<DashboardPage initialSection="blocks" />} />
            <Route path="/admin/hosts" element={<DashboardPage initialSection="hosts" />} />
            <Route path="/cancel/:token" element={<ManageBookingPage mode="cancel" />} />
            <Route
              path="/reschedule/:token"
              element={<ManageBookingPage mode="reschedule" />}
            />
            <Route
              path="/booking/:uuid/cancel"
              element={<ManageBookingPage mode="cancel" />}
            />
            <Route
              path="/booking/:uuid/reschedule"
              element={<ManageBookingPage mode="reschedule" />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </HostProvider>
    </TimeFormatProvider>
  )
}
