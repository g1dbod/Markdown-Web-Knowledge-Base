/**
 * Конфигурация frontend приложения
 */
export const config = {
  // URL API backend сервера
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // Тема по умолчанию
  DEFAULT_THEME: import.meta.env.VITE_DEFAULT_THEME || 'dark',
  
  // Настройки поиска
  SEARCH: {
    DEBOUNCE_DELAY: 300,  // Задержка перед поиском (мс)
    MIN_LENGTH: 2         // Минимальная длина запроса
  },
  
  // Настройки UI
  UI: {
    SIDEBAR_WIDTH: '300px',
    MAX_FILE_PATH_LENGTH: 100
  }
};

export default config;
