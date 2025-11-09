<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-fixed">
        <div class="sidebar-header">
          <h2>База знаний</h2>
          <ThemeSelector />
        </div>
        
        <SearchBar />
      </div>
      
      <div class="sidebar-scrollable">
        <FileTree 
          :items="treeData" 
          :loading="loading"
          :current-path="currentNotePath"
        />
      </div>
    </aside>
    
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import FileTree from '../components/FileTree.vue';
import SearchBar from '../components/SearchBar.vue';
import ThemeSelector from '../components/ThemeSelector.vue';

import { config } from '../config.js';
const API_URL = config.API_URL;

const route = useRoute();

const treeData = ref([]);
const loading = ref(true);

const currentNotePath = computed(() => {
  if (route.name === 'note' && route.params.path) {
    const pathStr = Array.isArray(route.params.path) 
      ? route.params.path.join('/') 
      : route.params.path;
    return pathStr;
  }
  return '';
});

async function loadTree() {
  try {
    loading.value = true;
    const response = await axios.get(`${API_URL}/tree`);
    treeData.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки дерева:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTree();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 600px;
  background: var(--color-sidebarBg);
  color: var(--color-sidebarText);
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.sidebar-fixed {
  flex-shrink: 0;
  padding: 20px;
  padding-bottom: 15px;
  background: var(--color-sidebarBg);
  border-bottom: 1px solid var(--color-borderColor);
  position: sticky;
  top: 0;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-sidebarBorder);
}

.sidebar-header h2 {
  font-size: 1.5em;
  margin: 0;
}

.sidebar-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-top: 10px;
}

.content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-contentBg);
}
</style>
