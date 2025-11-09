import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

const app = express();
const PORT = 3000;

// Укажите путь к вашей папке с базой знаний
const KNOWLEDGE_BASE_PATH = path.resolve('C:/Users/g1dbod/Yandex.Disk/Nexus');

app.use(cors());
app.use(express.json());

// Функция для нормализации путей (всегда используем прямые слэши)
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

// Список имён для игнорирования (можно добавить свои)
const IGNORE_LIST = ['.git', '.obsidian', '.trash', 'node_modules', '.DS_Store'];

function shouldIgnore(name) {
  // Скрытые файлы (начинающиеся с точки)
  if (name.startsWith('.')) {
    return true;
  }
  
  // Файлы из списка игнорирования
  if (IGNORE_LIST.includes(name)) {
    return true;
  }
  
  return false;
}

// Рекурсивное сканирование директории
async function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Пропускаем скрытые файлы и папки
      if (shouldIgnore(entry.name)) {
        console.log(`Пропущен скрытый элемент: ${entry.name}`);
        continue;
      }
      
      const fullPath = path.join(dirPath, entry.name);
      const relPath = normalizePath(path.join(relativePath, entry.name));
      
      if (entry.isDirectory()) {
        const children = await scanDirectory(fullPath, relPath);
        // Добавляем папку только если в ней есть видимые элементы
        if (children.length > 0) {
          items.push({
            name: entry.name,
            path: relPath,
            type: 'folder',
            children
          });
        }
      } else if (entry.name.endsWith('.md')) {
        items.push({
          name: entry.name,
          path: relPath,
          type: 'file'
        });
      }
    }
  } catch (error) {
    console.error(`Ошибка чтения директории ${dirPath}:`, error);
  }
  
  return items.sort((a, b) => {
    // Папки сначала, затем файлы
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
      // Пропускаем скрытые файлы и папки
      if (shouldIgnore(entry.name)) {
        continue;
      }
      
      const fullPath = path.join(dirPath, entry.name);
      const relPath = normalizePath(path.join(relativePath, entry.name));
      
      if (entry.isDirectory()) {
        await searchFiles(fullPath, query, relPath, results);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lowerContent = content.toLowerCase();
          const lowerQuery = query.toLowerCase();
          
          // Проверяем, содержит ли файл поисковый запрос
          if (lowerContent.includes(lowerQuery) || entry.name.toLowerCase().includes(lowerQuery)) {
            // Находим контекст вокруг найденного текста
            const matches = [];
            let index = lowerContent.indexOf(lowerQuery);
            
            while (index !== -1 && matches.length < 3) {
              const start = Math.max(0, index - 100);
              const end = Math.min(content.length, index + query.length + 100);
              let snippet = content.substring(start, end);
              
              // Добавляем многоточие если текст обрезан
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
          }
        } catch (error) {
          console.error(`Ошибка чтения файла ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Ошибка поиска в директории ${dirPath}:`, error);
  }
  
  return results;
}

// API для получения структуры файлов
app.get('/api/tree', async (req, res) => {
  try {
    const tree = await scanDirectory(KNOWLEDGE_BASE_PATH);
    res.json(tree);
  } catch (error) {
    console.error('Ошибка получения дерева:', error);
    res.status(500).json({ error: 'Ошибка получения структуры файлов' });
  }
});

// API для поиска
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Поисковый запрос должен содержать минимум 2 символа' });
    }
    
    console.log('Поиск:', query);
    
    const results = await searchFiles(KNOWLEDGE_BASE_PATH, query.trim());
    
    // Сортируем результаты по количеству совпадений
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    res.json({
      query: query.trim(),
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({ error: 'Ошибка выполнения поиска' });
  }
});

// API для получения содержимого файла
app.get('/api/file', async (req, res) => {
  try {
    // Декодируем путь из URL
    let filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Не указан путь к файлу' });
    }
    
    // Декодируем URI компоненты (обработка пробелов и спецсимволов)
    filePath = decodeURIComponent(filePath);
    
    // Проверяем, что путь не содержит скрытые файлы/папки
    const pathSegments = filePath.split('/');
    for (const segment of pathSegments) {
      if (shouldIgnore(segment)) {
        console.error('Попытка доступа к скрытому файлу:', filePath);
        return res.status(403).json({ error: 'Доступ к скрытым файлам запрещён' });
      }
    }
    
    // Нормализуем слэши для Windows
    filePath = filePath.replace(/\//g, path.sep);
    
    console.log('Запрошен файл:', filePath);
    
    const fullPath = path.join(KNOWLEDGE_BASE_PATH, filePath);
    
    // Проверка безопасности: файл должен находиться внутри базы знаний
    const normalizedPath = path.resolve(fullPath);
    const normalizedBase = path.resolve(KNOWLEDGE_BASE_PATH);
    
    if (!normalizedPath.startsWith(normalizedBase)) {
      console.error('Попытка доступа за пределы базы знаний:', normalizedPath);
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    
    // Проверяем существование файла
    try {
      await fs.access(fullPath);
    } catch {
      console.error('Файл не найден:', fullPath);
      return res.status(404).json({ 
        error: 'Файл не найден',
        path: filePath,
        fullPath: fullPath
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
    console.error('Ошибка при обработке файла:', error);
    res.status(500).json({ 
      error: 'Ошибка чтения файла',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`База знаний: ${KNOWLEDGE_BASE_PATH}`);
});