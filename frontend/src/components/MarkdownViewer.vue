<template>
  <div class="markdown-viewer">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка документа...</p>
    </div>
    
    <div v-else-if="!html" class="empty-state">
      <h2>👈 Выберите документ</h2>
      <p>Выберите файл из дерева навигации слева</p>
    </div>
    
    <div 
      v-else 
      class="markdown-body" 
      @click="handleLinkClick"
      ref="contentRef"
    >
      <div class="file-path">{{ path }}</div>
      <div v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  html: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['navigate']);
const contentRef = ref(null);

function handleLinkClick(event) {
  // Проверяем, что клик был по ссылке
  const target = event.target.closest('a');
  
  if (!target) return;
  
  const href = target.getAttribute('href');
  
  if (!href) return;
  
  // Проверяем, является ли ссылка внешней
  const isExternal = /^https?:\/\//.test(href) || /^mailto:/.test(href);
  
  if (isExternal) {
    // Внешние ссылки открываются в новой вкладке
    event.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  
  // Обрабатываем внутренние ссылки
  event.preventDefault();
  
  // Вычисляем абсолютный путь к файлу
  let targetPath = href;
  
  // Если ссылка относительная, вычисляем её относительно текущего файла
  if (!href.startsWith('/')) {
    const currentDir = props.path.split('/').slice(0, -1).join('/');
    targetPath = normalizePath(`${currentDir}/${href}`);
  } else {
    // Убираем начальный слэш для абсолютных путей
    targetPath = href.replace(/^\/+/, '');
  }
  
  // Убираем якорные ссылки и параметры запроса
  targetPath = targetPath.split('#')[0].split('?')[0];
  
  // Добавляем расширение .md, если его нет
  if (!targetPath.endsWith('.md')) {
    targetPath = `${targetPath}.md`;
  }
  
  emit('navigate', targetPath);
}

// Функция для нормализации пути (обработка ../  и ./)
function normalizePath(path) {
  const parts = path.split('/');
  const normalized = [];
  
  for (const part of parts) {
    if (part === '..') {
      normalized.pop();
    } else if (part !== '.' && part !== '') {
      normalized.push(part);
    }
  }
  
  return normalized.join('/');
}
</script>

<style scoped>
.markdown-viewer {
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #95a5a6;
  text-align: center;
}

.empty-state h2 {
  font-size: 2em;
  margin-bottom: 10px;
}

.file-path {
  background: #ecf0f1;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
}
</style>
