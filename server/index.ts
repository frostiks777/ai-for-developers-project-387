import { regenerateAllHostsSlots } from './availability-settings'
import { buildApp } from './app'
import { env } from './env'
import { sendDueReminders } from './reminders'

const app = await buildApp()

// Корректное завершение по сигналам ОС
const shutdown = async (signal: string) => {
  app.log.info(`Получен ${signal}, завершаю работу`)
  await app.close()
  process.exit(0)
}
process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

try {
  const port = env.PORT
  await app.listen({ port, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}

// Напоминания (ADR-0026): проверка при старте. На Render Free сервис спит,
// поэтому основной триггер — внешний cron и ленивая проверка в onRequest.
void sendDueReminders().catch((error) => app.log.error(error))

// Слоты приводим к текущим настройкам при старте: подчищаем то, что застряло
// на старой сетке, и досоздаём недостающее по горизонту (#97).
try {
  const hosts = await regenerateAllHostsSlots()

  app.log.info(`Слоты пересобраны под настройки хостов: ${hosts}`)
} catch (error) {
  app.log.error(error, 'Не удалось пересобрать слоты при старте')
}

// Запуск: npm run server:dev (разработка) / npm run start (продакшен)