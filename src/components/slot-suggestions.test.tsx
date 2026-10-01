import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SlotSuggestions } from './slot-suggestions'
import type { TimeSlot } from '@/types/booking'

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T15:00:00.000Z', durationMin: 30, isBooked: false },
  { id: 2, startAt: '2026-09-28T15:40:00.000Z', durationMin: 30, isBooked: false },
  { id: 3, startAt: '2026-09-29T09:00:00.000Z', durationMin: 30, isBooked: false },
  { id: 4, startAt: '2026-09-29T10:00:00.000Z', durationMin: 30, isBooked: false },
]

describe('SlotSuggestions', () => {
  it('показывает до трёх ближайших окон и выбирает по клику', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<SlotSuggestions slots={slots} timeZone="UTC" onSelect={onSelect} />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: '15:40' }))
    expect(onSelect).toHaveBeenCalledWith(slots[1])
  })
})
