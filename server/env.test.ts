// @vitest-environment node
import { normalizeSslMode } from './env'

// Нормализация SSL-режима в строке подключения (ADR-0013, бэклог docs/todo.md).
// Строку формирует Neon/Render, вручную её не правим — приводим к verify-full,
// чтобы не печаталось предупреждение pg-connection-string.

describe('normalizeSslMode', () => {
  it('меняет require на verify-full (то, что отдаёт Neon)', () => {
    expect(
      normalizeSslMode('postgresql://u:p@h/db?sslmode=require&channel_binding=require'),
    ).toBe('postgresql://u:p@h/db?sslmode=verify-full&channel_binding=require')
  })

  it('меняет prefer и verify-ca', () => {
    expect(normalizeSslMode('postgresql://u:p@h/db?sslmode=prefer')).toBe(
      'postgresql://u:p@h/db?sslmode=verify-full',
    )
    expect(normalizeSslMode('postgresql://u:p@h/db?sslmode=verify-ca')).toBe(
      'postgresql://u:p@h/db?sslmode=verify-full',
    )
  })

  it('добавляет режим, если его нет', () => {
    expect(normalizeSslMode('postgresql://u:p@h/db')).toBe(
      'postgresql://u:p@h/db?sslmode=verify-full',
    )
    expect(normalizeSslMode('postgresql://u:p@h/db?application_name=x')).toBe(
      'postgresql://u:p@h/db?application_name=x&sslmode=verify-full',
    )
  })

  it('уже verify-full не трогает', () => {
    expect(normalizeSslMode('postgresql://u:p@h/db?sslmode=verify-full')).toBe(
      'postgresql://u:p@h/db?sslmode=verify-full',
    )
  })

  it('пустую строку оставляет пустой (PGlite в тестах и dev)', () => {
    expect(normalizeSslMode('')).toBe('')
  })

  it('не перекодирует пароль со спецсимволами', () => {
    const url = 'postgresql://user:p%40ss/w%2Frd@host:5432/db?sslmode=require'

    expect(normalizeSslMode(url)).toBe(
      'postgresql://user:p%40ss/w%2Frd@host:5432/db?sslmode=verify-full',
    )
  })

  it('разбирается строкой, которую нельзя пересобрать через URL', () => {
    // Символы, которые new URL() перекодировал бы и сломал бы пароль
    const url = 'postgresql://u:p@ss/word@h/db?sslmode=require'

    expect(normalizeSslMode(url)).toBe('postgresql://u:p@ss/word@h/db?sslmode=verify-full')
  })
})
