import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DayList } from './day-list'
import type { TimeSlot } from '@/types/booking'

function slot(id: number, iso: string): TimeSlot {
  return { id, startAt: iso, durationMin: 30, isBooked: false }
}

describe('DayList', () => {
  it('показывает только дни со свободными слотами и полный заголовок дня', async () => {
    const onSelectDate = vi.fn()
    const user = userEvent.setup()

    render(
      <DayList
        slots={[slot(1, '2026-09-28T10:00:00.000Z'), slot(2, '2026-09-29T10:00:00.000Z')]}
        timeZone="UTC"
        onSelectDate={onSelectDate}
      />,
    )

    const monday = screen.getByRole('button', { name: '2026-09-28' })
    expect(monday).toHaveTextContent('Понедельник, 28 сентября')

    await user.click(monday)
    expect(onSelectDate).toHaveBeenCalledWith('2026-09-28')
  })

  it('сворачивает выходные в серую строку', () => {
    render(
      <DayList
        slots={[slot(1, '2026-10-02T10:00:00.000Z'), slot(2, '2026-10-05T10:00:00.000Z')]}
        timeZone="UTC"
        onSelectDate={vi.fn()}
      />,
    )

    expect(screen.getByText('Суббота и воскресенье — выходные')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2026-10-03' })).toBeNull()
  })
})
