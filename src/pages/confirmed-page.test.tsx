import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { Booking } from '@/api/generated'
import { BookingStatus } from '@/api/generated'
import { jsonResponse, requestPath } from '@/test/http'
import ConfirmedPage from './confirmed-page'

const startAt = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()

const booking: Booking = {
  id: 'token-123',
  hostSlug: 'default',
  eventTypeId: 'default-consultation',
  startAt,
  endAt: new Date(Date.parse(startAt) + 30 * 60 * 1000).toISOString(),
  timeZone: 'UTC',
  status: BookingStatus.Confirmed,
  clientName: 'Иван',
  clientEmail: 'ivan@example.com',
  consentAccepted: true,
  createdAt: '2026-03-27T14:40:00.000Z',
}

const eventType = {
  id: 'default-consultation',
  slug: 'consultation',
  title: 'Звонок-консультация',
  durationMin: 30,
  locationType: 'online',
  isActive: true,
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = requestPath(input)

    if (url === '/api/v1/bookings/token-123') {
      return jsonResponse(booking)
    }

    if (url === '/api/v1/hosts/default/settings') {
      return jsonResponse({ slug: 'default', name: 'Организатор', timeZone: 'UTC' })
    }

    if (url === '/api/v1/hosts/default/event-types') {
      return jsonResponse([eventType])
    }

    return jsonResponse([])
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/booking/token-123/confirmed']}>
      <Routes>
        <Route path="/booking/:uuid/confirmed" element={<ConfirmedPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConfirmedPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает детали брони, способ связи и ссылки управления', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Встреча успешно запланирована!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Звонок-консультация')).toBeInTheDocument()
    expect(screen.getAllByText('Иван').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Перенести встречу/ })).toHaveAttribute(
      'href',
      '/reschedule/token-123',
    )
    expect(screen.getByRole('link', { name: /Отменить встречу/ })).toHaveAttribute(
      'href',
      '/cancel/token-123',
    )
  })

  it('показывает сообщение, если бронь не найдена', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'NOT_FOUND', message: 'нет' } }, 404)),
    )
    renderPage()

    expect(await screen.findByText('Бронь не найдена')).toBeInTheDocument()
  })
})
