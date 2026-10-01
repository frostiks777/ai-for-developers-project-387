import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { BookingWithSlot } from '@/types/booking'
import { BookingsList } from './bookings-list'

// Прошедшая встреча не должна предлагать «Скопировать текст об отмене»:
// отменять уже нечего, встреча состоялась (#76).

const makeBooking = (overrides: Partial<BookingWithSlot> = {}): BookingWithSlot => ({
  id: 'token-1',
  name: 'Андрей',
  phone: '+79000000000',
  email: 'andrey@example.com',
  comment: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  status: 'confirmed',
  eventTypeId: 'default-consultation',
  eventTypeTitle: 'Конференция',
  ...overrides,
})

const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

const openRow = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
}

describe('BookingsList: действия у прошедших встреч', () => {
  it('у предстоящей встречи показывает копирование текста об отмене', async () => {
    render(<BookingsList bookings={[makeBooking()]} onCancel={vi.fn()} />)
    await openRow('Андрей')

    expect(screen.getByRole('button', { name: /Скопировать текст об отмене/ })).toBeInTheDocument()
  })

  it('у прошедшей встречи не показывает копирование текста об отмене', async () => {
    render(
      <BookingsList bookings={[makeBooking({ startAt: pastStart })]} onCancel={vi.fn()} showCancel={false} />,
    )
    await openRow('Андрей')

    expect(screen.queryByRole('button', { name: /Скопировать текст об отмене/ })).toBeNull()
  })

  it('у прошедшей встречи не оставляет пустой блок действий', async () => {
    const { container } = render(
      <BookingsList bookings={[makeBooking({ startAt: pastStart })]} onCancel={vi.fn()} showCancel={false} />,
    )
    await openRow('Андрей')

    // Данные гостя остаются, но ряд кнопок не должен рендериться впустую
    expect(screen.getByText('andrey@example.com')).toBeInTheDocument()
    expect(container.querySelector('.mt-3.flex.flex-wrap.gap-2')).toBeNull()
  })

  it('у прошедшей встречи с showCancel всё равно скрывает копирование, но оставляет «Отменить»', async () => {
    render(
      <BookingsList bookings={[makeBooking({ startAt: pastStart })]} onCancel={vi.fn()} showCancel />,
    )
    await openRow('Андрей')

    expect(screen.queryByRole('button', { name: /Скопировать текст об отмене/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument()
  })
})
