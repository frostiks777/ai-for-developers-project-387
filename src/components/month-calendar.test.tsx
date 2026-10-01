import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimeSlot } from '@/types/booking'
import { MonthCalendar } from './month-calendar'

function slotAt(date: Date): TimeSlot {
  return { id: 1, startAt: date.toISOString(), durationMin: 30, isBooked: false }
}

const onSelectDate = vi.fn()

function renderCalendar(selectedDate: string, slots: TimeSlot[]) {
  return render(
    <MonthCalendar
      slots={slots}
      selectedDate={selectedDate}
      timeZone="UTC"
      onSelectDate={onSelectDate}
    />,
  )
}

describe('MonthCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('включает только дни со слотами, прошедшие дни отключены', () => {
    renderCalendar('2099-09-24', [slotAt(new Date(2099, 8, 24, 10, 0))])

    expect(screen.getByRole('button', { name: '2099-09-24' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '2099-09-25' })).toBeDisabled()
  })

  it('отключает все дни прошедшего месяца', () => {
    renderCalendar('2020-06-15', [slotAt(new Date(2020, 5, 20, 10, 0))])

    expect(screen.getByRole('button', { name: '2020-06-20' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2020-06-15' })).toBeDisabled()
  })

  it('вызывает onSelectDate при клике на доступный день', async () => {
    const user = userEvent.setup()
    const slotDate = new Date(2099, 8, 24, 10, 0)
    renderCalendar('2099-09-24', [slotAt(slotDate)])

    await user.click(screen.getByRole('button', { name: '2099-09-24' }))

    expect(onSelectDate).toHaveBeenCalledWith('2099-09-24')
  })

  it('переключает месяц кнопками навигации', async () => {
    const user = userEvent.setup()
    renderCalendar('2099-09-24', [slotAt(new Date(2099, 8, 24, 10, 0))])

    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }))
    expect(screen.getByRole('button', { name: '2099-10-01' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2099-09-01' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Предыдущий месяц' }))
    expect(screen.getByRole('button', { name: '2099-09-01' })).toBeInTheDocument()
  })
})