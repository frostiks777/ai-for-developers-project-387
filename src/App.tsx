import { Route, Routes, useParams } from 'react-router-dom'

import { HostProvider } from '@/components/host-provider'
import { TimeFormatProvider } from '@/components/time-format-provider'
import { useActiveHost } from '@/hooks/use-active-host'
import ConfirmedPage from '@/pages/confirmed-page'
import DashboardPage from '@/pages/dashboard-page'
import HomePage from '@/pages/home-page'
import LandingPage from '@/pages/landing-page'
import ManageBookingPage from '@/pages/manage-booking-page'
import MyBookingsPage from '@/pages/my-bookings-page'
import NotFoundPage from '@/pages/not-found-page'

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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book/:slug" element={<BookingRoute />} />
          <Route path="/my" element={<MyBookingsPage />} />
          <Route path="/booking/:uuid/confirmed" element={<ConfirmedPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin/bookings" element={<DashboardPage initialSection="bookings" />} />
          <Route path="/admin/availability" element={<DashboardPage initialSection="availability" />} />
          <Route path="/admin/event-types" element={<DashboardPage initialSection="event-types" />} />
          <Route path="/admin/blocks" element={<DashboardPage initialSection="blocks" />} />
          <Route path="/admin/hosts" element={<DashboardPage initialSection="hosts" />} />
          <Route path="/cancel/:token" element={<ManageBookingPage mode="cancel" />} />
          <Route path="/reschedule/:token" element={<ManageBookingPage mode="reschedule" />} />
          <Route path="/booking/:uuid/cancel" element={<ManageBookingPage mode="cancel" />} />
          <Route
            path="/booking/:uuid/reschedule"
            element={<ManageBookingPage mode="reschedule" />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HostProvider>
    </TimeFormatProvider>
  )
}
