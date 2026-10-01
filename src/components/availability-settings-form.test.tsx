import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { AvailabilitySettings } from '@/types/availability-settings'
import { AvailabilitySettingsForm } from './availability-settings-form'

const settings: AvailabilitySettings = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
  ranges: [
    { weekday: 1, startMinute: 540, endMinute: 780 },
    { weekday: 1, startMinute: 840, endMinute: 1080 },
  ],
}

describe('AvailabilitySettingsForm', () => {
  it('показывает по кнопке удаления на каждый интервал дня', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    expect(screen.getByLabelText('Убрать интервал: Пн 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Убрать интервал: Пн 2')).toBeInTheDocument()
  })

  it('удаляет выбранный интервал, не трогая остальные', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByLabelText('Убрать интервал: Пн 1'))

    expect(screen.queryByRole('button', { name: /Убрать интервал/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Пн: начало 1')).toHaveValue('14:00')
  })

  it('показывает выбор часового пояса правил', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    expect(screen.getByLabelText('Часовой пояс')).toBeInTheDocument()
    expect(screen.getByText('Часы ниже — в этом поясе. Гости видят их в своём.')).toBeInTheDocument()
  })

  it('переключает день тогглом, убирая и возвращая интервалы', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    const toggle = screen.getByRole('switch', { name: 'Пн: доступность' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByLabelText('Пн: начало 1')).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Пн: начало 1')).toBeInTheDocument()
  })

  it('добавляет интервал иконкой +', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Добавить интервал: Пн' }))

    expect(screen.getByLabelText('Пн: начало 3')).toBeInTheDocument()
  })

  it('применяет пресет ко всем рабочим дням', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Пн–Пт, 09:00–18:00' }))

    expect(screen.getByLabelText('Вт: начало 1')).toHaveValue('09:00')
    expect(screen.getByLabelText('Пт: конец 1')).toHaveValue('18:00')
    expect(screen.queryByRole('switch', { name: 'Сб: доступность' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('копирует интервалы дня на выбранные дни', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Скопировать интервал: Пн' }))
    await user.click(screen.getByLabelText('Вт'))
    await user.click(screen.getByRole('button', { name: 'Скопировать' }))

    expect(screen.getByLabelText('Вт: начало 1')).toHaveValue('09:00')
    expect(screen.getByLabelText('Вт: начало 2')).toHaveValue('14:00')
  })

  it('подсвечивает ошибку хронологии и блокирует сохранение', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Пн: конец 1'), { target: { value: '08:00' } })

    expect(screen.getByText('Время окончания должно быть позже времени начала')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('подсвечивает пересечение интервалов одного дня', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Пн: начало 2'), { target: { value: '12:00' } })

    expect(screen.getAllByText('Интервалы пересекаются')).toHaveLength(2)
  })

  it('применяет пресет горизонта 30 дней', async () => {
    const user = userEvent.setup()
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '30' }))

    expect(screen.getByLabelText('Открыто на, дней')).toHaveValue(30)
  })

  it('показывает занятые слоты в превью', () => {
    const { container } = render(
      <AvailabilitySettingsForm
        settings={{ ...settings, ranges: [{ weekday: 1, startMinute: 600, endMinute: 660 }] }}
        isSaving={false}
        onSave={vi.fn()}
        slots={[{ id: 1, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: true }]}
      />,
    )

    expect(container.querySelectorAll('[data-state="meeting"]')).toHaveLength(1)
  })

  // Регресс #49: строка дня не должна выходить за правый край на 360 px —
  // поля времени ужимаются, кнопки строки крупнее на мобильном.
  it('ужимает поля времени и крупнит кнопки строки дня на узком экране', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    const start = screen.getByLabelText('Пн: начало 1')
    const end = screen.getByLabelText('Пн: конец 1')

    for (const input of [start, end]) {
      expect(input).toHaveClass('min-w-0', 'flex-1')
      expect(input.className).not.toContain('shrink-0')
      // фиксированная ширина только на sm+ (там места хватает)
      expect(input.className).toContain('sm:w-[112px]')
      // группа полей держит минимум, иначе поля «вылезают» под кнопки строки
      expect(input.parentElement).toHaveClass('min-w-[208px]')
    }

    // кнопки строки крупнее на мобильном (touch-цель), компактные на десктопе
    expect(screen.getByLabelText('Добавить интервал: Пн')).toHaveClass('h-9', 'w-9', 'sm:h-7')
    expect(screen.getByLabelText('Скопировать интервал: Пн')).toHaveClass('h-9', 'w-9')
  })
})
