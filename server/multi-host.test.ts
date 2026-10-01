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

describe('Мульти-хост (ADR-0018)', () => {
  it('создаёт хост и отдаёт его в списке', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts',
      payload: { slug: 'anna', name: 'Анна', timezone: 'Europe/Moscow' },
    })

    expect(created.statusCode).toBe(201)
    const host = created.json<HostDto>()
    expect(host).toEqual({
      id: expect.any(String),
      slug: 'anna',
      name: 'Анна',
      timeZone: 'Europe/Moscow',
    })

    const list = (await app.inject({ method: 'GET', url: '/api/v1/hosts' })).json<HostDto[]>()
    expect(list.some((item) => item.slug === 'anna')).toBe(true)
    expect(list.some((item) => item.slug === 'default')).toBe(true)
  })

  it('отклоняет дубликат slug и некорректный пояс', async () => {
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts',
      payload: { slug: 'default', name: 'Дубликат' },
    })
    expect(duplicate.statusCode).toBe(409)

    const badZone = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts',
      payload: { slug: 'bad-zone', name: 'Пояс', timezone: 'Unknown/Zone' },
    })
    expect(badZone.statusCode).toBe(422)
  })

  it('находит хост по UUID так же, как по slug', async () => {
    const hostId = await getDefaultHostId()

    const byId = await app.inject({ method: 'GET', url: `/api/v1/hosts/${hostId}/settings` })
    expect(byId.statusCode).toBe(200)
    expect(byId.json()).toEqual({
      slug: 'default',
      name: 'Организатор',
      timeZone: 'UTC',
      captcha: { provider: 'turnstile', required: false, siteKey: null },
    })
  })

  it('слоты изолированы по хостам', async () => {
    const hostId = await getDefaultHostId()

    const defaultSlots = (
      await app.inject({ method: 'GET', url: `/api/v1/hosts/${hostId}/slots` })
    ).json<{ slots: unknown[] }>()
    expect(defaultSlots.slots.length).toBeGreaterThan(0)

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts',
      payload: { slug: 'empty-host', name: 'Пустой' },
    })
    const emptyHost = created.json<HostDto>()

    const emptySlots = (
      await app.inject({ method: 'GET', url: `/api/v1/hosts/${emptyHost.id}/slots` })
    ).json<{ slots: unknown[] }>()
    expect(emptySlots.slots).toHaveLength(0)
  })

  it('новому хосту сидирует дефолтный тип встречи (кнопка «Забронировать» работает)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts',
      payload: { slug: 'seeded-type', name: 'С типом' },
    })
    const host = created.json<HostDto>()

    const types = (
      await app.inject({ method: 'GET', url: `/api/v1/hosts/${host.id}/event-types` })
    ).json<{ slug: string; title: string; isActive: boolean }[]>()

    expect(types).toHaveLength(1)
    expect(types[0]).toMatchObject({ slug: 'consultation', isActive: true })
  })
})
