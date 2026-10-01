import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocationType, type EventType } from '@/api/generated'
import { EventTypesEditor } from '@/components/event-types-editor'

const type = (overrides: Partial<EventType> = {}): EventType => ({
  id: 'type-1',
  slug: 'consultation',
  title: 'Звонок-консультация',
  description: 'Описание',
  durationMin: 30,
  locationType: LocationType.Online,
  isActive: true,
  ...overrides,
})

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('EventTypesEditor', () => {
  it('показывает загруженные типы', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json([type()])))

    render(<EventTypesEditor slug="default" />)

    expect(await screen.findByText('Звонок-консультация')).toBeInTheDocument()
    expect(screen.getByText(/consultation · 30 мин · Онлайн/)).toBeInTheDocument()
  })

  it('создаёт тип и добавляет его в список', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'POST') {
        return json(type({ id: 'type-2', slug: 'intro', title: 'Знакомство' }), 201)
      }
      return json([type()])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<EventTypesEditor slug="default" />)
    await screen.findByText('Звонок-консультация')

    await userEvent.type(screen.getByLabelText('Название'), 'Знакомство')
    await userEvent.type(screen.getByLabelText('Slug'), 'intro')
    await userEvent.click(screen.getByRole('button', { name: 'Добавить тип' }))

    expect(await screen.findByText('Знакомство')).toBeInTheDocument()
    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(postCall?.[0]).toContain('/api/v1/hosts/default/event-types')
  })

  it('удаляет тип из списка', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          return new Response(null, { status: 204 })
        }
        return json([type()])
      }),
    )

    render(<EventTypesEditor slug="default" />)
    await screen.findByText('Звонок-консультация')

    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() =>
      expect(screen.queryByText('Звонок-консультация')).not.toBeInTheDocument(),
    )
  })
})
