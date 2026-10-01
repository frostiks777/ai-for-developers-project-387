// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv, { type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyInstance, HTTPMethods } from 'fastify'
import { parse } from 'yaml'

import { buildApp } from './app'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const openapiPath = path.resolve(currentDir, '..', 'docs', 'openapi', 'openapi.yaml')
const openapi = parse(readFileSync(openapiPath, 'utf8')) as Record<string, unknown>

// OpenAPI 3.0 выражает null через `nullable: true`, который не понимает JSON Schema.
// Конвертируем в `anyOf: [<схема>, { type: 'null' }]` рекурсивно.
function normalizeNullable(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(normalizeNullable)
  }

  if (node !== null && typeof node === 'object') {
    const source = node as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(source)) {
      if (key === 'nullable') {
        continue
      }

      result[key] = normalizeNullable(value)
    }

    return source.nullable === true ? { anyOf: [result, { type: 'null' }] } : result
  }

  return node
}

const document = normalizeNullable(openapi) as Record<string, unknown>
const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(document, 'openapi')

function validator(ref: string, wrap?: Record<string, unknown>): ValidateFunction {
  const base = { $ref: `openapi#/components/schemas/${ref}` }
  return ajv.compile(wrap ? { ...wrap, items: base } : base)
}

const validators = {
  HostSettings: validator('HostSettings'),
  AvailabilityDay: validator('AvailabilityDay'),
  Booking: validator('Booking'),
  EventType: validator('EventType', { type: 'array' }),
  TimeBlock: validator('TimeBlock', { type: 'array' }),
}

function validate(name: keyof typeof validators, data: unknown): boolean {
  const check = validators[name]
  const ok = check(data) as boolean

  if (!ok) {
    console.error(`[contract] ${name} не проходит валидацию:`, check.errors)
  }

  return ok
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

function fastifyPath(openapiPathTemplate: string): string {
  return openapiPathTemplate.replace(/\{([^}]+)\}/g, ':$1')
}

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Контракт: маршруты /api/v1', () => {
  it('все маршруты из OpenAPI зарегистрированы в приложении', () => {
    const paths = document.paths as Record<string, Record<string, unknown>>

    for (const [route, operations] of Object.entries(paths)) {
      for (const method of HTTP_METHODS) {
        if (operations[method]) {
          expect(
            app.hasRoute({ method: method.toUpperCase() as HTTPMethods, url: fastifyPath(route) }),
          ).toBe(true)
        }
      }
    }
  })
})

describe('Контракт: ключевые ответы валидны по OpenAPI', () => {
  it('настройки хоста соответствуют HostSettings', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/settings' })

    expect(response.statusCode).toBe(200)
    expect(validate('HostSettings', response.json())).toBe(true)
  })

  it('список типов встреч соответствует EventType[]', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/event-types',
    })

    expect(response.statusCode).toBe(200)
    expect(validate('EventType', response.json())).toBe(true)
  })

  it('список блокировок соответствует TimeBlock[]', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/blocks',
    })

    expect(response.statusCode).toBe(200)
    expect(validate('TimeBlock', response.json())).toBe(true)
  })

  it('слоты и бронь соответствуют AvailabilityDay и Booking', async () => {
    const slotsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots',
    })

    expect(slotsResponse.statusCode).toBe(200)
    const day = slotsResponse.json<{
      slots: { startAt: string; available: boolean }[]
    }>()
    expect(validate('AvailabilityDay', day)).toBe(true)

    const typesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/event-types',
    })
    const eventTypeId = typesResponse.json<{ id: string }[]>()[0].id

    const freeSlot = day.slots.find((slot) => slot.available)
    expect(freeSlot).toBeDefined()

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: {
        eventTypeId,
        startAt: freeSlot?.startAt,
        clientName: 'Контрактный тест',
        clientEmail: 'contract@example.com',
        consentAccepted: true,
      },
    })

    expect(createResponse.statusCode).toBe(201)
    const booking = createResponse.json<{ id: string }>()
    expect(validate('Booking', booking)).toBe(true)

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/bookings/${booking.id}`,
    })

    expect(getResponse.statusCode).toBe(200)
    expect(validate('Booking', getResponse.json())).toBe(true)
  })
})
