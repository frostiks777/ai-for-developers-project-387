import type { Booking as ApiBooking, Slot as ApiSlot } from '@/api/generated'

import type { BookingWithSlot, CreatedBooking, TimeSlot } from '@/types/booking'

export function toTimeSlot(slot: ApiSlot): TimeSlot {
  return {
    id: slot.id,
    startAt: slot.startAt,
    durationMin: slot.durationMin,
    isBooked: !slot.available,
  }
}

function durationMinutes(startAt: string, endAt: string): number {
  return Math.max(1, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000))
}

export function toBookingWithSlot(
  booking: ApiBooking,
  eventTypeTitle: string | null = null,
): BookingWithSlot {
  return {
    id: booking.id,
    name: booking.clientName,
    phone: booking.clientPhone ?? null,
    email: booking.clientEmail,
    comment: booking.clientNotes ?? null,
    createdAt: booking.createdAt,
    startAt: booking.startAt,
    durationMin: durationMinutes(booking.startAt, booking.endAt),
    status: booking.status,
    eventTypeId: booking.eventTypeId,
    eventTypeTitle,
  }
}

export function toCreatedBooking(booking: ApiBooking): CreatedBooking {
  return {
    id: booking.id,
    name: booking.clientName,
    phone: booking.clientPhone ?? null,
    email: booking.clientEmail,
    comment: booking.clientNotes ?? null,
    createdAt: booking.createdAt,
    cancelToken: booking.id,
  }
}
