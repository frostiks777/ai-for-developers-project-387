// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

type Slot = { id: number; startAt: string; durationMin: number; available: boolean }
type TimeBlock = { id: number; startAt: string; endAt: string; reason: string | null }

async function fetchSlots(): Promise<Slot[]> {
  const day = (
    await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
  ).json<{ slots: Slot[] }>()

  return day.slots
}

describe('POST/GET/DELETE /api/v1/hosts/:slug/blocks', () => {
  it('создаёт блокировку и отдаёт её в списке', async () => {
    const slot = (await fetchSlots()).find((item) => item.available)
    expect(slot).toBeDefined()

    const endAt = new Date(new Date(slot!.startAt).getTime() + 30 * 60_000).toISOString()

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/blocks',
      payload: { startAt: slot!.startAt, endAt, reason: 'Обед' },
    })

    expect(created.statusCode).toBe(201)
    const block = created.json<TimeBlock>()
    expect(block.reason).toBe('Обед')

    const list = (
      await app.inject({ method: 'GET', url: '/api/v1/hosts/default/blocks' })
    ).json<TimeBlock[]>()
    expect(list.some((item) => item.id === block.id)).toBe(true)

    await app.inject({
      method: 'DELETE',
      url: `/api/v1/hosts/default/blocks/${block.id}`,
    })
  })

  it('заблокированный слот исчезает из выдачи слотов', async () => {
    const slot = (await fetchSlots()).find((item) => item.available)
    expect(slot).toBeDefined()

    const endAt = new Date(new Date(slot!.startAt).getTime() + 30 * 60_000).toISOString()
    const { id } = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/blocks',
        payload: { startAt: slot!.startAt, endAt },
      })
    ).json<TimeBlock>()

    const after = await fetchSlots()
    expect(after.some((item) => item.startAt === slot!.startAt)).toBe(false)

    await app.inject({ method: 'DELETE', url: `/api/v1/hosts/default/blocks/${id}` })
    const restored = await fetchSlots()
    expect(restored.some((item) => item.startAt === slot!.startAt)).toBe(true)
  })

  it('не даёт забронировать слот внутри блокировки (409)', async () => {
    const slot = (await fetchSlots()).find((item) => item.available)
    expect(slot).toBeDefined()

    const endAt = new Date(new Date(slot!.startAt).getTime() + 30 * 60_000).toISOString()
    const { id } = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/blocks',
        payload: { startAt: slot!.startAt, endAt },
      })
    ).json<TimeBlock>()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: {
        eventTypeId: 'default-consultation',
        startAt: slot!.startAt,
        clientName: 'Иван',
        clientEmail: 'ivan@example.com',
        consentAccepted: true,
      },
    })

    expect(response.statusCode).toBe(409)

    await app.inject({ method: 'DELETE', url: `/api/v1/hosts/default/blocks/${id}` })
  })

  it('отвечает 422, если конец раньше начала', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/blocks',
      payload: { startAt: '2026-10-01T12:00:00.000Z', endAt: '2026-10-01T11:00:00.000Z' },
    })

    expect(response.statusCode).toBe(422)
  })

  it('удаляет блокировку и отвечает 204, 404 на повтор', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/blocks',
      payload: { startAt: '2026-10-02T09:00:00.000Z', endAt: '2026-10-02T10:00:00.000Z' },
    })
    const { id } = created.json<TimeBlock>()

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/v1/hosts/default/blocks/${id}`,
    })
    expect(deleted.statusCode).toBe(204)

    const again = await app.inject({
      method: 'DELETE',
      url: `/api/v1/hosts/default/blocks/${id}`,
    })
    expect(again.statusCode).toBe(404)
  })
})
