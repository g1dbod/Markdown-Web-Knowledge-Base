<template>
  <div class="theme-selector">
    <button
      class="theme-button"
      @click="toggleDropdown"
      title="Сменить тему"
    >
      🎨
    </button>
    
    <div v-if="isOpen" class="theme-dropdown">
      <div
        v-for="(theme, key) in themes"
        :key="key"
        class="theme-option"
        :class="{ active: currentTheme === key }"
        @click="selectTheme(key)"
      >
        <span class="theme-name">{{ theme.name }}</span>
        <span v-if="currentTheme === key" class="check-mark">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { themes, applyTheme, getCurrentTheme } from '../styles/themes';

const isOpen = ref(false);
const currentTheme = ref(getCurrentTheme());

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectTheme(themeName) {
  currentTheme.value = themeName;
  applyTheme(themeName);
  isOpen.value = false;
}

function handleClickOutside(event) {
  const themeSelector = document.querySelector('.theme-selector');
  if (themeSelector && !themeSelector.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.theme-button:hover {
  opacity: 1;
}

.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: var(--color-searchResultsBg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 150px;
  z-index: 1000;
  overflow: hidden;
}

.theme-option {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
  border-bottom: 1px solid var(--color-borderColor);
}

.theme-option:last-child {
  border-bottom: none;
}

.theme-option:hover {
  background: var(--color-sidebarItemHover);
}

.theme-option.active {
  background: var(--color-sidebarItemActive);
  color: white;
  font-weight: bold;
}

.theme-name {
  font-size: 0.95em;
}

.check-mark {
  font-weight: bold;
  margin-left: 10px;
}
</style>
