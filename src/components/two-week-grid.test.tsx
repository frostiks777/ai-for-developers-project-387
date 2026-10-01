import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TwoWeekGrid } from './two-week-grid'
import type { TimeSlot } from '@/types/booking'

function nextMondayUtc(): Date {
  const now = new Date()
  const offset = (8 - now.getUTCDay()) % 7

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset))
}

const mondayDate = nextMondayUtc()
const monday = mondayDate.toISOString().slice(0, 10)
const saturday = new Date(mondayDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

function buildSlots(count: number): TimeSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    startAt: new Date(
      Date.UTC(
        mondayDate.getUTCFullYear(),
        mondayDate.getUTCMonth(),
        mondayDate.getUTCDate(),
        10,
        index * 30,
      ),
    ).toISOString(),
    durationMin: 30,
    isBooked: false,
  }))
}

describe('TwoWeekGrid', () => {
  it('показывает число окон под датой и выбирает день по клику', async () => {
    const onSelectDate = vi.fn()
    const user = userEvent.setup()

    render(
      <TwoWeekGrid
        slots={buildSlots(10)}
        selectedDate={monday}
        timeZone="UTC"
        horizonEnd={null}
        onSelectDate={onSelectDate}
      />,
    )

    const day = screen.getByRole('button', { name: monday })
    expect(day).toHaveTextContent('10 окон')
    expect(day).toHaveAttribute('aria-pressed', 'true')

    await user.click(day)
    expect(onSelectDate).toHaveBeenCalledWith(monday)
  })

  it('выходные без слотов недоступны и подписаны', () => {
    render(
      <TwoWeekGrid
        slots={buildSlots(10)}
        selectedDate={monday}
        timeZone="UTC"
        horizonEnd={null}
        onSelectDate={vi.fn()}
      />,
    )

    const saturdayButton = screen.getByRole('button', { name: saturday })
    expect(saturdayButton).toBeDisabled()
    expect(saturdayButton).toHaveTextContent('выходной')
  })
})
