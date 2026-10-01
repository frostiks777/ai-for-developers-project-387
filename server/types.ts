// Типы API-контракта, зеркалятся фронтендом — менять только согласованно

export interface TimeSlot {
  id: number
  startAt: string
  durationMin: number
  isBooked: boolean
}

export interface CreateBookingBody {
  slotId: number
  name: string
  phone?: string
  email: string
  comment?: string
}

export interface Booking {
  id: number
  slotId: number
  name: string
  phone: string | null
  email: string
  comment: string | null
  createdAt: string
}

// Бронь вместе с данными слота — для панели организатора
export interface BookingWithSlot extends Booking {
  startAt: string
  durationMin: number
  status: string
  cancelToken: string | null
  eventTypeId: string
  eventTypeTitle: string | null
}

// Ответ на создание брони: содержит токен для публичной отмены по ссылке
export interface CreatedBooking extends Booking {
  cancelToken: string
}
