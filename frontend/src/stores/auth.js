import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token    = ref(localStorage.getItem('token'))
  const username = ref(localStorage.getItem('username'))
  const isAdmin  = ref(localStorage.getItem('is_admin') === 'true')

  const isLoggedIn = computed(() => !!token.value)

  function init() {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  async function login(user, password) {
    const res = await api.post('/api/auth/login', { username: user, password })
    token.value    = res.data.token
    username.value = res.data.username
    isAdmin.value  = !!res.data.is_admin
    localStorage.setItem('token',    token.value)
    localStorage.setItem('username', username.value)
    localStorage.setItem('is_admin', isAdmin.value)
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  function logout() {
    token.value    = null
    username.value = null
    isAdmin.value  = false
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('is_admin')
    delete api.defaults.headers.common['Authorization']
  }

  return { token, username, isAdmin, isLoggedIn, init, login, logout }
})
