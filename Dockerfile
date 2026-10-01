# --- Этап сборки: собираем фронтенд ---
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Этап запуска: только production-зависимости и собранные файлы ---
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY server ./server

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "run", "start"]