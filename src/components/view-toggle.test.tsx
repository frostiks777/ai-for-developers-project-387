import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useBookingView } from '@/hooks/use-booking-view'
import { ViewToggle } from './view-toggle'

describe('useBookingView', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('по умолчанию показывает «Дни»', () => {
    const { result } = renderHook(() => useBookingView())
    expect(result.current.view).toBe('days')
  })

  it('сохраняет выбранный вид в localStorage', () => {
    const { result } = renderHook(() => useBookingView())

    act(() => result.current.setView('week'))

    expect(result.current.view).toBe('week')
    expect(window.localStorage.getItem('call-calendar-booking-view')).toBe('week')
  })

  it('читает сохранённый вид при старте', () => {
    window.localStorage.setItem('call-calendar-booking-view', 'week')

    const { result } = renderHook(() => useBookingView())
    expect(result.current.view).toBe('week')
  })
})

describe('ViewToggle', () => {
  it('переключает вид по клику', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<ViewToggle value="days" onChange={onChange} />)

    expect(screen.getByRole('tab', { name: 'Дни' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Неделя' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })
})
