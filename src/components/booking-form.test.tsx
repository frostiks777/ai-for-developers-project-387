import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { BookingForm } from './booking-form'
import type { TimeSlot } from '@/types/booking'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const slot: TimeSlot = {
  id: 1,
  startAt: '2026-09-22T07:00:00.000Z',
  durationMin: 30,
  isBooked: false,
}

const onBooked = vi.fn()
const onConflict = vi.fn()
const onSelectSuggestion = vi.fn()

const suggestions: TimeSlot[] = [
  { id: 2, startAt: '2026-09-22T08:00:00.000Z', durationMin: 30, isBooked: false },
]

function renderForm(eventTypeId: string | null = 'type-1', withSuggestions = false) {
  return render(
    <BookingForm
      slot={slot}
      hostSlug="default"
      eventTypeId={eventTypeId}
      eventTypeTitle="Консультация"
      timeZone="UTC"
      variant="column"
      suggestions={withSuggestions ? suggestions : []}
      onSelectSuggestion={onSelectSuggestion}
      onBooked={onBooked}
      onConflict={onConflict}
    />,
  )
}

const v1BookingResponse = (overrides: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      id: 'booking-token',
      hostSlug: 'default',
      eventTypeId: 'type-1',
      startAt: slot.startAt,
      endAt: slot.startAt,
      status: 'confirmed',
      clientName: 'Иван',
      clientEmail: 'ivan@example.com',
      clientPhone: '+79000000000',
      clientNotes: null,
      createdAt: '2026-09-22T07:00:00.000Z',
      ...overrides,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  )

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Имя'), 'Иван')
  await user.click(screen.getByRole('button', { name: /Телефон, комментарий, гости/ }))
  await user.type(screen.getByLabelText('Телефон'), '+79000000000')
  await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
  await user.click(screen.getByLabelText('Согласие на обработку персональных данных'))
}

describe('BookingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })
  it('показывает форму «Ваши данные» и блокирует отправку до заполнения', () => {
    renderForm()

    expect(screen.getByRole('form', { name: 'Ваши данные' })).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()
  })

  it('включает кнопку отправки только после заполнения всех полей', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()

    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()

    await user.click(screen.getByLabelText('Согласие на обработку персональных данных'))
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeEnabled()
  })

  it('не даёт отправить форму без согласия на обработку данных', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')

    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()
  })

  it('показывает ошибку, если в email нет знака @', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')

    expect(screen.getByText('Проверьте email: в нём должен быть знак @')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()
  })

  it('показывает ошибку, если в email нет домена', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example')

    expect(
      screen.getByText('Похоже, адрес не полный: не хватает домена, например .ru'),
    ).toBeInTheDocument()
  })

  it('не даёт отправить форму с невалидным телефоном', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.click(screen.getByRole('button', { name: /Телефон, комментарий, гости/ }))
    await user.type(screen.getByLabelText('Телефон'), '12345')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')

    expect(screen.getByText('Неверный номер телефона')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()
  })

  it('не даёт отправить форму с именем короче 2 символов', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'И')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')

    expect(screen.getByText('Имя от 2 символов')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()
  })

  it('форматирует телефон по маске при вводе', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /Телефон, комментарий, гости/ }))
    await user.type(screen.getByLabelText('Телефон'), '79000000000')

    expect(screen.getByLabelText('Телефон')).toHaveValue('+7 (900) 000-00-00')
  })

  it('бронирует слот без телефона (поле необязательное)', async () => {
    const fetchMock = vi.fn(async () => v1BookingResponse({ clientPhone: null }))
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.click(screen.getByLabelText('Согласие на обработку персональных данных'))
    await user.click(screen.getByRole('button', { name: /^Записаться на/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/hosts/default/bookings'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(onBooked).toHaveBeenCalledTimes(1)
  })

  it('бронирует слот и показывает уведомление', async () => {
    const fetchMock = vi.fn(async () => v1BookingResponse())
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^Записаться на/ }))

    expect(toast.success).toHaveBeenCalledWith('Звонок забронирован')
    expect(onBooked).toHaveBeenCalledTimes(1)
  })

  it('отправляет комментарий, если он заполнен', async () => {
    const fetchMock = vi.fn(async () => v1BookingResponse({ clientNotes: 'Хочу обсудить проект' }))
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.type(screen.getByLabelText('Комментарий'), 'Хочу обсудить проект')
    await user.click(screen.getByRole('button', { name: /^Записаться на/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/hosts/default/bookings'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"clientNotes":"Хочу обсудить проект"'),
      }),
    )
  })

  it('при 409 сохраняет поля, не показывает тост и зовёт onConflict', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { code: 'SLOT_TAKEN', message: 'Слот только что заняли' } }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^Записаться на/ }))

    expect(toast.error).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Это время только что заняли')
    expect(screen.getByLabelText('Имя')).toHaveValue('Иван')
    expect(screen.getByLabelText('Email')).toHaveValue('ivan@example.com')
    expect(onConflict).toHaveBeenCalledWith(slot)
    expect(onBooked).not.toHaveBeenCalled()
  })

  it('при 409 показывает ближайшие окна и выбирает их по клику', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { code: 'SLOT_TAKEN', message: 'Слот только что заняли' } }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderForm('type-1', true)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^Записаться на/ }))

    await user.click(await screen.findByRole('button', { name: '08:00' }))
    expect(onSelectSuggestion).toHaveBeenCalledWith(suggestions[0])
  })

  it('добавляет гостя по Enter и отправляет его в теле запроса', async () => {
    const fetchMock = vi.fn(async () => v1BookingResponse())
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.type(screen.getByLabelText('Гости'), 'guest@example.com{Enter}')
    await user.click(screen.getByRole('button', { name: /^Записаться на/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/hosts/default/bookings'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"guests":["guest@example.com"]'),
      }),
    )
  })

  it('блокирует отправку и показывает сообщение без типа встречи', async () => {
    const user = userEvent.setup()
    renderForm(null)

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.click(screen.getByLabelText('Согласие на обработку персональных данных'))

    expect(screen.getByRole('alert')).toHaveTextContent('не настроены типы встреч')
    expect(screen.getByRole('button', { name: /^Записаться на/ })).toBeDisabled()
  })

  it('обновляет счётчик комментария при вводе', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /Телефон, комментарий, гости/ }))
    await user.type(screen.getByLabelText('Комментарий'), 'abc')

    expect(screen.getByText('3 / 500')).toBeInTheDocument()
  })
})
