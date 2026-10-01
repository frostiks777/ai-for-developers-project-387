import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Host } from '@/api/generated'
import { HostSelect } from '@/components/host-select'
import { HostContext, type HostContextValue } from '@/hooks/use-active-host'

const hosts: Host[] = [
  { id: 'host-a', slug: 'default', name: 'Организатор', timeZone: 'UTC' },
  { id: 'host-b', slug: 'anna', name: 'Анна', timeZone: 'Europe/Moscow' },
]

function renderSelect(overrides: Partial<HostContextValue> = {}) {
  const setActiveSlug = vi.fn()
  const value: HostContextValue = {
    hosts,
    activeSlug: 'default',
    activeHost: hosts[0],
    setActiveSlug,
    reload: vi.fn(),
    isLoading: false,
    ...overrides,
  }

  render(
    <HostContext.Provider value={value}>
      <HostSelect />
    </HostContext.Provider>,
  )

  return { setActiveSlug }
}

describe('HostSelect', () => {
  it('показывает всех организаторов', () => {
    renderSelect()

    const select = screen.getByLabelText('Организатор')
    expect(select).toHaveValue('default')
    expect(screen.getByRole('option', { name: 'Анна · anna' })).toBeInTheDocument()
  })

  it('переключает активного организатора', async () => {
    const { setActiveSlug } = renderSelect()

    await userEvent.selectOptions(screen.getByLabelText('Организатор'), 'anna')

    expect(setActiveSlug).toHaveBeenCalledWith('anna')
  })
})
