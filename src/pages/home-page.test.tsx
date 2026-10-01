import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { jsonResponse, requestPath } from '@/test/http'
import type { TimeSlot } from '@/types/booking'
import { defaultTimeZone, formatTimeInZone, toDateKeyInZone } from '@/utils/timezone'
import HomePage from './home-page'

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/book/default']}>
      <Routes>
        <Route path="/book/:slug" element={<HomePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const slot: TimeSlot = {
  id: 1,
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
  isBooked: false,
}

const eventType = {
  id: 'type-1',
  hostId: 'host-1',
  slug: 'consultation',
  title: 'Консультация',
  description: null,
  durationMin: 30,
  locationType: 'online' as const,
  isActive: true,
  createdAt: '2026-09-24 10:00:00',
}

const meetingTypes = [
  eventType,
  {
    id: 'type-2',
    hostId: 'host-1',
    slug: 'deep-dive',
    title: 'Глубокая сессия',
    description: null,
    durationMin: 60,
    locationType: 'online' as const,
    isActive: true,
    createdAt: '2026-09-24 10:00:00',
  },
]

function mockFetch(slots: TimeSlot[] = [slot]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestPath(input)

    if (url.startsWith('/api/v1/hosts/default/slots')) {
      return jsonResponse({
        timeZone: 'UTC',
        date: null,
        slots: slots.map((item) => ({
          id: item.id,
          startAt: item.startAt,
          durationMin: item.durationMin,
          available: !item.isBooked,
        })),
      })
    }

    if (url === '/api/v1/hosts/default/event-types') {
      return jsonResponse([eventType])
    }

    if (url === '/api/v1/hosts/default/bookings' && init?.method === 'POST') {
      return jsonResponse(
        {
          id: 'booking-token',
          hostSlug: 'default',
          eventTypeId: 'type-1',
          startAt: slot.startAt,
          endAt: slot.startAt,
          status: 'confirmed',
          clientName: 'Иван',
          clientEmail: 'ivan@example.com',
          clientPhone: '+79000000000',
          clientNotes: null,
          createdAt: '2099-09-23T07:00:00.000Z',
        },
        201,
      )
    }

    if (url === '/api/v1/hosts/default/availability') {
      return jsonResponse({
        timeZone: 'UTC',
        slotDurationMin: 30,
        bufferBeforeMin: 0,
        bufferAfterMin: 10,
        minNoticeMin: 120,
        horizonDays: 99999,
        ranges: [],
      })
    }

    return jsonResponse({ error: 'Не найдено' }, 404)
  })
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  const form = screen.getByRole('form', { name: 'Ваши данные' })

  await user.type(within(form).getByLabelText('Имя'), 'Иван')
  await user.type(within(form).getByLabelText('Email'), 'ivan@example.com')
  await user.click(within(form).getByLabelText('Согласие на обработку персональных данных'))
}

async function bookSlot(
  user: ReturnType<typeof userEvent.setup>,
  startAt = slot.startAt,
) {
  const time = formatTimeInZone(startAt, defaultTimeZone)
  await user.click(await screen.findByRole('button', { name: time }))
  await fillForm(user)
  await user.click(screen.getByRole('button', { name: /^Записаться на/ }))
}

describe('HomePage: экран успеха', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('после брони показывает экран успеха со сводкой', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)

    expect(
      await screen.findByRole('heading', { name: 'Встреча успешно запланирована!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })

  it('на экране успеха есть ссылка для отмены', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)

    const cancelLink = await screen.findByLabelText('Ссылка для отмены')
    expect((cancelLink as HTMLInputElement).value).toContain('/cancel/booking-token')
  })

  it('сохраняет бронь в localStorage для страницы «Мои встречи»', async () => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)

    await screen.findByRole('heading', { name: 'Встреча успешно запланирована!' })

    const saved = JSON.parse(window.localStorage.getItem('call-calendar-my-bookings') ?? '[]')
    expect(saved).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'booking-token', durationMin: 30 })]),
    )
  })

  it('на экране успеха есть экспорт в календарь', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)

    expect(await screen.findByRole('button', { name: 'Скачать .ics' })).toBeInTheDocument()
    const googleLink = screen.getByRole('link', { name: 'Добавить в Google Календарь' })
    expect(googleLink).toHaveAttribute('href', expect.stringContaining('calendar.google.com'))
    expect(googleLink.getAttribute('href')).toContain(`text=${encodeURIComponent('Консультация')}`)
  })

  it('кнопка «Выбрать другое время» возвращает к выбору времени', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)
    await user.click(await screen.findByRole('button', { name: 'Выбрать другое время' }))

    expect(await screen.findByRole('button', { name: 'Выберите время' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча успешно запланирована!' })).toBeNull()
  })

  it('кнопка «Назад» на экране успеха возвращает к выбору времени', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)
    await user.click(await screen.findByRole('button', { name: 'Назад' }))

    expect(await screen.findByRole('button', { name: 'Выберите время' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча успешно запланирована!' })).toBeNull()
  })

  it('пересчитывает время слотов при смене часового пояса', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await screen.findByRole('button', { name: 'Выберите время' })

    await user.click(screen.getByLabelText('Часовой пояс'))
    await user.click(screen.getByRole('option', { name: /^UTC/ }))

    expect(screen.getByText(/07:00/)).toBeInTheDocument()
  })

  it('фильтрует слоты по выбранной в сетке дате', async () => {
    const firstDay = new Date(2099, 8, 24, 10, 0)
    const secondDay = new Date(2099, 8, 25, 15, 0)
    const twoSlots: TimeSlot[] = [
      { id: 1, startAt: firstDay.toISOString(), durationMin: 30, isBooked: false },
      { id: 2, startAt: secondDay.toISOString(), durationMin: 30, isBooked: false },
    ]
    vi.stubGlobal('fetch', mockFetch(twoSlots))

    const user = userEvent.setup()
    renderHomePage()

    const secondKey = toDateKeyInZone(secondDay, defaultTimeZone)

    expect(await screen.findByText(formatTimeInZone(firstDay.toISOString(), defaultTimeZone))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: secondKey }))

    expect(screen.getByText(formatTimeInZone(secondDay.toISOString(), defaultTimeZone))).toBeInTheDocument()
    expect(
      screen.queryByText(formatTimeInZone(firstDay.toISOString(), defaultTimeZone)),
    ).toBeNull()
  })

  it('не выбирает время за гостя', async () => {
    const slots: TimeSlot[] = [
      { id: 1, startAt: new Date(2099, 8, 24, 7, 0).toISOString(), durationMin: 30, isBooked: true },
      { id: 2, startAt: new Date(2099, 8, 24, 8, 0).toISOString(), durationMin: 30, isBooked: false },
      { id: 3, startAt: new Date(2099, 8, 24, 9, 0).toISOString(), durationMin: 30, isBooked: false },
    ]
    vi.stubGlobal('fetch', mockFetch(slots))

    const user = userEvent.setup()
    renderHomePage()

    const submit = await screen.findByRole('button', { name: 'Выберите время' })
    expect(submit).toBeDisabled()

    expect(screen.getAllByRole('button', { name: '08:00' })[0]).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await user.click(screen.getByRole('button', { name: '09:00' }))

    expect(screen.getByRole('button', { name: '09:00' })).toHaveAttribute('aria-pressed', 'true')
    await fillForm(user)
    expect(screen.getByRole('button', { name: 'Записаться на 09:00' })).toBeEnabled()
  })
})

describe('HomePage: мобильная раскладка', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.unstubAllGlobals()
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
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('мобильный мастер: день → время → контакты', async () => {
    const mobileSlot: TimeSlot = {
      id: 1,
      startAt: new Date(2099, 8, 24, 10, 0).toISOString(),
      durationMin: 30,
      isBooked: false,
    }
    vi.stubGlobal('fetch', mockFetch([mobileSlot]))

    const user = userEvent.setup()
    renderHomePage()

    const dateKey = toDateKeyInZone(new Date(mobileSlot.startAt), defaultTimeZone)

    await user.click(await screen.findByRole('button', { name: dateKey }))
    await user.click(
      await screen.findByRole('button', {
        name: formatTimeInZone(mobileSlot.startAt, defaultTimeZone),
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Далее' }))

    expect(screen.getByRole('form', { name: 'Ваши данные' })).toBeInTheDocument()
  })

  it('открывает контакты при выборе времени на другой дате', async () => {
    const first: TimeSlot = {
      id: 1,
      startAt: new Date(2099, 8, 24, 10, 0).toISOString(),
      durationMin: 30,
      isBooked: false,
    }
    const second: TimeSlot = {
      id: 2,
      startAt: new Date(2099, 8, 25, 15, 0).toISOString(),
      durationMin: 30,
      isBooked: false,
    }
    vi.stubGlobal('fetch', mockFetch([first, second]))

    const user = userEvent.setup()
    renderHomePage()

    await user.click(
      await screen.findByRole('button', {
        name: toDateKeyInZone(new Date(first.startAt), defaultTimeZone),
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Следующий день' }))
    await user.click(
      await screen.findByRole('button', {
        name: formatTimeInZone(second.startAt, defaultTimeZone),
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Далее' }))

    expect(screen.getByRole('form', { name: 'Ваши данные' })).toBeInTheDocument()
  })
})

describe('HomePage: вид «Неделя»', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('переключается на неделю и сохраняет выбор в localStorage', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await user.click(await screen.findByRole('tab', { name: 'Неделя' }))

    expect(await screen.findByRole('button', { name: 'Предыдущая неделя' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Ваши данные' })).toBeInTheDocument()
    expect(window.localStorage.getItem('call-calendar-booking-view')).toBe('week')
  })
})

describe('HomePage: выбор типа встречи', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает типы и перезапрашивает слоты с выбранным типом', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestPath(input)

      if (url === '/api/v1/hosts/default/event-types') {
        return jsonResponse(meetingTypes)
      }

      if (url.startsWith('/api/v1/hosts/default/slots')) {
        return jsonResponse({
          timeZone: 'UTC',
          date: null,
          slots: [
            {
              id: 1,
              startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              durationMin: 30,
              available: true,
            },
          ],
        })
      }

      return jsonResponse({ error: 'Не найдено' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderHomePage()

    const radios = await screen.findAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Консультация/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await user.click(screen.getByRole('radio', { name: /Глубокая сессия/ }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes('eventTypeId=type-2')),
      ).toBe(true),
    )
  })

  it('выбирает формат из параметра type', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestPath(input)

      if (url === '/api/v1/hosts/default/event-types') {
        return jsonResponse(meetingTypes)
      }

      if (url.startsWith('/api/v1/hosts/default/slots')) {
        return jsonResponse({
          timeZone: 'UTC',
          date: null,
          slots: [
            {
              id: 1,
              startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              durationMin: 30,
              available: true,
            },
          ],
        })
      }

      return jsonResponse({ error: 'Не найдено' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/book/default?type=type-2']}>
        <Routes>
          <Route path="/book/:slug" element={<HomePage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('radio', { name: /Глубокая сессия/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: /Консультация/ })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })
})
