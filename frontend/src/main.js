import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { applyTheme, getCurrentTheme } from './styles/themes';

// Применяем сохранённую тему при загрузке приложения
applyTheme(getCurrentTheme());

const app = createApp(App);
app.use(router);
app.mount('#app');
