import '@testing-library/jest-dom/vitest'

// jsdom-полифилы нужны только в браузерном окружении; в node (тесты API) — пропускаем
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }

  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }

  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom не реализует matchMedia: по умолчанию десктопная раскладка (>= 1024px)
if (typeof window !== 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom может не предоставлять localStorage — подкладываем in-memory заглушку
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>()

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value))
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
      },
    },
  })
}

// jsdom не реализует matchMedia: по умолчанию десктопная раскладка (≥ 1024px),
// остальные запросы — false. Тесты мобильной раскладки подменяют её локально.
if (typeof window !== 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: query === '(min-width: 1024px)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
