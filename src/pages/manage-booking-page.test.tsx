import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { BookingStatus, type Booking as ApiBooking } from '@/api/generated'
import { jsonResponse, requestPath } from '@/test/http'
import { defaultTimeZone } from '@/utils/timezone'
import ManageBookingPage from './manage-booking-page'

const currentStart = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
const newStart = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()

const booking: ApiBooking = {
  id: 'token-123',
  hostSlug: 'default',
  eventTypeId: 'type-1',
  startAt: currentStart,
  endAt: new Date(Date.parse(currentStart) + 30 * 60 * 1000).toISOString(),
  timeZone: 'UTC',
  status: BookingStatus.Confirmed,
  clientName: 'Иван',
  clientEmail: 'ivan@example.com',
  clientPhone: null,
  clientNotes: null,
  consentAccepted: true,
  createdAt: '2099-09-23T07:00:00.000Z',
}

const slotRows = [
  { id: 1, startAt: currentStart, durationMin: 30, available: false },
  { id: 2, startAt: newStart, durationMin: 30, available: true },
]

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestPath(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/v1/bookings/token-123' && method === 'GET') {
      return jsonResponse(booking)
    }

    if (url.startsWith('/api/v1/hosts/default/slots') && method === 'GET') {
      return jsonResponse({ timeZone: 'UTC', date: null, slots: slotRows })
    }

    if (url === '/api/v1/bookings/token-123/reschedule' && method === 'POST') {
      return jsonResponse({ ...booking, startAt: newStart })
    }

    if (url === '/api/v1/bookings/token-123/cancel' && method === 'POST') {
      return jsonResponse({ ...booking, status: BookingStatus.Cancelled })
    }

    return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Не найдено' } }, 404)
  })
}

function renderPage(mode: 'reschedule' | 'cancel', token = 'token-123') {
  const path = mode === 'reschedule' ? '/reschedule/:token' : '/cancel/:token'
  const entry = mode === 'reschedule' ? `/reschedule/${token}` : `/cancel/${token}`

  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path={path} element={<ManageBookingPage mode={mode} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ManageBookingPage: перенос', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает текущее время и переносит на выбранный слот', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderPage('reschedule')

    expect(await screen.findByText(/Текущее время:/)).toBeInTheDocument()

    const movedLabel = new Intl.DateTimeFormat('ru-RU', {
      timeZone: defaultTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(newStart))
    await user.click(await screen.findByRole('button', { name: movedLabel }))
    await user.click(screen.getByRole('button', { name: 'Перенести встречу' }))

    expect(await screen.findByRole('heading', { name: 'Встреча перенесена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings/token-123/reschedule'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('показывает ошибку для недействительной ссылки', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { code: 'NOT_FOUND', message: 'Бронь не найдена' } }, 404),
      ),
    )

    renderPage('reschedule', 'broken')

    expect(
      await screen.findByText('Бронь не найдена или ссылка недействительна'),
    ).toBeInTheDocument()
  })
})

describe('ManageBookingPage: отмена', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('раскрывает блок подтверждения и отменяет встречу', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderPage('cancel')

    await user.click(await screen.findByRole('button', { name: 'Отменить встречу' }))

    expect(
      screen.getByText('Вы уверены, что хотите отменить бронирование?'),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Причина отмены (необязательно)'), 'Передумал')
    await user.click(screen.getByRole('button', { name: 'Да, отменить' }))

    expect(await screen.findByRole('heading', { name: 'Встреча отменена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings/token-123/cancel'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('показывает детали встречи на маршруте /booking/:uuid/cancel', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/booking/token-123/cancel']}>
        <Routes>
          <Route path="/booking/:uuid/cancel" element={<ManageBookingPage mode="cancel" />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Ваша встреча' })).toBeInTheDocument()
    expect(screen.getByText('Когда')).toBeInTheDocument()
    expect(within(screen.getByText('Формат').closest('div')!).getByText(/30 мин/)).toBeInTheDocument()
  })
})
