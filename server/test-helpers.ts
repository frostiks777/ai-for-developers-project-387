import { db } from './db'
import { hosts } from './db/schema'

// Id дефолтного хоста для тестовых вставок slots/bookings (ADR-0018)
export async function getDefaultHostId(): Promise<string> {
  const rows = await db.select({ id: hosts.id }).from(hosts).limit(1)

  return rows[0].id
}
