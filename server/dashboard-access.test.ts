// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { env } from './env'

let app: FastifyInstance

// Спека курса: авторизация в проекте не нужна, владелец один и заранее задан.
// Панель организатора и административные API доступны без логина (ADR-0028).
// ADMIN_PASSWORD удалён из схемы env: оставшаяся в окружении переменная
// игнорируется, поэтому проверка доступа не зависит от неё.
beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Панель организатора доступна без логина', () => {
  it('не содержит ADMIN_PASSWORD в схеме окружения', () => {
    expect('ADMIN_PASSWORD' in env).toBe(false)
  })

  it('отдаёт /dashboard и /admin/* без заголовка Authorization', async () => {
    for (const url of ['/dashboard', '/admin', '/admin/availability', '/admin/event-types']) {
      const response = await app.inject({ method: 'GET', url })

      expect(response.statusCode, url).not.toBe(401)
      expect(response.headers['www-authenticate'], url).toBeUndefined()
    }
  })

  it('открывает список встреч организатора без логина', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/bookings' })

    expect(response.statusCode).toBe(200)
  })

  it('пускает управление типами событий и блокировками без логина', async () => {
    const requests = [
      { method: 'POST' as const, url: '/api/v1/hosts/default/event-types', payload: {} },
      { method: 'PATCH' as const, url: '/api/v1/hosts/default/event-types/x', payload: {} },
      { method: 'DELETE' as const, url: '/api/v1/hosts/default/event-types/x' },
      { method: 'GET' as const, url: '/api/v1/hosts/default/blocks' },
      { method: 'POST' as const, url: '/api/v1/hosts/default/blocks', payload: {} },
      { method: 'DELETE' as const, url: '/api/v1/hosts/default/blocks/1' },
      { method: 'PUT' as const, url: '/api/v1/hosts/default/availability', payload: {} },
      { method: 'POST' as const, url: '/api/v1/hosts', payload: {} },
    ]

    for (const request of requests) {
      const response = await app.inject(request)
      expect(response.statusCode, `${request.method} ${request.url}`).not.toBe(401)
    }
  })

  it('легаси-маршруты организатора открыты без логина', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/bookings' })).statusCode).not.toBe(401)
    expect((await app.inject({ method: 'PUT', url: '/api/availability', payload: {} })).statusCode)
      .not.toBe(401)
  })

  it('не ломает публичные маршруты гостя', async () => {
    expect((await app.inject({ method: 'GET', url: '/' })).statusCode).not.toBe(401)
    expect((await app.inject({ method: 'GET', url: '/api/slots' })).statusCode).toBe(200)
    expect((await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })).statusCode)
      .toBe(200)
  })

  it('перенаправляет /events в панель', async () => {
    const response = await app.inject({ method: 'GET', url: '/events' })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/admin/bookings')
  })
})
