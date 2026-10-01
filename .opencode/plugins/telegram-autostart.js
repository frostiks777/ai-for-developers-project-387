// telegram-autostart — личный Telegram-мост для opencode (GUI и CLI).
//
// Что делает:
//   1) поднимает telegram-bot/bot.mjs отдельным процессом (long-polling);
//   2) шлёт уведомления в Telegram по событиям сессии:
//        session.idle  — агент закончил и ждёт;
//        session.error — агент упал.
//
// Мост живёт в telegram-bot/ (папка в .gitignore). Нет папки/токена/флага
// TELEGRAM_NOTIFY=on — всё молча выключено, отправка пропускается.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NOTIFY_ENV = 'TELEGRAM_NOTIFY';
const BOT_DIR = 'telegram-bot';
const MIN_GAP_MS = 60_000; // не чаще раза в минуту на один тип события

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export const TelegramAutostart = async ({ client, directory, $ }) => {
  const botDir = join(directory, BOT_DIR);
  const botReady = existsSync(join(botDir, 'bot.mjs')) && existsSync(join(botDir, '.env'));
  const notifyOn = process.env[NOTIFY_ENV] === 'on' && botReady;

  const log = async (message) => {
    try {
      await client.app.log({
        body: { service: 'telegram-bridge', level: 'info', message },
      });
    } catch {
      // логирование не критично
    }
  };

  const ensureBot = () => {
    if (!botReady) return;
    const pidFile = join(botDir, '.bot.pid');
    let pid = 0;
    try {
      pid = Number(readFileSync(pidFile, 'utf8')) || 0;
    } catch {
      // pid-файла нет — будем поднимать
    }
    if (pid && isAlive(pid)) return;
    try {
      const child = spawn('node', ['bot.mjs'], {
        cwd: botDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
      writeFileSync(pidFile, String(child.pid));
      log(`bot started (pid ${child.pid})`);
    } catch {
      try {
        unlinkSync(pidFile);
      } catch {
        // нечего чистить
      }
    }
  };

  const lastSent = new Map();
  const send = async (kind, title, text) => {
    if (!notifyOn) return;
    const now = Date.now();
    if (now - (lastSent.get(kind) ?? 0) < MIN_GAP_MS) return;
    lastSent.set(kind, now);
    try {
      await $`node ${join(botDir, 'notify.mjs')} ${title} ${text}`.quiet();
    } catch {
      // отправка не должна ломать opencode
    }
  };

  ensureBot();

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case 'session.created':
          ensureBot();
          break;
        case 'session.idle':
          await send('idle', 'Агент закончил', 'Жду задачу.');
          break;
        case 'session.error':
          await send('error', 'Ошибка сессии', 'Агент упал — глянь логи opencode');
          break;
        default:
          break;
      }
    },
  };
};
