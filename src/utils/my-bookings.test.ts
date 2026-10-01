import type { SavedBooking } from './my-bookings'
import { listMyBookings, removeMyBooking, saveMyBooking } from './my-bookings'

const booking: SavedBooking = {
  id: 'token-1',
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
  eventTypeTitle: 'Консультация',
  hostSlug: 'default',
}

describe('my-bookings storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('сохраняет и читает бронь', () => {
    saveMyBooking(booking)

    expect(listMyBookings()).toEqual([booking])
  })

  it('не дублирует бронь по id и ставит свежие вперёд', () => {
    saveMyBooking(booking)
    saveMyBooking({ ...booking, id: 'token-2' })
    saveMyBooking({ ...booking, durationMin: 60 })

    const items = listMyBookings()
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ ...booking, durationMin: 60 })
  })

  it('удаляет бронь по id', () => {
    saveMyBooking(booking)
    saveMyBooking({ ...booking, id: 'token-2' })

    removeMyBooking('token-1')

    expect(listMyBookings().map((item) => item.id)).toEqual(['token-2'])
  })

  it('возвращает пустой список на битом JSON', () => {
    window.localStorage.setItem('call-calendar-my-bookings', '{not json')

    expect(listMyBookings()).toEqual([])
  })
})
