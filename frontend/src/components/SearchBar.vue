<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по заметкам..."
        class="search-input"
        @input="handleSearch"
        @keyup.escape="clearSearch"
      />
      <button
        v-if="searchQuery"
        class="clear-button"
        @click="clearSearch"
        title="Очистить"
      >
        ✕
      </button>
    </div>
    
    <div v-if="isSearching" class="search-results">
      <div class="search-loading">
        <div class="spinner-small"></div>
        <span>Поиск...</span>
      </div>
    </div>
    
    <div v-else-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        Найдено: {{ searchResults.length }}
      </div>
      <div
        v-for="result in searchResults"
        :key="result.path"
        class="search-result-item"
        @click="openFile(result.path)"
      >
        <div class="result-title">
          📄 {{ result.name }}
          <span class="match-count">({{ result.matchCount }})</span>
        </div>
        <div class="result-path">{{ result.path }}</div>
        <div
          v-for="(match, index) in result.matches"
          :key="index"
          class="result-snippet"
          v-html="highlightText(match.snippet, searchQuery)"
        ></div>
      </div>
    </div>
    
    <div v-else-if="searchQuery && !isSearching" class="search-results">
      <div class="no-results">
        Ничего не найдено
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const router = useRouter();

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
let searchTimeout = null;

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (!searchQuery.value || searchQuery.value.trim().length < 2) {
    searchResults.value = [];
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      isSearching.value = true;
      const response = await axios.get(`${API_URL}/search`, {
        params: { q: searchQuery.value.trim() }
      });
      searchResults.value = response.data.results;
    } catch (error) {
      console.error('Ошибка поиска:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
}

function openFile(filePath) {
  const encodedPath = filePath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  router.push(`/note/${encodedPath}`);
  clearSearch();
}

function highlightText(text, query) {
  if (!query) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
</script>

<style scoped>
.search-container {
  margin-bottom: 0;
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 1.2em;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 2px solid var(--color-searchBorder);
  background: var(--color-searchBg);
  color: var(--color-sidebarText);
  border-radius: 8px;
  font-size: 0.95em;
  outline: none;
  transition: all 0.3s;
}

.search-input::placeholder {
  color: var(--color-searchPlaceholder);
}

.search-input:focus {
  border-color: var(--color-searchBorderFocus);
}

.clear-button {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2em;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  transition: color 0.2s;
}

.clear-button:hover {
  color: white;
}

.search-results {
  position: fixed;
  left: 20px;
  right: 20px;
  top: 150px;
  max-width: 260px;
  background: var(--color-searchResultsBg);
  border-radius: 8px;
  max-height: calc(100vh - 170px);
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.search-loading,
.no-results {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-spinnerSecondary);
  border-top-color: var(--color-spinnerPrimary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-header {
  padding: 10px 15px;
  background: var(--color-sidebarBg);
  font-weight: bold;
  border-bottom: 1px solid var(--color-borderColor);
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.8);
  position: sticky;
  top: 0;
  z-index: 1;
}

.search-result-item {
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-borderColor);
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: var(--color-sidebarItemHover);
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-title {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.95em;
}

.match-count {
  color: var(--color-searchHighlight);
  font-size: 0.85em;
  margin-left: 5px;
}

.result-path {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.result-snippet {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin-top: 5px;
  padding: 5px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.result-snippet :deep(mark) {
  background: var(--color-searchHighlight);
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
}
</style>
