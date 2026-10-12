import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

// Preload-ссылки на шрифты в index.html пишутся вручную: имена файлов
// хэшируются при сборке, поэтому стабильный путь задаёт assetFileNames
// в vite.config.ts. Тест гарантирует, что каждая ссылка соответствует
// реальному файлу в @fontsource — иначе preload молча 404-ится в проде.
const LINK_TAG = /<link\b[^>]*>/g
const ATTR = (name: string) => new RegExp(`${name}="([^"]+)"`)
const FONT_PACKAGES = ['golos-text', 'lora']

const root = process.cwd()

function findPackageFile(fileName: string): string | null {
  for (const pkg of FONT_PACKAGES) {
    const path = join(root, 'node_modules', '@fontsource', pkg, 'files', fileName)
    if (existsSync(path)) return path
  }
  return null
}

describe('index.html: preload шрифтов', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  const fontLinks = (html.match(LINK_TAG) ?? []).filter(
    (tag) => tag.includes('rel="preload"') && tag.includes('as="font"'),
  )
  const preloads = fontLinks.map((tag) => ATTR('href').exec(tag)?.[1] ?? '')

  it('содержит хотя бы одну preload-ссылку на шрифт', () => {
    expect(fontLinks.length).toBeGreaterThan(0)
  })

  it.each(preloads)('%s существует в @fontsource', (href) => {
    const fileName = href.replace('/assets/fonts/', '')
    expect(fileName).toMatch(/\.woff2$/)
    expect(findPackageFile(fileName)).not.toBeNull()
  })

  it('каждый preload имеет crossorigin и type (шрифты грузятся в CORS-режиме)', () => {
    for (const tag of fontLinks) {
      expect(tag).toContain('crossorigin')
      expect(tag).toContain('type="font/woff2"')
    }
  })
})