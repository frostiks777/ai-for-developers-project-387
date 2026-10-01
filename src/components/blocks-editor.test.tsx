import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { jsonResponse, requestPath } from '@/test/http'
import { BlocksEditor } from './blocks-editor'

const block = {
  id: '7',
  startAt: '2099-09-25T10:00:00.000Z',
  endAt: '2099-09-25T11:00:00.000Z',
  reason: 'Отпуск',
  createdAt: '2099-09-20T10:00:00.000Z',
}

function mockFetch(initial = [block]) {
  let blocks = [...initial]

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestPath(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/v1/hosts/default/blocks' && method === 'GET') {
      return jsonResponse(blocks)
    }

    if (url === '/api/v1/hosts/default/blocks' && method === 'POST') {
      const created = { ...block, id: '8', ...JSON.parse(String(init?.body)), createdAt: block.createdAt }
      blocks = [...blocks, created]
      return jsonResponse(created, 201)
    }

    if (url.startsWith('/api/v1/hosts/default/blocks/') && method === 'DELETE') {
      const id = url.split('/').pop()
      blocks = blocks.filter((item) => item.id !== id)
      return new Response(null, { status: 204 })
    }

    return jsonResponse({ error: 'Не найдено' }, 404)
  })
}

describe('BlocksEditor', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает список блокировок', async () => {
    vi.stubGlobal('fetch', mockFetch())
    render(<BlocksEditor slug="default" />)

    expect(await screen.findByText('Отпуск')).toBeInTheDocument()
  })

  it('показывает пустое состояние', async () => {
    vi.stubGlobal('fetch', mockFetch([]))
    render(<BlocksEditor slug="default" />)

    expect(await screen.findByText('Нет блокировок')).toBeInTheDocument()
  })

  // Регресс #49: на 360 px текст и кнопка встают в столбик — иначе текст
  // сжимается в узкую колонку рядом с кнопкой.
  it('на узком экране ставит описание и кнопку блокировки в столбик', async () => {
    vi.stubGlobal('fetch', mockFetch([]))
    render(<BlocksEditor slug="default" />)

    const description = await screen.findByText(/гости не увидят эти слоты/)
    const button = screen.getByRole('button', { name: 'Заблокировать время' })
    const row = description.parentElement

    expect(row).toHaveClass('flex-col', 'items-start')
    expect(row?.className).toContain('sm:flex-row')
    expect(row?.contains(button)).toBe(true)
  })

  it('создаёт блокировку через модалку', async () => {
    const fetchMock = mockFetch([])
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(<BlocksEditor slug="default" />)

    await screen.findByText('Нет блокировок')
    await user.click(screen.getByRole('button', { name: 'Заблокировать время' }))

    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Причина (необязательно)'), 'Обед')
    await user.click(within(dialog).getByRole('button', { name: 'Заблокировать' }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          requestPath(url) === '/api/v1/hosts/default/blocks' && init?.method === 'POST',
      )
      expect(postCall).toBeDefined()
      const body = JSON.parse(String(postCall?.[1]?.body))
      expect(body.reason).toBe('Обед')
    })
  })

  it('снимает блокировку', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(<BlocksEditor slug="default" />)

    await screen.findByText('Отпуск')
    await user.click(screen.getByRole('button', { name: /Снять блокировку/ }))

    await waitFor(() => expect(screen.queryByText('Отпуск')).toBeNull())
  })

  it('не отправляет блокировку, если конец раньше начала', async () => {
    const fetchMock = mockFetch([])
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(<BlocksEditor slug="default" />)

    await screen.findByText('Нет блокировок')
    await user.click(screen.getByRole('button', { name: 'Заблокировать время' }))

    const dialog = await screen.findByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Начало'))
    await user.type(within(dialog).getByLabelText('Начало'), '2099-09-25T12:00')
    await user.clear(within(dialog).getByLabelText('Конец'))
    await user.type(within(dialog).getByLabelText('Конец'), '2099-09-25T11:00')
    await user.click(within(dialog).getByRole('button', { name: 'Заблокировать' }))

    expect(await screen.findByText('Конец должен быть позже начала')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([, init]) => (init as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(false)
  })
})
