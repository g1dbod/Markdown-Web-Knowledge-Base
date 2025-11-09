import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../views/MainLayout.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/HomePage.vue')
      },
      {
        path: 'note/:path*',
        name: 'note',
        component: () => import('../views/NoteView.vue'),
        props: true
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
