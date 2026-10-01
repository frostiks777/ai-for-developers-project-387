// @vitest-environment node
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'

// Раздача dist/ — единственное место, где работает @fastify/static.
// Проверяем её отдельно: апгрейд плагина (8.3.0 → 10.1.5) ломает именно это,
// а другие серверные тесты статику не задевают. Без сборки (CI до build)
// тесты пропускаются, чтобы файл не падал на отсутствующем dist/.
const distIndex = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html')
const hasBuild = existsSync(distIndex)

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe.skipIf(!hasBuild)('Раздача dist/ через @fastify/static', () => {
  it('отдаёт index.html на корень', async () => {
    const response = await app.inject({ method: 'GET', url: '/' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.body).toContain('<!doctype html')
  })

  it('отдаёт index.html на неизвестный маршрут (SPA fallback)', async () => {
    const response = await app.inject({ method: 'GET', url: '/dashboard' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.body).toContain('<!doctype html')
  })

  it('не отдаёт листинг каталога', async () => {
    const response = await app.inject({ method: 'GET', url: '/assets/' })

    expect(response.body).not.toContain('Index of')
    expect(response.body).not.toContain('parent directory')
  })

  it('не выпускает файлы за пределы dist/', async () => {
    const response = await app.inject({ method: 'GET', url: '/%2e%2e%2fpackage.json' })

    expect(response.body).not.toContain('"name": "call-calendar"')
    expect(response.body).not.toContain('"dependencies"')
  })

  it('не перехватывает API-маршруты статикой', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.json<{ status: string }>().status).toBe('ok')
  })
})
