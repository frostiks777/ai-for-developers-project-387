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

type EventTypeBody = {
  id: string
  slug: string
  title: string
  description: string | null
  durationMin: number
  locationType: string
  isActive: boolean
}

const validBody = (slug: string) => ({
  slug,
  title: 'Консультация',
  description: 'Короткий созвон',
  durationMin: 30,
  locationType: 'online',
})

describe('GET /api/v1/hosts/:slug/event-types', () => {
  it('отдаёт список типов, включая дефолтный', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/event-types',
    })

    expect(response.statusCode).toBe(200)
    const types = response.json<EventTypeBody[]>()
    expect(types.some((type) => type.slug === 'consultation')).toBe(true)
  })

  it('отвечает 404 на неизвестный slug', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/unknown/event-types',
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /api/v1/hosts/:slug/event-types', () => {
  it('создаёт тип и возвращает 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/event-types',
      payload: validBody('intro-call'),
    })

    expect(response.statusCode).toBe(201)
    const created = response.json<EventTypeBody>()
    expect(created.slug).toBe('intro-call')
    expect(created.durationMin).toBe(30)
    expect(created.isActive).toBe(true)
  })

  it('отклоняет невалидное тело (422)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/event-types',
      payload: { slug: 'Bad Slug', title: '', durationMin: 5, locationType: 'online' },
    })

    expect(response.statusCode).toBe(422)
  })

  it('отвечает 409 на дубликат slug в пределах хоста', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/event-types',
      payload: validBody('duplicate'),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/event-types',
      payload: validBody('duplicate'),
    })

    expect(response.statusCode).toBe(409)
  })
})

describe('PATCH /api/v1/hosts/:slug/event-types/:eventTypeId', () => {
  it('обновляет тип', async () => {
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/event-types',
        payload: validBody('patch-me'),
      })
    ).json<EventTypeBody>()

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/hosts/default/event-types/${created.id}`,
      payload: { title: 'Обновлённый', isActive: false },
    })

    expect(response.statusCode).toBe(200)
    const updated = response.json<EventTypeBody>()
    expect(updated.title).toBe('Обновлённый')
    expect(updated.isActive).toBe(false)
  })

  it('отвечает 404 на неизвестный тип', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/hosts/default/event-types/missing',
      payload: { title: 'Нет такого' },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('DELETE /api/v1/hosts/:slug/event-types/:eventTypeId', () => {
  it('удаляет тип (204) и отвечает 404 повторно', async () => {
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/event-types',
        payload: validBody('delete-me'),
      })
    ).json<EventTypeBody>()

    const first = await app.inject({
      method: 'DELETE',
      url: `/api/v1/hosts/default/event-types/${created.id}`,
    })
    expect(first.statusCode).toBe(204)

    const second = await app.inject({
      method: 'DELETE',
      url: `/api/v1/hosts/default/event-types/${created.id}`,
    })
    expect(second.statusCode).toBe(404)
  })
})
