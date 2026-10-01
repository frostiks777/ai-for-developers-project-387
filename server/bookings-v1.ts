import { randomUUID } from 'node:crypto'
import { and, eq, ne } from 'drizzle-orm'

import { db } from './db'
import { bookings, slots } from './db/schema'

export type BookingRow = typeof bookings.$inferSelect
export type SlotRow = typeof slots.$inferSelect

export type CreateBookingInput = {
  eventTypeId: string
  startAt: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientNotes?: string
  guests?: string[]
  consentAccepted?: boolean
  idempotencyKey?: string
}

export async function findSlotByStartAt(
  hostId: string,
  startAt: string,
): Promise<SlotRow | undefined> {
  const rows = await db
    .select()
    .from(slots)
    .where(and(eq(slots.hostId, hostId), eq(slots.startAt, startAt)))
    .limit(1)

  return rows[0]
}

export async function findBookingByIdempotencyKey(
  idempotencyKey: string,
): Promise<BookingRow | undefined> {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.idempotencyKey, idempotencyKey))
    .limit(1)

  return rows[0]
}

export async function findActiveBookingForSlot(slotId: number): Promise<BookingRow | undefined> {
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.slotId, slotId), eq(bookings.status, 'confirmed')))
    .limit(1)

  return rows[0]
}

export async function findBookingByPublicId(id: string): Promise<BookingRow | undefined> {
  const rows = await db.select().from(bookings).where(eq(bookings.cancelToken, id)).limit(1)

  return rows[0]
}

export async function createBookingV1(
  hostId: string,
  input: CreateBookingInput,
  slot: SlotRow,
  durationMin: number,
): Promise<BookingRow> {
  const startAt = slot.startAt
  const endAt = new Date(new Date(startAt).getTime() + durationMin * 60_000).toISOString()

  const rows = await db
    .insert(bookings)
    .values({
      hostId,
      slotId: slot.id,
      eventTypeId: input.eventTypeId,
      name: input.clientName,
      email: input.clientEmail,
      phone: input.clientPhone ?? null,
      comment: input.clientNotes ?? null,
      guests: input.guests ? JSON.stringify(input.guests) : null,
      consentAccepted: input.consentAccepted ?? false,
      idempotencyKey: input.idempotencyKey ?? null,
      status: 'confirmed',
      startAt,
      endAt,
      cancelToken: randomUUID(),
    })
    .returning()

  return rows[0]
}

export async function cancelBookingV1(booking: BookingRow, reason?: string): Promise<BookingRow> {
  const rows = await db
    .update(bookings)
    .set({ status: 'cancelled', cancellationReason: reason ?? null })
    .where(eq(bookings.id, booking.id))
    .returning()

  return rows[0]
}

export async function rescheduleBookingV1(
  booking: BookingRow,
  slot: SlotRow,
  durationMin: number,
): Promise<BookingRow> {
  const endAt = new Date(new Date(slot.startAt).getTime() + durationMin * 60_000).toISOString()

  const rows = await db
    .update(bookings)
    .set({ slotId: slot.id, startAt: slot.startAt, endAt, status: 'confirmed' })
    .where(eq(bookings.id, booking.id))
    .returning()

  return rows[0]
}

// Активная бронь на слоте, кроме указанной (для переноса)
export async function findOtherActiveBooking(
  slotId: number,
  exceptBookingId: number,
): Promise<BookingRow | undefined> {
  const rows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, slotId),
        eq(bookings.status, 'confirmed'),
        ne(bookings.id, exceptBookingId),
      ),
    )
    .limit(1)

  return rows[0]
}
