import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { HostSettings } from '@/api/generated'
import { jsonResponse, requestPath } from '@/test/http'
import { defaultTimeZone, toDateKeyInZone } from '@/utils/timezone'
import { App } from './App'

const settings: HostSettings = {
  slug: 'default',
  name: 'Организатор',
  timeZone: 'UTC',
  captcha: { provider: 'turnstile', required: false, siteKey: null },
}

const slot = {
  id: 1,
  startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = requestPath(input)

    if (url === '/api/v1/hosts') {
      return jsonResponse([
        {
          id: '11111111-2222-3333-4444-555555555555',
          slug: 'default',
          name: 'Организатор',
          timeZone: 'UTC',
        },
      ])
    }

    if (/^\/api\/v1\/hosts\/[^/]+\/settings$/.test(url)) {
      return jsonResponse(settings)
    }

    if (/^\/api\/v1\/hosts\/[^/]+\/slots$/.test(url)) {
      return jsonResponse({
        timeZone: 'UTC',
        date: null,
        slots: [
          {
            id: slot.id,
            startAt: slot.startAt,
            durationMin: slot.durationMin,
            available: true,
          },
        ],
      })
    }

    return jsonResponse([])
  })
}

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('на главной показывает лендинг со ссылкой на запись', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Календарь звонков' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Выбрать время/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
  })

  it('на /book/:slug показывает слоты, полученные от API', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/book/default')

    const dateKey = toDateKeyInZone(new Date(slot.startAt), defaultTimeZone)
    expect(await screen.findByRole('button', { name: dateKey })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выберите время' })).toBeDisabled()
  })

  it('на неизвестном хосте показывает «Страница не найдена»', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/book/unknown')

    expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeInTheDocument()
  })

  it('на /book/:uuid (UUID хоста) показывает страницу бронирования', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/book/11111111-2222-3333-4444-555555555555')

    const dateKey = toDateKeyInZone(new Date(slot.startAt), defaultTimeZone)
    expect(await screen.findByRole('button', { name: dateKey })).toBeInTheDocument()
  })
})
