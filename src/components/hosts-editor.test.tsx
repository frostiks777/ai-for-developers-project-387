import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Host } from '@/api/generated'
import { HostsEditor } from '@/components/hosts-editor'
import { HostContext, type HostContextValue } from '@/hooks/use-active-host'
import { jsonResponse, requestPath } from '@/test/http'

const hosts: Host[] = [{ id: 'host-a', slug: 'default', name: 'Организатор', timeZone: 'UTC' }]

function renderEditor(overrides: Partial<HostContextValue> = {}) {
  const setActiveSlug = vi.fn()
  const reload = vi.fn().mockResolvedValue(undefined)
  const value: HostContextValue = {
    hosts,
    activeSlug: 'default',
    activeHost: hosts[0],
    setActiveSlug,
    reload,
    isLoading: false,
    ...overrides,
  }

  render(
    <HostContext.Provider value={value}>
      <HostsEditor />
    </HostContext.Provider>,
  )

  return { setActiveSlug, reload }
}

describe('HostsEditor', () => {
  it('подсвечивает активного организатора', () => {
    renderEditor()

    expect(screen.getByText('Организатор')).toBeInTheDocument()
    expect(screen.getByText('Активный')).toBeInTheDocument()
  })

  it('создаёт организатора и делает его активным', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (requestPath(input) === '/api/v1/hosts' && init?.method === 'POST') {
        return jsonResponse({ id: 'host-c', slug: 'boris', name: 'Борис', timeZone: 'UTC' }, 201)
      }

      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)

    const { setActiveSlug, reload } = renderEditor()

    await userEvent.type(screen.getByLabelText('Имя'), 'Борис')
    await userEvent.type(screen.getByLabelText('Slug'), 'boris')
    await userEvent.click(screen.getByRole('button', { name: 'Создать организатора' }))

    await waitFor(() => expect(setActiveSlug).toHaveBeenCalledWith('boris'))
    expect(reload).toHaveBeenCalled()

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(String(postCall?.[1]?.body)).toContain('boris')
  })

  it('показывает ошибку API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (requestPath(input) === '/api/v1/hosts' && init?.method === 'POST') {
          return jsonResponse({ error: { code: 'CONFLICT', message: 'Хост с таким slug уже существует' } }, 409)
        }

        return jsonResponse([])
      }),
    )

    renderEditor()

    await userEvent.type(screen.getByLabelText('Имя'), 'Борис')
    await userEvent.type(screen.getByLabelText('Slug'), 'default')
    await userEvent.click(screen.getByRole('button', { name: 'Создать организатора' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Хост с таким slug уже существует')
  })
})
