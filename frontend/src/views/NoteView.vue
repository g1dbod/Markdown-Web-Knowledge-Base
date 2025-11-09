<template>
  <div class="note-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка документа...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <h2>❌ Ошибка загрузки файла</h2>
      <p>{{ error }}</p>
      <p class="error-path"><strong>Путь:</strong> {{ decodedNotePath }}</p>
    </div>
    
    <div 
      v-else 
      class="markdown-body" 
      @click="handleLinkClick"
    >
      <div class="file-path">{{ decodedNotePath }}</div>
      <div v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

import { config } from '../config.js';
const API_URL = config.API_URL;


const route = useRoute();
const router = useRouter();

const html = ref('');
const loading = ref(false);
const error = ref('');

const notePath = computed(() => {
  if (route.params.path) {
    return Array.isArray(route.params.path) 
      ? route.params.path.join('/') 
      : route.params.path;
  }
  return '';
});

const decodedNotePath = computed(() => {
  return decodeURIComponent(notePath.value);
});

async function loadNote() {
  if (!notePath.value) return;
  
  try {
    loading.value = true;
    error.value = '';
    
    const response = await axios.get(`${API_URL}/file`, {
      params: { path: decodedNotePath.value }
    });
    
    html.value = response.data.html;
  } catch (err) {
    console.error('Ошибка загрузки файла:', err);
    if (err.response && err.response.data) {
      error.value = err.response.data.error || 'Неизвестная ошибка';
    } else {
      error.value = `Файл не найден или недоступен`;
    }
  } finally {
    loading.value = false;
  }
}

function handleLinkClick(event) {
  const target = event.target.closest('a');
  
  if (!target) return;
  
  let href = target.getAttribute('href');
  
  if (!href) return;
  
  // Внешние ссылки и якоря
  const isExternal = /^https?:\/\//.test(href) || /^mailto:/.test(href);
  const isAnchor = /^#/.test(href);
  
  if (isExternal) {
    event.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  
  if (isAnchor) {
    return;
  }
  
  // Обрабатываем внутренние ссылки
  event.preventDefault();
  
  console.log('=== Обработка ссылки ===');
  console.log('Исходная ссылка (href):', href);
  console.log('Текущий путь файла:', decodedNotePath.value);
  
  // Декодируем href
  try {
    href = decodeURIComponent(href);
    console.log('Декодированная ссылка:', href);
  } catch (e) {
    console.log('Ссылка уже декодирована');
  }
  
  let targetPath = href;
  
  // Убираем якорные ссылки и параметры запроса
  targetPath = targetPath.split('#')[0].split('?')[0];
  
  if (!targetPath) {
    console.log('Пустой путь после удаления якоря, прерываем');
    return;
  }
  
  console.log('Путь после удаления якоря/параметров:', targetPath);
  
  // Заменяем обратные слэши на прямые
  targetPath = targetPath.replace(/\\/g, '/');
  
  // Определяем тип ссылки:
  // 1. Абсолютная (начинается с /)
  // 2. Полный путь от корня (содержит верхнеуровневую папку, например "01-Projects/")
  // 3. Относительная (все остальные)
  
  if (targetPath.startsWith('/')) {
    // Абсолютная ссылка - убираем начальный слэш
    targetPath = targetPath.substring(1);
    console.log('Тип: абсолютная ссылка, убран начальный слэш:', targetPath);
  } else if (targetPath.startsWith('../') || targetPath.startsWith('./')) {
    // Явная относительная ссылка
    const lastSlashIndex = decodedNotePath.value.lastIndexOf('/');
    const currentDir = lastSlashIndex >= 0 
      ? decodedNotePath.value.substring(0, lastSlashIndex)
      : '';
    
    console.log('Тип: явная относительная ссылка');
    console.log('Текущая директория:', currentDir);
    
    if (currentDir) {
      targetPath = currentDir + '/' + targetPath;
    }
    
    console.log('После добавления текущей директории:', targetPath);
  } else {
    // Проверяем, начинается ли путь с известной верхнеуровневой папки
    // Это может быть полный путь от корня базы знаний
    const firstSegment = targetPath.split('/')[0];
    const currentFirstSegment = decodedNotePath.value.split('/')[0];
    
    console.log('Первый сегмент ссылки:', firstSegment);
    console.log('Первый сегмент текущего пути:', currentFirstSegment);
    
    // Если первый сегмент ссылки совпадает с первым сегментом текущего пути,
    // скорее всего это полный путь от корня
    if (firstSegment === currentFirstSegment) {
      console.log('Тип: полный путь от корня (первые сегменты совпадают)');
      // Используем путь как есть
    } else {
      // Это относительная ссылка без ./ или ../
      const lastSlashIndex = decodedNotePath.value.lastIndexOf('/');
      const currentDir = lastSlashIndex >= 0 
        ? decodedNotePath.value.substring(0, lastSlashIndex)
        : '';
      
      console.log('Тип: относительная ссылка (без ./ и ../)');
      console.log('Текущая директория:', currentDir);
      
      if (currentDir) {
        targetPath = currentDir + '/' + targetPath;
      }
      
      console.log('После добавления текущей директории:', targetPath);
    }
  }
  
  // Нормализуем путь (обрабатываем ../ и ./)
  targetPath = normalizePath(targetPath);
  console.log('Путь после нормализации:', targetPath);
  
  // Добавляем расширение .md, если его нет
  if (!targetPath.endsWith('.md')) {
    targetPath = `${targetPath}.md`;
    console.log('Добавлено расширение .md:', targetPath);
  }
  
  // Кодируем путь для URL
  const encodedPath = targetPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  
  console.log('Финальный закодированный путь:', encodedPath);
  console.log('=== Конец обработки ===');
  
  // Навигация через роутер
  router.push(`/note/${encodedPath}`);
}

function normalizePath(path) {
  const parts = path.split('/');
  const normalized = [];
  
  for (const part of parts) {
    if (part === '..') {
      if (normalized.length > 0) {
        normalized.pop();
      }
    } else if (part !== '.' && part !== '') {
      normalized.push(part);
    }
  }
  
  const result = normalized.join('/');
  console.log('Нормализация пути:', path, '→', result);
  return result;
}

onMounted(() => {
  loadNote();
});

watch(() => route.params.path, () => {
  loadNote();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, { deep: true });
</script>

<style scoped>
.note-view {
  height: 100%;
  position: relative;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7f8c8d;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.file-path {
  background: #ecf0f1;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.error-path {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
  font-size: 0.9em;
  word-break: break-all;
}

.error-path strong {
  color: #e74c3c;
}

.file-path {
  background: var(--color-filePath);
  color: var(--color-filePathText);
}

.spinner {
  border: 4px solid var(--color-spinnerSecondary);
  border-top-color: var(--color-spinnerPrimary);
}

</style>
