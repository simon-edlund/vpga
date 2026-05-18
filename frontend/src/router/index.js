import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login',           component: () => import('../views/LoginView.vue') },
    { path: '/change-password', component: () => import('../views/ChangePasswordView.vue'), meta: { requiresAuth: true } },
    { path: '/',                component: () => import('../views/StandingsView.vue'),      meta: { requiresAuth: true } },
    { path: '/round/:id',       component: () => import('../views/RoundDetailView.vue'),    meta: { requiresAuth: true } },
    { path: '/ompc',            component: () => import('../views/OMPCView.vue'),           meta: { requiresAuth: true } },
    { path: '/calendar',        component: () => import('../views/CalendarView.vue'),       meta: { requiresAuth: true } },
    { path: '/admin/members',   component: () => import('../views/admin/MembersView.vue'),    meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/rounds',    component: () => import('../views/admin/RoundsAdminView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/scores',    component: () => import('../views/admin/ScoreEntryView.vue'),  meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/events',    component: () => import('../views/admin/EventsAdminView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/ompc',      component: () => import('../views/admin/OMPCAdminView.vue'),    meta: { requiresAuth: true, requiresAdmin: true } },
  ],
})

router.beforeEach(to => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth  && !auth.isLoggedIn) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin)   return '/'
})

export default router
