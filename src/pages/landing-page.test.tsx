import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { jsonResponse, requestPath } from '@/test/http'
import LandingPage from './landing-page'

const availability = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
  ranges: [],
}

const settings = { slug: 'default', name: 'Анна Петрова', timeZone: 'UTC' }

const eventTypes = [
  {
    id: 'consultation',
    slug: 'consultation',
    title: 'Консультация',
    durationMin: 30,
    locationType: 'online',
    isActive: true,
  },
  {
    id: 'conference',
    slug: 'conference',
    title: 'Конференция',
    durationMin: 45,
    locationType: 'offline',
    isActive: true,
  },
]

function mockFetch(status = 200) {
  return vi.fn(async (input: RequestInfo | URL) => {
    if (status !== 200) {
      return jsonResponse({ error: 'Внутренняя ошибка' }, status)
    }

    const url = requestPath(input)

    if (url === '/api/v1/hosts/default/availability') {
      return jsonResponse(availability)
    }

    if (url === '/api/v1/hosts/default/event-types') {
      return jsonResponse(eventTypes)
    }

    return jsonResponse(settings)
  })
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('рассказывает про сервис и ведёт на запись', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderLanding()

    expect(await screen.findByText('Анна Петрова')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Выбрать время/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
    expect(screen.getByRole('heading', { name: 'Как это работает' })).toBeInTheDocument()
  })

  it('показывает форматы встречи со ссылкой на запись выбранного формата', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderLanding()

    expect(await screen.findByRole('heading', { name: 'Форматы встречи' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Конференция/ })).toHaveAttribute(
      'href',
      '/book/default?type=conference',
    )
  })

  it('прячет подпись организатора и показывает данные конфига, если API недоступно', async () => {
    vi.stubGlobal('fetch', mockFetch(500))
    renderLanding()

    expect(await screen.findAllByText('Звонок-консультация')).not.toHaveLength(0)
    expect(screen.queryByText('Организатор')).toBeNull()
    expect(screen.getByRole('link', { name: /Записаться на звонок/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
  })
})
