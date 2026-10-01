import { render, screen } from '@testing-library/react'

import type { AvailabilitySettings } from '@/types/availability-settings'
import type { TimeSlot } from '@/types/booking'
import { AvailabilityPreview } from './availability-preview'

const settings: AvailabilitySettings = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  minNoticeMin: 0,
  horizonDays: 14,
  ranges: [{ weekday: 1, startMinute: 600, endMinute: 660 }],
}

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: true },
  { id: 2, startAt: '2026-09-28T10:30:00.000Z', durationMin: 30, isBooked: false },
]

describe('AvailabilityPreview', () => {
  it('помечает занятые окна как встречи, свободные — как свободные', () => {
    const { container } = render(<AvailabilityPreview settings={settings} slots={slots} />)

    const meetings = container.querySelectorAll('[data-state="meeting"]')
    expect(meetings).toHaveLength(1)
    expect(container.querySelectorAll('[data-state="free"]')).toHaveLength(1)
  })

  it('без слотов показывает только свободные окна', () => {
    const { container } = render(<AvailabilityPreview settings={settings} />)

    expect(container.querySelectorAll('[data-state="meeting"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-state="free"]')).toHaveLength(2)
  })

  it('показывает сообщение при отсутствии данных', () => {
    render(<AvailabilityPreview settings={{ ...settings, ranges: [] }} />)

    expect(screen.getByText('Нет данных для превью')).toBeInTheDocument()
  })

  // Регрессия: колонки Пн–Пт были захардкожены, и добавленные организатором
  // суббота/воскресенье не появлялись в сетке (#76).
  it('показывает все дни из правил, а не только Пн–Пт', () => {
    render(
      <AvailabilityPreview
        settings={{
          ...settings,
          ranges: [
            { weekday: 1, startMinute: 600, endMinute: 660 },
            { weekday: 6, startMinute: 600, endMinute: 660 },
            { weekday: 7, startMinute: 600, endMinute: 660 },
          ],
        }}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Пн' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Сб' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Вс' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Вт' })).toBeNull()
  })

  it('не показывает дни, которых нет ни в правилах, ни во встречах', () => {
    render(<AvailabilityPreview settings={settings} slots={slots} />)

    expect(screen.getByRole('columnheader', { name: 'Пн' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Пт' })).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Вс' })).toBeNull()
  })
})
