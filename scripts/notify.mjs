// notify.mjs — уведомления пользователю: Telegram **и** Windows-тост, запрос апрува
// с кнопками и ожидание решения.
//
// Почему оба канала: пользователь просит получать уведомление всегда — и в чат, и тостом
// (Telegram работает с телефона, тост — когда он за компьютером). Каналы разные люди
// смотрят по-разному, одно и то же событие в них не путается. Отключить один канал явно:
// `--channel telegram` или `--channel toast`.
//
// Что осталось от дублирования внутри одного канала: повтор того же события гасится по
// ключу `--kind` с окном в 10 минут (код выхода `3`) — иначе «уведомил дважды подряд»
// превращается в спам.
//
// Использование:
//   node scripts/notify.mjs "Заголовок" "Текст"
//   node scripts/notify.mjs "Нужно решение" "Делаем X?" --id q123 --wait 900
//   node scripts/notify.mjs "Релиз" "CI зелёный" --kind release
//
// Флаги:
//   --kind <start|blocker|release|info>  ключ подавления повторов (по умолчанию info)
//   --id <qid>                          вопрос с кнопками ✅/⛔ в Telegram
//   --wait <секунды>                    ждать решения в decisions.jsonl до ответа
//   --channel both|telegram|toast       both (по умолчанию): оба канала
//   --gap <минуты>                      окно подавления повторов (по умолчанию 10)
//   --force                             отправить, даже если такой ключ уже слали
//
// Выход: 0 — отправлено (или решение получено), 1 — Telegram не отправил,
//        2 — решение не получено за отведённое время, 3 — подавлено как дубль.
// Ноль зависимостей; на не-Windows тост просто пропускается.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, '..');
const botDir = join(projectDir, 'telegram-bot');

// Состояние подавления — рядом с мостом, а если его нет (чистая копия репозитория),
// во временном каталоге: в git оно попасть не должно ни при каких условиях.
const statePath = existsSync(botDir)
  ? join(botDir, '.notify-state.json')
  : join(tmpdir(), 'call-calendar-notify-state.json');

const MINUTE = 60_000;
const DEFAULT_GAP_MIN = 10;

function readState() {
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  try {
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch {
    // не смогли записать — просто не будем подавлять повторы в этот раз
  }
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i += 1;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

const { positional, flags } = parseArgs(process.argv.slice(2));

const title = positional[0] ?? 'Календарь звонков';
const message = positional[1] ?? '';
const kind = typeof flags.kind === 'string' ? flags.kind : 'info';
const qid = typeof flags.id === 'string' ? flags.id : undefined;
const channel = typeof flags.channel === 'string' ? flags.channel : 'both';
const gapMin = typeof flags.gap === 'string' ? Number(flags.gap) : DEFAULT_GAP_MIN;
const force = flags.force === true || flags.force === 'true';
const waitSec = typeof flags.wait === 'string' ? Number(flags.wait) : 0;

function telegramReady() {
  return (
    existsSync(join(botDir, 'notify.mjs')) &&
    existsSync(join(botDir, '.env')) &&
    existsSync(join(botDir, '.bot.pid'))
  );
}

function sendTelegram() {
  const args = [join(botDir, 'notify.mjs'), title, message];
  if (qid) args.push('--id', qid);
  const out = execFileSync('node', args, { encoding: 'utf8', cwd: projectDir });
  return out.trim();
}

function sendToast() {
  const ps = join(scriptDir, 'notify.ps1');
  if (!existsSync(ps)) return '[toast] скрипт notify.ps1 не найден — пропуск';
  if (process.platform !== 'win32') return '[toast] не Windows — пропуск';
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps, title, message],
    { stdio: 'ignore' },
  );
  return '[toast] ok';
}

// --- дедупликация ----------------------------------------------------------

const state = readState();
const last = state[kind];
if (!force && last && Date.now() - last < gapMin * MINUTE) {
  const agoMin = Math.round((Date.now() - last) / MINUTE);
  console.log(
    `[notify] дубль подавлен: «${kind}» уже слали ${agoMin} мин назад (окно ${gapMin} мин). ` +
      'Пропустил оба канала — сообщение одно и то же.',
  );
  process.exit(3);
}

// --- отправка --------------------------------------------------------------

// Каналы по умолчанию оба (`--channel both`), но отсутствие канала не должно
// ронять отправку: без моста уходит тост, без Windows — Telegram.
const tgReady = telegramReady();
const useTelegram =
  channel === 'both' || channel === 'telegram' || (channel === 'auto' && tgReady);
const useToast = channel === 'both' || channel === 'toast' || (channel === 'auto' && !tgReady);

const results = [];
if (useTelegram) {
  try {
    results.push(`telegram: ${sendTelegram()}`);
  } catch (error) {
    console.error(`[notify] Telegram не отправил: ${String(error.message).slice(0, 200)}`);
    // Откатываем метку дедупликации: событие не доставлено, повтор должен пройти.
    process.exit(1);
  }
}
if (useToast) {
  try {
    results.push(sendToast());
  } catch (error) {
    console.error(`[notify] тост не показался: ${String(error.message).slice(0, 200)}`);
  }
}

state[kind] = Date.now();
writeState(state);
console.log(
  results.length > 0
    ? results.join('; ')
    : '[notify] ни один канал не доступен: telegram-bot/ нет, тост не на Windows',
);

// --- ожидание решения ------------------------------------------------------

if (!qid || waitSec <= 0) process.exit(0);

const decisionsPath = join(botDir, 'decisions.jsonl');
const deadline = Date.now() + waitSec * 1000;
const pollMs = 3000;

while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, pollMs));
  let lines = [];
  try {
    lines = readFileSync(decisionsPath, 'utf8').split('\n').filter(Boolean);
  } catch {
    continue;
  }
  for (const line of lines.reverse()) {
    try {
      const record = JSON.parse(line);
      if (record.qid === qid) {
        console.log(`[notify] решение ${qid}: ${record.decision} (${record.at})`);
        process.exit(0);
      }
    } catch {
      // битая строка — пропускаем
    }
  }
}

console.log(`[notify] решение ${qid} не получено за ${waitSec} с`);
process.exit(2);