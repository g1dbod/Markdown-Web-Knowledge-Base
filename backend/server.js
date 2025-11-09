import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import config from './config.js';

const app = express();
const { PORT, KNOWLEDGE_BASE_PATH, CORS_OPTIONS, SEARCH, IGNORE_PATTERNS, SUPPORTED_EXTENSIONS, LOGGING } = config;

app.use(cors(CORS_OPTIONS));
app.use(express.json());

// Логирование
function log(message, level = 'info') {
  if (LOGGING.ENABLED) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

// Функция для нормализации путей (всегда используем прямые слэши)
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

// Функция для проверки, должен ли файл/папка быть проигнорирован
function shouldIgnore(name) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(name);
    }
    return name === pattern;
  });
}

// Рекурсивное сканирование директории
async function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) {
        log(`Пропущен игнорируемый элемент: ${entry.name}`, 'debug');
        continue;
      }
      
      const fullPath = path.join(dirPath, entry.name);
      const relPath = normalizePath(path.join(relativePath, entry.name));
      
      if (entry.isDirectory()) {
        const children = await scanDirectory(fullPath, relPath);
        if (children.length > 0) {
          items.push({
            name: entry.name,
            path: relPath,
            type: 'folder',
            children
          });
        }
      } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        items.push({
          name: entry.name,
          path: relPath,
          type: 'file'
        });
      }
    }
  } catch (error) {
    log(`Ошибка чтения директории ${dirPath}: ${error.message}`, 'error');
  }
  
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'ru');
  });
}

// Рекурсивный поиск файлов
async function searchFiles(dirPath, query, relativePath = '', results = []) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      const relPath = normalizePath(path.join(relativePath, entry.name));
      
      if (entry.isDirectory()) {
        await searchFiles(fullPath, query, relPath, results);
      } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lowerContent = content.toLowerCase();
          const lowerQuery = query.toLowerCase();
          
          if (lowerContent.includes(lowerQuery) || entry.name.toLowerCase().includes(lowerQuery)) {
            const matches = [];
            let index = lowerContent.indexOf(lowerQuery);
            
            while (index !== -1 && matches.length < SEARCH.MAX_MATCHES_PER_FILE) {
              const start = Math.max(0, index - SEARCH.CONTEXT_LENGTH);
              const end = Math.min(content.length, index + query.length + SEARCH.CONTEXT_LENGTH);
              let snippet = content.substring(start, end);
              
              if (start > 0) snippet = '...' + snippet;
              if (end < content.length) snippet = snippet + '...';
              
              matches.push({
                snippet,
                position: index
              });
              
              index = lowerContent.indexOf(lowerQuery, index + 1);
            }
            
            results.push({
              name: entry.name,
              path: relPath,
              matches,
              matchCount: (content.match(new RegExp(query, 'gi')) || []).length
            });
            
            if (results.length >= SEARCH.MAX_RESULTS) {
              return results;
            }
          }
        } catch (error) {
          log(`Ошибка чтения файла ${fullPath}: ${error.message}`, 'error');
        }
      }
    }
  } catch (error) {
    log(`Ошибка поиска в директории ${dirPath}: ${error.message}`, 'error');
  }
  
  return results;
}

// API для получения структуры файлов
app.get('/api/tree', async (req, res) => {
  try {
    log('Запрос структуры дерева файлов');
    const tree = await scanDirectory(KNOWLEDGE_BASE_PATH);
    res.json(tree);
  } catch (error) {
    log(`Ошибка получения дерева: ${error.message}`, 'error');
    res.status(500).json({ error: 'Ошибка получения структуры файлов' });
  }
});

// API для поиска
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.trim().length < SEARCH.MIN_QUERY_LENGTH) {
      return res.status(400).json({ 
        error: `Поисковый запрос должен содержать минимум ${SEARCH.MIN_QUERY_LENGTH} символа` 
      });
    }
    
    log(`Поиск: "${query}"`);
    const results = await searchFiles(KNOWLEDGE_BASE_PATH, query.trim());
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    log(`Найдено результатов: ${results.length}`);
    res.json({
      query: query.trim(),
      count: results.length,
      results
    });
  } catch (error) {
    log(`Ошибка поиска: ${error.message}`, 'error');
    res.status(500).json({ error: 'Ошибка выполнения поиска' });
  }
});

// API для получения содержимого файла
app.get('/api/file', async (req, res) => {
  try {
    let filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Не указан путь к файлу' });
    }
    
    filePath = decodeURIComponent(filePath);
    
    // Проверка безопасности
    const pathSegments = filePath.split('/');
    for (const segment of pathSegments) {
      if (shouldIgnore(segment)) {
        log(`Попытка доступа к игнорируемому файлу: ${filePath}`, 'warn');
        return res.status(403).json({ error: 'Доступ к этому файлу запрещён' });
      }
    }
    
    filePath = filePath.replace(/\//g, path.sep);
    log(`Запрос файла: ${filePath}`);
    
    const fullPath = path.join(KNOWLEDGE_BASE_PATH, filePath);
    const normalizedPath = path.resolve(fullPath);
    const normalizedBase = path.resolve(KNOWLEDGE_BASE_PATH);
    
    if (!normalizedPath.startsWith(normalizedBase)) {
      log(`Попытка доступа за пределы базы знаний: ${normalizedPath}`, 'warn');
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    
    try {
      await fs.access(fullPath);
    } catch {
      log(`Файл не найден: ${fullPath}`, 'warn');
      return res.status(404).json({ 
        error: 'Файл не найден',
        path: filePath
      });
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    const html = marked(content);
    
    res.json({
      markdown: content,
      html,
      path: normalizePath(filePath)
    });
  } catch (error) {
    log(`Ошибка при обработке файла: ${error.message}`, 'error');
    res.status(500).json({ 
      error: 'Ошибка чтения файла',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    knowledgeBasePath: KNOWLEDGE_BASE_PATH,
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  log(`=================================`);
  log(`Сервер запущен на http://localhost:${PORT}`);
  log(`База знаний: ${KNOWLEDGE_BASE_PATH}`);
  log(`=================================`);
});
