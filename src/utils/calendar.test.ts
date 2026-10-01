import type { Booking, TimeSlot } from '@/types/booking'
import { buildIcs, googleCalendarUrl } from './calendar'

const booking: Booking = {
  id: '7',
  name: 'Иван',
  phone: '+79000000000',
  email: 'ivan@example.com',
  comment: 'Обсудить архитектуру',
  createdAt: '2026-09-23T10:00:00.000Z',
}

const slot: TimeSlot = {
  id: 1,
  startAt: '2026-09-24T10:00:00.000Z',
  durationMin: 30,
  isBooked: true,
}

const fixedNow = new Date('2026-09-23T12:00:00.000Z')

describe('buildIcs', () => {
  it('формирует VEVENT с UTC-границами и UID', () => {
    const ics = buildIcs(booking, slot, { now: fixedNow })

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('UID:booking-7@call-calendar')
    expect(ics).toContain('DTSTAMP:20260923T120000Z')
    expect(ics).toContain('DTSTART:20260924T100000Z')
    expect(ics).toContain('DTEND:20260924T103000Z')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('использует CRLF как разделитель строк', () => {
    const ics = buildIcs(booking, slot, { now: fixedNow })

    expect(ics).toContain('\r\n')
    expect(ics.endsWith('\r\n')).toBe(true)
  })

  it('переносит контакты в DESCRIPTION с экранированием переводов строк', () => {
    const ics = buildIcs(booking, slot, { now: fixedNow })

    expect(ics).toContain('Email: ivan@example.com')
    expect(ics).toContain('Комментарий: Обсудить архитектуру')
    // Внутренние переводы строк экранированы как литеральное \n, а не CRLF
    expect(ics).toContain('Иван\\nEmail')
    expect(ics).not.toContain('Иван\r\nEmail')
  })

  it('использует переданное название события в SUMMARY', () => {
    const ics = buildIcs(booking, slot, { now: fixedNow, title: 'Звонок-консультация' })

    expect(ics).toContain('SUMMARY:Звонок-консультация')
  })
})

describe('googleCalendarUrl', () => {
  it('ведёт на шаблон события с UTC-диапазоном', () => {
    const url = googleCalendarUrl(booking, slot)

    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true)

    const params = new URL(url).searchParams
    expect(params.get('action')).toBe('TEMPLATE')
    expect(params.get('dates')).toBe('20260924T100000Z/20260924T103000Z')
    expect(params.get('text')).toBe('Звонок')
    expect(params.get('details')).toContain('ivan@example.com')
  })
})
