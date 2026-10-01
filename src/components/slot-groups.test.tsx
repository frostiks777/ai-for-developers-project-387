import { render, screen } from '@testing-library/react'

import { SlotGroups } from './slot-groups'
import type { TimeSlot } from '@/types/booking'

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T09:00:00.000Z', durationMin: 30, isBooked: false },
  { id: 2, startAt: '2026-09-28T13:00:00.000Z', durationMin: 30, isBooked: true },
  { id: 3, startAt: '2026-09-28T17:00:00.000Z', durationMin: 30, isBooked: false },
]

describe('SlotGroups', () => {
  it('группирует слоты по времени суток', () => {
    render(
      <SlotGroups slots={slots} selectedSlotId={null} timeZone="UTC" onSelect={vi.fn()} />,
    )

    expect(screen.getByText('Утром')).toBeInTheDocument()
    expect(screen.getByText('Днём')).toBeInTheDocument()
    expect(screen.getByText('Вечером')).toBeInTheDocument()
  })

  it('занятое время недоступно и подписано', () => {
    render(
      <SlotGroups slots={slots} selectedSlotId={null} timeZone="UTC" onSelect={vi.fn()} />,
    )

    const booked = screen.getByRole('button', { name: '13:00, занято' })
    expect(booked).toBeDisabled()
    expect(booked).toHaveTextContent('занято')
  })

  it('свободный слот выбирается по клику', async () => {
    const onSelect = vi.fn()
    const userEvent = (await import('@testing-library/user-event')).default.setup()

    render(<SlotGroups slots={slots} selectedSlotId={null} timeZone="UTC" onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: '09:00' }))
    expect(onSelect).toHaveBeenCalledWith(slots[0])
  })
})
