// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { getDefaultHostId } from './test-helpers'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

type HostDto = { id: string; slug: string; name: string; timeZone: string }

type Settings = {
  timeZone: string
  slotDurationMin: number
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  horizonDays: number
  ranges: { weekday: number; startMinute: number; endMinute: number }[]
}

const buildSettings = (overrides: Partial<Settings> = {}): Settings => ({
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  minNoticeMin: 0,
  horizonDays: 14,
  ranges: [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    startMinute: 0,
    endMinute: 1439,
  })),
  ...overrides,
})

async function createHost(slug: string): Promise<HostDto> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/hosts',
    payload: { slug, name: slug },
  })

  expect(response.statusCode).toBe(201)

  return response.json<HostDto>()
}

async function putSettings(slug: string, settings: Settings): Promise<void> {
  const response = await app.inject({
    method: 'PUT',
    url: `/api/v1/hosts/${slug}/availability`,
    payload: settings,
  })

  expect(response.statusCode).toBe(200)
}

async function getSettings(slug: string): Promise<Settings> {
  const response = await app.inject({
    method: 'GET',
    url: `/api/v1/hosts/${slug}/availability`,
  })

  expect(response.statusCode).toBe(200)

  return response.json<Settings>()
}

async function getSlotStarts(slug: string): Promise<string[]> {
  const response = await app.inject({
    method: 'GET',
    url: `/api/v1/hosts/${slug}/slots`,
  })

  expect(response.statusCode).toBe(200)

  return response.json<{ slots: { startAt: string }[] }>().slots.map((slot) => slot.startAt)
}

describe('Per-host скаляры расписания (ADR-0018)', () => {
  it('сидирует дефолтные правила при создании хоста', async () => {
    await createHost('seed-rules')

    const settings = await getSettings('seed-rules')
    expect(settings.minNoticeMin).toBe(120)
    expect(settings.horizonDays).toBe(14)
    expect(settings.ranges).toHaveLength(5)
  })

  it('изолирует горизонт и minNotice по хостам', async () => {
    await createHost('iso-a')
    await createHost('iso-b')

    await putSettings('iso-a', buildSettings({ horizonDays: 14, minNoticeMin: 0 }))
    await putSettings('iso-b', buildSettings({ horizonDays: 7, minNoticeMin: 0 }))

    const settingsA = await getSettings('iso-a')
    const settingsB = await getSettings('iso-b')
    expect(settingsA.horizonDays).toBe(14)
    expect(settingsB.horizonDays).toBe(7)

    const slotsA = await getSlotStarts('iso-a')
    const slotsB = await getSlotStarts('iso-b')
    expect(slotsB.length).toBeGreaterThan(0)
    expect(slotsA.length).toBeGreaterThan(slotsB.length)
  })

  it('изменение правил одного хоста не трогает слоты другого', async () => {
    await createHost('iso-keep')
    await createHost('iso-change')

    await putSettings('iso-keep', buildSettings({ horizonDays: 14 }))
    await putSettings('iso-change', buildSettings({ horizonDays: 14 }))

    const before = await getSlotStarts('iso-keep')

    await putSettings('iso-change', buildSettings({ horizonDays: 7 }))

    const after = await getSlotStarts('iso-keep')
    expect(after).toEqual(before)
  })

  it('легаси /api/availability работает с правилами дефолтного хоста', async () => {
    const payload = {
      weekdays: [1, 2, 3, 4, 5],
      windowStartHour: 10,
      windowEndHour: 18,
      slotDurationMin: 30,
      bufferBeforeMin: 0,
      bufferAfterMin: 0,
      minNoticeMin: 0,
      horizonDays: 10,
    }

    const put = await app.inject({ method: 'PUT', url: '/api/availability', payload })
    expect(put.statusCode).toBe(200)

    const get = await app.inject({ method: 'GET', url: '/api/availability' })
    expect(get.json<{ horizonDays: number }>().horizonDays).toBe(10)

    const hostId = await getDefaultHostId()
    const scoped = await app.inject({
      method: 'GET',
      url: `/api/v1/hosts/${hostId}/availability`,
    })
    expect(scoped.json<Settings>().horizonDays).toBe(10)
  })
})
