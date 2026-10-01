import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

// Поднимаем API первым и ждём /health, иначе Vite стартует раньше и первые
// запросы браузера падают с http proxy error: ECONNREFUSED 127.0.0.1:3000.
const API_PORT = 3000
const WEB_PORT = 5173
const API_HEALTH = `http://127.0.0.1:${API_PORT}/health`
const API_WAIT_MS = 30_000

const reset = '\x1b[0m'
const children = []

// Порт занят другим процессом → слушаем его и получаем EADDRINUSE.
function isPortBusy(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => server.close(() => resolve(false)))
    server.listen({ port, host: '0.0.0.0' })
  })
}

const ports = [
  { name: 'API', port: API_PORT },
  { name: 'Vite', port: WEB_PORT },
]
const busy = []

for (const { name, port } of ports) {
  if (await isPortBusy(port)) {
    busy.push(`${name} :${port}`)
  }
}

if (busy.length > 0) {
  console.log(`Порты заняты: ${busy.join(', ')}.`)
  console.log('Освободи их и запусти снова. Как найти процесс:')
  console.log(`  Windows:      netstat -ano | findstr :${API_PORT}   →   taskkill /PID <pid> /F`)
  console.log(`  Linux/macOS:  lsof -i :${API_PORT}`)
  process.exit(1)
}

function log(name, color, data) {
  for (const line of String(data).split(/\r?\n/)) {
    if (line.trim() === '') continue
    process.stdout.write(`${color}[${name}]${reset} ${line}\n`)
  }
}

function start({ name, cmd, color }) {
  const child = spawn(cmd, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  child.stdout.on('data', (d) => log(name, color, d))
  child.stderr.on('data', (d) => log(name, color, d))
  child.on('exit', (code, signal) => {
    console.log(`[${name}] exit code=${code} signal=${signal}`)
    if (code !== 0 && code !== null) {
      for (const c of children) c.kill()
      process.exit(code)
    }
  })
  return child
}

async function waitForApi(deadline) {
  while (Date.now() < deadline) {
    try {
      const response = await fetch(API_HEALTH)
      if (response.ok) return true
    } catch {
      // API ещё не слушает — повторяем
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  return false
}

start({ name: 'api', cmd: 'npm run server:dev', color: '\x1b[35m' })
console.log(`Жду готовности API (${API_HEALTH})…`)

const ready = await waitForApi(Date.now() + API_WAIT_MS)
console.log(
  ready
    ? 'API готов — запускаю Vite'
    : 'API не ответил за 30 с — запускаю Vite всё равно (проверь лог [api])',
)

start({ name: 'web', cmd: 'npm run dev', color: '\x1b[36m' })
console.log('web: http://127.0.0.1:5173  api: http://127.0.0.1:3000  (Ctrl+C — остановить оба)')

const shutdown = () => {
  for (const c of children) c.kill('SIGINT')
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
