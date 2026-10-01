// @vitest-environment node
import {
  bookingCancelledEmail,
  bookingConfirmedEmail,
  bookingReminderEmail,
  bookingRescheduledEmail,
  formatWhen,
  organizerCancelledEmail,
  organizerNewBookingEmail,
} from './email-templates'

const data = {
  origin: 'https://app.example.com',
  eventTypeTitle: 'Консультация',
  hostName: 'Иван',
  timeZone: 'UTC',
  clientName: 'Гость',
  clientEmail: 'guest@example.com',
  startAt: '2026-10-05T10:00:00.000Z',
  endAt: '2026-10-05T10:30:00.000Z',
  bookingId: 'booking-1',
  guests: ['a@example.com'],
}

const manageUrl = 'https://app.example.com/booking/booking-1/reschedule'

describe('formatWhen', () => {
  it('форматирует дату и время в поясе встречи', () => {
    expect(formatWhen(data)).toBe('понедельник, 5 октября 2026 г., 10:00–10:30 (UTC)')
  })
})

describe('письма гостю', () => {
  it('подтверждение содержит получателя, встречу и ссылку управления', () => {
    const email = bookingConfirmedEmail(data)

    expect(email.to).toBe('guest@example.com')
    expect(email.subject).toContain('Консультация')
    expect(email.text).toContain(manageUrl)
    expect(email.text).toContain('a@example.com')
    expect(email.html).toContain(`href="${manageUrl}"`)
  })

  it('перенос сообщает о новом времени', () => {
    expect(bookingRescheduledEmail(data).subject).toContain('перенесена')
  })

  it('отмена включает причину', () => {
    const email = bookingCancelledEmail(data, 'не смогу')

    expect(email.subject).toContain('отменена')
    expect(email.text).toContain('Причина: не смогу')
  })

  it('напоминание помечено как напоминание', () => {
    expect(bookingReminderEmail(data).subject).toContain('Напоминание')
  })

  it('экранирует HTML в пользовательских данных', () => {
    const email = bookingConfirmedEmail({ ...data, clientName: '<script>alert(1)</script>' })

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('письма организатору', () => {
  it('новая бронь уходит организатору и содержит гостя', () => {
    const email = organizerNewBookingEmail(data, 'org@example.com')

    expect(email.to).toBe('org@example.com')
    expect(email.subject).toContain('Новая бронь')
    expect(email.text).toContain('Гость <guest@example.com>')
  })

  it('отмена уходит организатору с причиной', () => {
    const email = organizerCancelledEmail(data, 'org@example.com', 'передумал')

    expect(email.to).toBe('org@example.com')
    expect(email.text).toContain('Причина: передумал')
  })
})
