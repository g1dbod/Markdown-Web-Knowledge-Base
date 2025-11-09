import path from 'path';

/**
 * Конфигурация backend сервера
 */
export const config = {
  // Порт, на котором будет запущен сервер
  PORT: process.env.PORT || 3000,
  
  // Путь к папке с базой знаний (Markdown файлами)
  // Примеры:
  // - Относительный путь: './knowledge-base'
  // - Абсолютный путь: '/Users/username/Documents/Notes'
  // - Windows: 'C:\\Users\\username\\Documents\\Notes'
  KNOWLEDGE_BASE_PATH: process.env.KNOWLEDGE_BASE_PATH || path.resolve('C:/Users/g1dbod/Yandex.Disk/Nexus'),
  
  // CORS настройки
  CORS_OPTIONS: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  
  // Настройки поиска
  SEARCH: {
    MIN_QUERY_LENGTH: 2,        // Минимальная длина поискового запроса
    MAX_RESULTS: 100,            // Максимальное количество результатов
    MAX_MATCHES_PER_FILE: 3,     // Максимальное количество совпадений в одном файле
    CONTEXT_LENGTH: 100          // Длина контекста вокруг найденного текста (символы)
  },
  
  // Файлы и папки для игнорирования
  IGNORE_PATTERNS: [
    /^\./,                       // Файлы и папки начинающиеся с точки
    /^node_modules$/,            // node_modules
    /^\.git$/,                   // git репозиторий
    /^\.obsidian$/,              // Obsidian конфигурация
    /^\.trash$/                  // Корзина
  ],
  
  // Поддерживаемые расширения файлов
  SUPPORTED_EXTENSIONS: ['.md', '.markdown'],
  
  // Логирование
  LOGGING: {
    ENABLED: process.env.NODE_ENV !== 'production',
    LEVEL: process.env.LOG_LEVEL || 'info'
  }
};

export default config;
