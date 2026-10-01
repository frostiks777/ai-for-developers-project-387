#!/usr/bin/env bash
# Сценарий демо для asciinema: сквозной путь гостя через API дефолтного хоста.
# Запуск (сервер уже поднят: `npm run start`):
#   asciinema rec demo.cast -c "bash scripts/demo.sh"
# Переменные: BASE_URL (по умолчанию http://127.0.0.1:3000).
set -euo pipefail

BASE="${BASE_URL:-http://127.0.0.1:3000}"
HOST="${HOST_REF:-default}"

say() { printf '\n\033[1;36m# %s\033[0m\n' "$1"; }

say "1. Healthcheck"
curl -s "$BASE/health"; echo

say "2. Публичные настройки хоста"
curl -s "$BASE/api/v1/hosts/$HOST/settings"; echo

say "3. Свободные слоты"
SLOTS="$(curl -s "$BASE/api/v1/hosts/$HOST/slots")"
node -e "const d=JSON.parse(process.argv[1]);console.log('всего слотов:', d.slots.length);console.log('первый:', d.slots[0].startAt)" "$SLOTS"

START="$(node -e "const d=JSON.parse(process.argv[1]);const s=d.slots.find(x=>x.available)||d.slots[0];process.stdout.write(s.startAt)" "$SLOTS")"

say "4. Бронируем слот $START"
# --data-binary @- вместо -d: на Windows-curl кириллица в inline-теле ломает
# Content-Length, и Fastify отвечает FST_ERR_CTP_INVALID_CONTENT_LENGTH.
BOOKING="$(printf '{"eventTypeId":"default-consultation","startAt":"%s","clientName":"Демо Гость","clientEmail":"demo@example.com","consentAccepted":true}' "$START" | \
  curl -s -X POST "$BASE/api/v1/hosts/$HOST/bookings" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: demo-$(date +%s)" \
    --data-binary @-)"
echo "$BOOKING"
ID="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).id)" "$BOOKING")"

say "5. Повторная бронь того же слота отклоняется (409)"
printf '{"eventTypeId":"default-consultation","startAt":"%s","clientName":"Второй","clientEmail":"second@example.com","consentAccepted":true}' "$START" | \
  curl -s -o /dev/null -w 'HTTP %{http_code}\n' -X POST "$BASE/api/v1/hosts/$HOST/bookings" \
    -H 'Content-Type: application/json' \
    --data-binary @-

say "6. Отменяем бронь по публичному id (ссылка отмены)"
printf '%s' '{"reason":"демо"}' | curl -s -X POST "$BASE/api/v1/bookings/$ID/cancel" \
  -H 'Content-Type: application/json' --data-binary @-; echo

say "7. Слот снова свободен"
curl -s "$BASE/api/v1/hosts/$HOST/slots" | \
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const s=d.slots.find(x=>x.startAt==='$START');console.log('слот', '$START', 'доступен:', s?s.available:'—')"

printf '\n\033[1;32mГотово.\033[0m В UI: / (лендинг) → /book/%s → выбор слота → форма → успех;\n' "$HOST"
printf 'страница «Мои встречи» (/my) и панель организатора (/dashboard) — без логина.\n'
