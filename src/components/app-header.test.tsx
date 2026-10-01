import { fireEvent, render, screen } from '@testing-library/react'
import { createEvent } from '@testing-library/dom'
import { MemoryRouter } from 'react-router-dom'

import { AppHeader } from './app-header'

describe('AppHeader: вход в панель организатора', () => {
  // jsdom пытается выполнить навигацию по обычной <a> через setTimeout —
  // фейковые таймеры гасят это, не мешая проверке defaultPrevented.
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('кнопка панели — обычная ссылка (полная навигация, серверный Basic-auth)', () => {
    render(
      <MemoryRouter>
        <AppHeader tabs={[{ to: '/', label: 'Записаться', active: true }]} />
      </MemoryRouter>,
    )

    const link = screen.getByLabelText('Панель организатора')
    expect(link).toHaveAttribute('href', '/dashboard')

    const click = createEvent.click(link)
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(false)
  })

  it('ссылка linkTo на админ-маршрут — обычная ссылка', () => {
    render(
      <MemoryRouter>
        <AppHeader linkTo="/dashboard" linkLabel="Организатору" variant="mobile" />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Организатору' })
    expect(link).toHaveAttribute('href', '/dashboard')

    const click = createEvent.click(link)
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(false)
  })

  it('ссылка linkTo на публичный маршрут — SPA-переход (preventDefault)', () => {
    render(
      <MemoryRouter>
        <AppHeader linkTo="/book/default" linkLabel="Бронирование" variant="mobile" />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Бронирование' })
    const click = createEvent.click(link)
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(true)
  })
})
