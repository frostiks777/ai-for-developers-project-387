import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { saveMyBooking } from '@/utils/my-bookings'
import MyBookingsPage from './my-bookings-page'

function renderPage() {
  return render(
    <MemoryRouter>
      <MyBookingsPage />
    </MemoryRouter>,
  )
}

describe('MyBookingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('показывает пустое состояние без сохранённых броней', () => {
    renderPage()

    expect(screen.getByText('Здесь пока пусто')).toBeInTheDocument()
  })

  it('показывает сохранённую бронь со ссылками отмены и переноса', () => {
    saveMyBooking({
      id: 'token-1',
      startAt: '2099-09-24T07:00:00.000Z',
      durationMin: 30,
      eventTypeTitle: 'Консультация',
      hostSlug: 'default',
    })

    renderPage()

    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Перенести' })).toHaveAttribute(
      'href',
      '/reschedule/token-1',
    )
    expect(screen.getByRole('link', { name: 'Отменить' })).toHaveAttribute('href', '/cancel/token-1')
  })

  it('у прошедшей встречи скрывает перенос и отмену, но оставляет «Убрать»', () => {
    saveMyBooking({
      id: 'token-past',
      startAt: '2020-09-24T07:00:00.000Z',
      durationMin: 45,
      eventTypeTitle: 'Прошедшая',
      hostSlug: 'default',
    })

    renderPage()

    expect(screen.getByText('Прошла')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Отменить' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Перенести' })).toBeNull()
    expect(screen.getByRole('button', { name: /Убрать из списка/ })).toBeInTheDocument()
  })

  it('убирает бронь из списка', async () => {
    saveMyBooking({
      id: 'token-1',
      startAt: '2099-09-24T07:00:00.000Z',
      durationMin: 30,
      eventTypeTitle: 'Консультация',
      hostSlug: 'default',
    })

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Убрать из списка/ }))

    expect(screen.queryByText('Консультация')).toBeNull()
    expect(screen.getByText('Здесь пока пусто')).toBeInTheDocument()
    expect(window.localStorage.getItem('call-calendar-my-bookings')).toBe('[]')
  })
})
