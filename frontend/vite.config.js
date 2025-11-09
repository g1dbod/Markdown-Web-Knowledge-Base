import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Важно для Docker
    watch: {
      usePolling: true // Для hot reload в Docker
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0'
  }
});
