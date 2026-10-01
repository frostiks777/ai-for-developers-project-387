import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { jsonResponse, requestPath } from '@/test/http'
import type { AvailabilitySettings } from '@/types/availability-settings'
import type { BookingWithSlot } from '@/types/booking'
import { defaultTimeZone, formatDayTitle, toDateKeyInZone } from '@/utils/timezone'
import DashboardPage, { type DashboardSection } from './dashboard-page'

const booking: BookingWithSlot = {
  id: 'token-1',
  name: 'Иван',
  phone: '+79000000000',
  email: 'ivan@example.com',
  comment: 'Обсудить архитектуру',
  createdAt: '2026-09-23T10:00:00.000Z',
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
  status: 'confirmed',
  eventTypeId: 'default-consultation',
  eventTypeTitle: 'Звонок-консультация',
}

const defaultSettings: AvailabilitySettings = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
  ranges: [
    { weekday: 1, startMinute: 600, endMinute: 1080 },
    { weekday: 2, startMinute: 600, endMinute: 1080 },
    { weekday: 3, startMinute: 600, endMinute: 1080 },
    { weekday: 4, startMinute: 600, endMinute: 1080 },
    { weekday: 5, startMinute: 600, endMinute: 1080 },
  ],
}

const toApi = (item: BookingWithSlot) => ({
  id: item.id,
  hostSlug: 'default',
  eventTypeId: item.eventTypeId,
  startAt: item.startAt,
  endAt: new Date(new Date(item.startAt).getTime() + item.durationMin * 60_000).toISOString(),
  timeZone: 'UTC',
  clientName: item.name,
  clientEmail: item.email,
  clientPhone: item.phone,
  clientNotes: item.comment,
  status: item.status,
  createdAt: item.createdAt,
})

const eventType = {
  id: 'default-consultation',
  slug: 'consultation',
  title: 'Звонок-консультация',
  durationMin: 30,
  locationType: 'online',
  isActive: true,
}

function mockFetch(initialBookings: BookingWithSlot[] = [booking]) {
  let bookings = [...initialBookings]

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestPath(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/v1/hosts/default/bookings' && method === 'GET') {
      return jsonResponse(bookings.map(toApi))
    }

    if (url.startsWith('/api/v1/bookings/') && url.endsWith('/cancel') && method === 'POST') {
      const id = url.split('/')[4]
      bookings = bookings.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item))
      return jsonResponse({})
    }

    if (url === '/api/v1/hosts/default/availability' && method === 'GET') {
      return jsonResponse(defaultSettings)
    }

    if (url === '/api/v1/hosts/default/availability' && method === 'PUT') {
      return jsonResponse(JSON.parse(String(init?.body)))
    }

    if (url === '/api/v1/hosts/default/event-types' && method === 'GET') {
      return jsonResponse([eventType])
    }

    if (url.startsWith('/api/v1/hosts/default/slots') && method === 'GET') {
      return jsonResponse({
        timeZone: 'UTC',
        date: null,
        slots: [
          {
            id: 1,
            startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            durationMin: 30,
            available: true,
          },
        ],
      })
    }

    return jsonResponse({ error: 'Не найдено' }, 404)
  })
}

function renderDashboard(initialSection?: DashboardSection) {
  return render(
    <MemoryRouter>
      <DashboardPage initialSection={initialSection} />
    </MemoryRouter>,
  )
}

describe('DashboardPage: разделы', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('на /admin/bookings показывает встречи, /admin/availability — форму доступности', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const { unmount } = renderDashboard('bookings')
    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Сохранить' })).toBeNull()
    unmount()

    renderDashboard('availability')
    expect(await screen.findByRole('button', { name: 'Сохранить' })).toBeEnabled()
    expect(screen.getByRole('switch', { name: 'Пн: доступность' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Сб: доступность' })).not.toBeChecked()
    expect(screen.queryByText('Иван')).toBeNull()
  })

  it('отменяет бронь и убирает её из списка', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDashboard('bookings')

    await user.click(await screen.findByRole('button', { name: /Иван/ }))
    const cancel = await screen.findByRole('button', { name: 'Отменить' })
    await user.click(cancel)

    await waitFor(() => expect(screen.queryByText('Иван')).toBeNull())

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings/token-1/cancel'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(screen.getByText('Пока нет ни одной брони')).toBeInTheDocument()
  })

  it('сохраняет изменённые настройки доступности', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDashboard('availability')

    await screen.findByRole('button', { name: 'Сохранить' })

    const saturday = screen.getByRole('switch', { name: 'Сб: доступность' })
    await user.click(saturday)
    expect(saturday).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          requestPath(url).startsWith('/api/v1/hosts/default/availability') &&
          init?.method === 'PUT',
      )
      expect(putCall).toBeDefined()
      const body = JSON.parse(String(putCall?.[1]?.body)) as AvailabilitySettings
      expect(body.ranges.some((range) => range.weekday === 6)).toBe(true)
    })
  })

  it('блокирует сохранение, если не выбран ни один рабочий день', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderDashboard('availability')

    await screen.findByRole('button', { name: 'Сохранить' })

    for (const label of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']) {
      await user.click(screen.getByRole('switch', { name: `${label}: доступность` }))
    }

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    expect(screen.getByText('Выберите хотя бы один рабочий день')).toBeInTheDocument()
  })

  it('показывает пустой список, если броней нет', async () => {
    vi.stubGlobal('fetch', mockFetch([]))
    renderDashboard('bookings')

    expect(await screen.findByText('Пока нет ни одной брони')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Отменить' })).toBeNull()
  })

  it('не показывает отменённые брони среди предстоящих', async () => {
    const cancelled: BookingWithSlot = {
      ...booking,
      id: 'token-2',
      name: 'Отменённый',
      status: 'cancelled',
    }
    vi.stubGlobal('fetch', mockFetch([booking, cancelled]))
    renderDashboard('bookings')

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.queryByText('Отменённый')).toBeNull()
  })

  it('счётчик встреч в сайдбаре считает только активные брони', async () => {
    const cancelled: BookingWithSlot = {
      ...booking,
      id: 'token-2',
      name: 'Отменённый',
      status: 'cancelled',
    }
    vi.stubGlobal('fetch', mockFetch([booking, cancelled]))
    renderDashboard('bookings')

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    const sidebar = screen.getByRole('navigation', { name: 'Панель организатора' })
    expect(within(sidebar).getByText('1')).toBeInTheDocument()
  })

  it('позволяет задать несколько интервалов в день', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDashboard('availability')

    await screen.findByRole('button', { name: 'Сохранить' })

    await user.click(screen.getByRole('button', { name: 'Добавить интервал: Пн' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          requestPath(url).startsWith('/api/v1/hosts/default/availability') &&
          init?.method === 'PUT',
      )
      const body = JSON.parse(String(putCall?.[1]?.body)) as AvailabilitySettings
      expect(body.ranges.filter((range) => range.weekday === 1)).toHaveLength(2)
    })
  })

  it('перезапрашивает брони при смене раздела, чтобы счётчик видел новые заявки', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    let rows: BookingWithSlot[] = [{ ...booking, startAt: future }]

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestPath(input)
      const method = init?.method ?? 'GET'

      if (url === '/api/v1/hosts/default/bookings' && method === 'GET') {
        return jsonResponse(rows.map(toApi))
      }
      if (url === '/api/v1/hosts/default/availability') {
        return jsonResponse(defaultSettings)
      }
      if (url === '/api/v1/hosts/default/event-types') {
        return jsonResponse([eventType])
      }
      if (url.startsWith('/api/v1/hosts/default/slots')) {
        return jsonResponse({ timeZone: 'UTC', date: null, slots: [] })
      }

      return jsonResponse({ error: 'Не найдено' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = render(
      <MemoryRouter>
        <DashboardPage initialSection="overview" />
      </MemoryRouter>,
    )

    const sidebar = await screen.findByRole('navigation', { name: 'Панель организатора' })
    await waitFor(() => expect(within(sidebar).getByText('1')).toBeInTheDocument())

    rows = [...rows, { ...booking, id: 'token-2', name: 'Мария', startAt: future }]

    rerender(
      <MemoryRouter>
        <DashboardPage initialSection="bookings" />
      </MemoryRouter>,
    )

    await waitFor(() => expect(within(sidebar).getByText('2')).toBeInTheDocument())
  })
})

describe('DashboardPage: обзор', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('по умолчанию показывает обзор и ближайшие встречи', async () => {
    const soon: BookingWithSlot = {
      ...booking,
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
    vi.stubGlobal('fetch', mockFetch([soon]))
    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'Ближайшие встречи' })).toBeInTheDocument()
    expect(screen.getByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('Неделя глазами гостя')).toBeInTheDocument()
  })
})

describe('BookingsList', () => {
  it('не показывает телефон, если он не указан', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ...booking, phone: null }]))
    renderDashboard('bookings')

    const row = (await screen.findByRole('button', { name: /Иван/ })).closest('li')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).queryByText('+79000000000')).toBeNull()
  })
})

describe('DashboardPage: группировка и фильтр', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('группирует брони по дням', async () => {
    const second: BookingWithSlot = {
      ...booking,
      id: 'token-2',
      name: 'Мария',
      email: 'maria@example.com',
      comment: null,
      startAt: '2099-09-25T07:00:00.000Z',
    }
    vi.stubGlobal('fetch', mockFetch([booking, second]))
    renderDashboard('bookings')

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('Мария')).toBeInTheDocument()

    const firstHeading = formatDayTitle(toDateKeyInZone(new Date(booking.startAt), defaultTimeZone))
    const secondHeading = formatDayTitle(toDateKeyInZone(new Date(second.startAt), defaultTimeZone))
    expect(screen.getByRole('heading', { name: firstHeading })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: secondHeading })).toBeInTheDocument()
  })

  it('таб «Прошедшие» показывает прошедшую бронь и скрывает предстоящую', async () => {
    const now = Date.now()
    const pastBooking: BookingWithSlot = {
      ...booking,
      id: 'token-3',
      name: 'Прошедший',
      startAt: new Date(now - 60 * 60 * 1000).toISOString(),
    }
    const upcomingBooking: BookingWithSlot = {
      ...booking,
      id: 'token-4',
      name: 'Будущий',
      startAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    }
    vi.stubGlobal('fetch', mockFetch([pastBooking, upcomingBooking]))
    renderDashboard('bookings')

    const user = userEvent.setup()
    expect(await screen.findByText('Будущий')).toBeInTheDocument()
    expect(screen.queryByText('Прошедший')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Прошедшие' }))

    await waitFor(() => expect(screen.queryByText('Будущий')).toBeNull())
    expect(screen.getByText('Прошедший')).toBeInTheDocument()
  })

  it('поиск фильтрует брони по имени и email', async () => {
    const second: BookingWithSlot = {
      ...booking,
      id: 'token-5',
      name: 'Мария',
      email: 'maria@example.com',
      startAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    }
    vi.stubGlobal('fetch', mockFetch([booking, second]))
    renderDashboard('bookings')

    const user = userEvent.setup()
    expect(await screen.findByText('Иван')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Поиск по имени и email'), 'maria')

    await waitFor(() => expect(screen.queryByText('Иван')).toBeNull())
    expect(screen.getByText('Мария')).toBeInTheDocument()
  })

  // Сетка считается по slotDurationMin: буферы в неё не входят (#89).
  it('показывает подсказку о числе слотов', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderDashboard('availability')

    expect(await screen.findByText(/≈ 16 слотов в рабочий день/)).toBeInTheDocument()
  })
})

describe('DashboardPage: admin-маршруты', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('/admin/availability рендерит только раздел доступности', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderDashboard('availability')

    expect(await screen.findByRole('button', { name: 'Сохранить' })).toBeInTheDocument()
    expect(screen.queryByText('Иван')).toBeNull()
  })

  it('на телефоне открывает запрошенный таб', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = (() =>
      ({
        matches: false,
        media: '(min-width: 1024px)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList) as typeof window.matchMedia

    try {
      vi.stubGlobal('fetch', mockFetch())
      renderDashboard('event-types')

      expect(await screen.findByRole('tab', { name: 'Типы' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(screen.getByRole('button', { name: 'Добавить тип' })).toBeInTheDocument()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
