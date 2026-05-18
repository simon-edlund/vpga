import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const name = ref(localStorage.getItem('name'))
  const email = ref(localStorage.getItem('email'))
  const isAdmin = ref(localStorage.getItem('is_admin') === 'true')
  let devLoginPromise = null

  const isLoggedIn = computed(() => !!token.value)

  function applyLoginResponse(data) {
    token.value = data.token
    name.value = data.name
    email.value = data.email
    isAdmin.value = !!data.is_admin
    localStorage.setItem('token', token.value)
    localStorage.setItem('name', name.value)
    localStorage.setItem('email', email.value)
    localStorage.setItem('is_admin', isAdmin.value)
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function init() {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      return
    }

    if (import.meta.env.DEV && !devLoginPromise) {
      devLoginPromise = api.post('/api/auth/dev-login')
        .then(res => {
          if (res.data.token) {
            applyLoginResponse(res.data)
          }
        })
        .catch(() => {})
        .finally(() => {
          devLoginPromise = null
        })
    }

    await devLoginPromise
  }

  async function login(userEmail, password) {
    const res = await api.post('/api/auth/login', { email: userEmail, password })
    if (res.data.token) {
      applyLoginResponse(res.data)
    }
    return res.data
  }

  async function completeFirstLogin(setupToken, password) {
    const res = await api.post('/api/auth/complete-first-login', {
      setup_token: setupToken,
      password,
    })
    applyLoginResponse(res.data)
    return res.data
  }

  async function requestPasswordSetup(userEmail) {
    const res = await api.post('/api/auth/request-password-setup', { email: userEmail })
    return res.data
  }

  function logout() {
    token.value = null
    name.value = null
    email.value = null
    isAdmin.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    localStorage.removeItem('is_admin')
    delete api.defaults.headers.common['Authorization']
  }

  return {
    token,
    name,
    email,
    isAdmin,
    isLoggedIn,
    init,
    login,
    completeFirstLogin,
    requestPasswordSetup,
    logout,
  }
})
