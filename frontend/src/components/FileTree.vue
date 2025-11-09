<template>
  <div class="file-tree">
    <div v-if="loading" class="loading">Загрузка...</div>
    <TreeItem 
      v-for="item in items" 
      :key="item.path"
      :item="item"
      :current-path="currentPath"
    />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import TreeItem from './TreeItem.vue';

defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPath: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.file-tree {
  user-select: none;
}

.loading {
  padding: 10px;
  text-align: center;
  color: #95a5a6;
}
</style>
