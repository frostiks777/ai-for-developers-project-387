// UI-модели, собираемые из контрактных моделей сгенерированного SDK.

export interface TimeSlot {
  id: number
  startAt: string // ISO 8601
  durationMin: number
  isBooked: boolean
}

// Данные гостя для экрана успеха и экспорта в календарь
export interface Booking {
  id: string
  name: string
  phone: string | null
  email: string
  comment: string | null
  createdAt: string
}

// Ответ на создание брони: содержит публичный id для ссылок отмены/переноса
export interface CreatedBooking extends Booking {
  cancelToken: string
}

// Бронь вместе с данными слота для панели организатора
export interface BookingWithSlot {
  id: string
  name: string
  phone: string | null
  email: string
  comment: string | null
  createdAt: string
  startAt: string
  durationMin: number
  status: string
  eventTypeId: string
  eventTypeTitle: string | null
}
