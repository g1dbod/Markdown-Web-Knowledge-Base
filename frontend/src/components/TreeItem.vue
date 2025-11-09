<template>
  <div class="tree-item">
    <div 
      class="tree-item-content"
      :class="{ 
        'is-folder': item.type === 'folder', 
        'is-file': item.type === 'file',
        'is-active': isActive
      }"
      @click="handleClick"
    >
      <span class="icon">
        <template v-if="item.type === 'folder'">
          {{ isOpen ? '📂' : '📁' }}
        </template>
        <template v-else>
          📄
        </template>
      </span>
      <span class="name">{{ item.name }}</span>
    </div>
    
    <div v-if="item.type === 'folder' && isOpen" class="tree-item-children">
      <TreeItem 
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :current-path="currentPath"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  currentPath: {
    type: String,
    default: ''
  }
});

const router = useRouter();
const isOpen = ref(false);

const isActive = computed(() => {
  if (props.item.type !== 'file' || !props.currentPath) return false;
  // Декодируем оба пути для корректного сравнения
  const decodedCurrentPath = decodeURIComponent(props.currentPath);
  const decodedItemPath = decodeURIComponent(props.item.path);
  return decodedCurrentPath === decodedItemPath;
});

// Автоматически раскрываем папки, содержащие активный файл
const shouldAutoExpand = computed(() => {
  if (props.item.type !== 'folder' || !props.currentPath) return false;
  const decodedCurrentPath = decodeURIComponent(props.currentPath);
  const decodedItemPath = decodeURIComponent(props.item.path);
  return decodedCurrentPath.startsWith(decodedItemPath + '/');
});

watch(shouldAutoExpand, (newVal) => {
  if (newVal) {
    isOpen.value = true;
  }
}, { immediate: true });

function handleClick() {
  if (props.item.type === 'folder') {
    isOpen.value = !isOpen.value;
  } else {
    // Путь уже нормализован на сервере с прямыми слэшами
    // Кодируем каждый сегмент пути для URL
    const encodedPath = props.item.path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    router.push(`/note/${encodedPath}`);
  }
}
</script>

<style scoped>
.tree-item {
  margin-left: 0;
}

.tree-item-content {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 5px;
  transition: background 0.2s;
}

.tree-item-content:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tree-item-content.is-file:hover {
  background: #3498db;
}

.tree-item-content.is-active {
  background: #3498db;
  font-weight: bold;
}

.icon {
  margin-right: 8px;
  font-size: 1em;
}

.name {
  font-size: 0.95em;
  word-break: break-word;
}

.tree-item-children {
  margin-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  padding-left: 5px;
}

.tree-item-content:hover {
  background: var(--color-sidebarItemHover);
}

.tree-item-content.is-file:hover {
  background: var(--color-sidebarItemActive);
}

.tree-item-content.is-active {
  background: var(--color-sidebarItemActive);
  font-weight: bold;
}

</style>
