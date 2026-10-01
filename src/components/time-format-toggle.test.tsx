import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TimeFormatProvider } from './time-format-provider'
import { TimeFormatToggle } from './time-format-toggle'

function renderToggle() {
  return render(
    <TimeFormatProvider>
      <TimeFormatToggle />
    </TimeFormatProvider>,
  )
}

describe('TimeFormatToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('по умолчанию активен 24-часовой формат', () => {
    renderToggle()

    expect(screen.getByRole('button', { name: '24 ч' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '12 ч' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('переключает формат и сохраняет выбор', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: '12 ч' }))

    expect(screen.getByRole('button', { name: '12 ч' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('call-calendar-hour12')).toBe('true')
  })
})
