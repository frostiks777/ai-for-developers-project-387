import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { DashboardSidebar } from './dashboard-sidebar'

function renderSidebar(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <DashboardSidebar bookingCount={2} />
    </MemoryRouter>,
  )
}

describe('DashboardSidebar', () => {
  it('ведёт на маршрут раздела доступности', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: /Доступность/ })).toHaveAttribute(
      'href',
      '/admin/availability',
    )
  })

  it('ведёт на маршрут списка встреч и показывает счётчик', () => {
    renderSidebar()

    const link = screen.getByRole('link', { name: /Обзор/ })
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveTextContent('2')
    expect(screen.getByRole('link', { name: /Все встречи/ })).toHaveAttribute(
      'href',
      '/admin/bookings',
    )
  })

  it('выделяет активный раздел', () => {
    renderSidebar('/admin/blocks')

    expect(screen.getByRole('link', { name: 'Блокировки' })).toHaveClass('bg-accent')
  })

  it('логотип ведёт на главную страницу', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/')
  })

  it('показывает ссылку для записи и кнопку копирования', () => {
    renderSidebar()

    expect(screen.getByText('Ссылка для записи')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Скопировать/ })).toBeInTheDocument()
  })
})
