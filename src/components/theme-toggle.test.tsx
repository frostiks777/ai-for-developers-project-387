import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeProvider } from './theme-provider'
import { ThemeToggle } from './theme-toggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('переключает тёмную тему и сохраняет выбор', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: 'Включить тёмную тему' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('call-calendar-theme')).toBe('dark')
  })

  it('возвращает светлую тему и сохраняет выбор', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: 'Включить тёмную тему' }))
    await user.click(screen.getByRole('button', { name: 'Включить светлую тему' }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('call-calendar-theme')).toBe('light')
  })

  it('при сохранённой теме поднимает её при загрузке', () => {
    window.localStorage.setItem('call-calendar-theme', 'dark')

    renderToggle()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Включить светлую тему' })).toBeInTheDocument()
  })
})
