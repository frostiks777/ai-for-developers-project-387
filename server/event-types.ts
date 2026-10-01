import { randomUUID } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { db } from './db'
import { eventTypes } from './db/schema'

export type EventType = typeof eventTypes.$inferSelect

export type CreateEventTypeInput = {
  slug: string
  title: string
  description?: string
  durationMin: number
  locationType: string
  isActive?: boolean
}

export type UpdateEventTypeInput = {
  title?: string
  description?: string | null
  durationMin?: number
  locationType?: string
  isActive?: boolean
}

export async function listEventTypes(hostId: string): Promise<EventType[]> {
  return db.select().from(eventTypes).where(eq(eventTypes.hostId, hostId)).orderBy(asc(eventTypes.slug))
}

export async function findEventType(hostId: string, id: string): Promise<EventType | undefined> {
  const rows = await db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.hostId, hostId), eq(eventTypes.id, id)))
    .limit(1)

  return rows[0]
}

export async function findEventTypeById(id: string): Promise<EventType | undefined> {
  const rows = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1)

  return rows[0]
}

export async function createEventType(
  hostId: string,
  input: CreateEventTypeInput,
): Promise<EventType> {
  const rows = await db
    .insert(eventTypes)
    .values({
      id: randomUUID(),
      hostId,
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      durationMin: input.durationMin,
      locationType: input.locationType,
      isActive: input.isActive ?? true,
    })
    .returning()

  return rows[0]
}

export async function updateEventType(
  hostId: string,
  id: string,
  patch: UpdateEventTypeInput,
): Promise<EventType | undefined> {
  if (!(await findEventType(hostId, id))) {
    return undefined
  }

  const rows = await db
    .update(eventTypes)
    .set(patch)
    .where(and(eq(eventTypes.hostId, hostId), eq(eventTypes.id, id)))
    .returning()

  return rows[0]
}

export async function deleteEventType(hostId: string, id: string): Promise<boolean> {
  const deleted = await db
    .delete(eventTypes)
    .where(and(eq(eventTypes.hostId, hostId), eq(eventTypes.id, id)))
    .returning()

  return deleted.length > 0
}
