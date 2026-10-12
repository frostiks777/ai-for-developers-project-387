import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Только используемые подмножества (latin + cyrillic): полный 400.css тянет
// ещё latin-ext, cyrillic-ext, math, vietnamese (~80 КиБ woff2, которых браузер
// не запрашивает). Lora 500 не используется — serif-текст идёт через 600.
// Критические файлы preload-ятся в index.html: стабильные имена им задаёт
// assetFileNames в vite.config.ts, проверка — src/fonts-preload.test.ts.
import '@fontsource/golos-text/latin-400.css'
import '@fontsource/golos-text/cyrillic-400.css'
import '@fontsource/golos-text/latin-500.css'
import '@fontsource/golos-text/cyrillic-500.css'
import '@fontsource/golos-text/latin-600.css'
import '@fontsource/golos-text/cyrillic-600.css'
import '@fontsource/golos-text/latin-700.css'
import '@fontsource/golos-text/cyrillic-700.css'
import '@fontsource/lora/latin-600.css'
import '@fontsource/lora/cyrillic-600.css'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)
