import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BookingWizard } from './booking-wizard'
import type { EventType } from '@/api/generated'
import type { TimeSlot } from '@/types/booking'

const eventType: EventType = {
  id: 'type-1',
  slug: 'consultation',
  title: 'Консультация',
  description: null,
  durationMin: 30,
  locationType: 'online' as EventType['locationType'],
  isActive: true,
}

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: false },
  { id: 2, startAt: '2026-09-29T15:00:00.000Z', durationMin: 30, isBooked: false },
]

function renderWizard(overrides: Partial<Parameters<typeof BookingWizard>[0]> = {}) {
  return render(
    <BookingWizard
      slots={slots}
      timeZone="UTC"
      onTimeZoneChange={vi.fn()}
      eventTypes={[eventType]}
      selectedTypeId="type-1"
      onSelectType={vi.fn()}
      selectedTypeTitle="Консультация"
      hostSlug="default"
      hostName="Организатор"
      selectedSlot={null}
      onSelectSlot={vi.fn()}
      onBooked={vi.fn()}
      onConflict={vi.fn()}
      {...overrides}
    />,
  )
}

describe('BookingWizard', () => {
  it('шаг 1: показывает «Ближайшее свободное» и список дней', () => {
    renderWizard()

    expect(screen.getByText('ШАГ 1 ИЗ 3 · ДЕНЬ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выбрать это время' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2026-09-28' })).toBeInTheDocument()
  })

  it('по дню переходит ко времени и к контактам', async () => {
    const onSelectSlot = vi.fn()
    const user = userEvent.setup()
    renderWizard({ onSelectSlot })

    await user.click(screen.getByRole('button', { name: '2026-09-28' }))

    expect(screen.getByText('ШАГ 2 ИЗ 3 · ВРЕМЯ')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '10:00' }))
    expect(onSelectSlot).toHaveBeenCalledWith(slots[0])
  })

  it('«Ближайшее свободное» ведёт сразу к контактам', async () => {
    const onSelectSlot = vi.fn()
    const user = userEvent.setup()
    renderWizard({ onSelectSlot })

    await user.click(screen.getByRole('button', { name: 'Выбрать это время' }))

    expect(screen.getByText('ШАГ 3 ИЗ 3 · КОНТАКТЫ')).toBeInTheDocument()
    expect(onSelectSlot).toHaveBeenCalledWith(slots[0])
    expect(screen.getByRole('form', { name: 'Ваши данные' })).toBeInTheDocument()
  })

  it('листает доступные дни через выходные, а не соседние календарные', async () => {
    const gappedSlots: TimeSlot[] = [
      { id: 1, startAt: '2026-10-02T10:00:00.000Z', durationMin: 30, isBooked: false },
      { id: 2, startAt: '2026-10-05T10:00:00.000Z', durationMin: 30, isBooked: false },
    ]
    const user = userEvent.setup()
    renderWizard({ slots: gappedSlots })

    await user.click(screen.getByRole('button', { name: '2026-10-02' }))
    expect(screen.getByText('Пт, 2 октября')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Следующий день' }))
    expect(screen.getByText('Пн, 5 октября')).toBeInTheDocument()
    expect(screen.queryByText('Пт, 2 октября')).toBeNull()
  })

  it('сохраняет введённые данные при смене даты', async () => {
    const twoDates: TimeSlot[] = [
      { id: 1, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: false },
      { id: 2, startAt: '2026-09-29T10:00:00.000Z', durationMin: 30, isBooked: false },
    ]

    function StatefulWizard() {
      const [slot, setSlot] = useState<TimeSlot | null>(null)

      return (
        <BookingWizard
          slots={twoDates}
          timeZone="UTC"
          onTimeZoneChange={vi.fn()}
          eventTypes={[eventType]}
          selectedTypeId="type-1"
          onSelectType={vi.fn()}
          selectedTypeTitle="Консультация"
          hostSlug="default"
          hostName="Организатор"
          selectedSlot={slot}
          onSelectSlot={setSlot}
          onBooked={vi.fn()}
          onConflict={vi.fn()}
        />
      )
    }

    const user = userEvent.setup()
    render(<StatefulWizard />)

    await user.click(screen.getByRole('button', { name: '2026-09-28' }))
    await user.click(screen.getByRole('button', { name: '10:00' }))
    await user.click(screen.getByRole('button', { name: 'Далее' }))

    await user.type(screen.getByLabelText('Имя'), 'Иван')

    await user.click(screen.getByRole('button', { name: 'Время' }))
    await user.click(screen.getByRole('button', { name: 'Следующий день' }))
    await user.click(screen.getByRole('button', { name: '10:00' }))
    await user.click(screen.getByRole('button', { name: 'Далее' }))

    expect(within(screen.getByRole('form', { name: 'Ваши данные' })).getByLabelText('Имя')).toHaveValue(
      'Иван',
    )
  })
})
