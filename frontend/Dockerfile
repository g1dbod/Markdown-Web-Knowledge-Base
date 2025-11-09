# Этап 1: Сборка приложения
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Собираем приложение для продакшена
RUN npm run build

# Этап 2: Production образ с nginx
FROM nginx:alpine

# Копируем собранное приложение из builder этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# nginx запускается автоматически
CMD ["nginx", "-g", "daemon off;"]
