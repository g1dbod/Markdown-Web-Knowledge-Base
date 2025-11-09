# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем остальные файлы приложения
COPY . .

# Создаём директорию для базы знаний (если будет монтироваться volume)
RUN mkdir -p /knowledge-base

# Открываем порт
EXPOSE 3000

# Указываем команду запуска
CMD ["node", "server.js"]
