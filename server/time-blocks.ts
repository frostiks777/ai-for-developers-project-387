import { and, eq } from 'drizzle-orm'

import { db } from './db'
import { timeBlocks } from './db/schema'

export type TimeBlock = typeof timeBlocks.$inferSelect

export interface TimeInterval {
  startAt: string
  endAt: string
}

/** Возвращает true, если интервал [startA, endA) пересекается с [startB, endB). */
export function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt
}

/** Возвращает true, если слот [startAt, endAt) попадает в одну из блокировок. */
export function isBlocked(slot: TimeInterval, blocks: TimeInterval[]): boolean {
  return blocks.some((block) => overlaps(slot, block))
}

export async function listTimeBlocks(hostId: string): Promise<TimeBlock[]> {
  return db.select().from(timeBlocks).where(eq(timeBlocks.hostId, hostId)).orderBy(timeBlocks.startAt)
}

/** Список блокировок хоста как простые интервалы — для фильтрации слотов. */
export async function listBlockIntervals(hostId: string): Promise<TimeInterval[]> {
  const rows = await listTimeBlocks(hostId)

  return rows.map((row) => ({ startAt: row.startAt, endAt: row.endAt }))
}

export async function createTimeBlock(
  hostId: string,
  input: TimeInterval & { reason?: string },
): Promise<TimeBlock> {
  const rows = await db
    .insert(timeBlocks)
    .values({
      hostId,
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason ?? null,
    })
    .returning()

  return rows[0]
}

export async function deleteTimeBlock(hostId: string, id: number): Promise<boolean> {
  const deleted = await db
    .delete(timeBlocks)
    .where(and(eq(timeBlocks.hostId, hostId), eq(timeBlocks.id, id)))
    .returning({ id: timeBlocks.id })

  return deleted.length > 0
}
