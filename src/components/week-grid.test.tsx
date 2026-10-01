import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WeekGrid } from './week-grid'
import type { TimeSlot } from '@/types/booking'

const weekStart = '2026-09-28'

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T09:00:00.000Z', durationMin: 30, isBooked: false },
  { id: 2, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: true },
  { id: 3, startAt: '2026-09-29T09:00:00.000Z', durationMin: 30, isBooked: false },
]

function renderGrid(overrides: Partial<Parameters<typeof WeekGrid>[0]> = {}) {
  return render(
    <WeekGrid
      slots={slots}
      weekStart={weekStart}
      timeZone="UTC"
      selectedSlotId={null}
      onSelect={vi.fn()}
      onPrevWeek={vi.fn()}
      onNextWeek={vi.fn()}
      canPrev
      canNext
      {...overrides}
    />,
  )
}

describe('WeekGrid', () => {
  it('строит строки по временам и колонки только для дней со слотами', () => {
    renderGrid()

    expect(screen.getByText('Пн 28')).toBeInTheDocument()
    expect(screen.getByText('Вт 29')).toBeInTheDocument()
    expect(screen.queryByText('Ср 30')).toBeNull()
    expect(screen.getAllByRole('button', { name: '09:00' })).toHaveLength(2)
  })

  it('занятое время недоступно, а пустая ячейка без кнопки', () => {
    renderGrid()

    const booked = screen.getByRole('button', { name: '10:00, занято' })
    expect(booked).toBeDisabled()

    // Во вторник в 10:00 слота нет — кнопок «10:00» ровно одна (занятая в понедельник)
    expect(screen.getAllByRole('button', { name: /^10:00/ })).toHaveLength(1)
  })

  it('выбирает слот по клику', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    renderGrid({ onSelect })

    await user.click(screen.getAllByRole('button', { name: '09:00' })[0])
    expect(onSelect).toHaveBeenCalledWith(slots[0])
  })
})
