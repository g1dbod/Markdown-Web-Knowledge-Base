# Многоступенчатая сборка для оптимизации размера образа

# Этап 1: Сборка frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Копируем package файлы
COPY frontend/package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY frontend/ ./

# Собираем production версию
RUN npm run build

# Этап 2: Подготовка backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Копируем package файлы
COPY backend/package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Этап 3: Финальный образ
FROM node:18-alpine

LABEL maintainer="your.email@example.com"
LABEL description="Knowledge Base Web Viewer"

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Копируем backend зависимости
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Копируем backend код
COPY backend/*.js ./
COPY backend/package.json ./

# Копируем собранный frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Создаем директорию для базы знаний
RUN mkdir -p /app/knowledge-base && \
    chown -R nodejs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nodejs

# Открываем порт
EXPOSE 3000

# Переменные окружения по умолчанию
ENV NODE_ENV=production \
    PORT=3000 \
    KNOWLEDGE_BASE_PATH=/app/knowledge-base

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем приложение
CMD ["node", "server.js"]
