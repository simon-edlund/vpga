<template>
  <nav>
    <div class="nav-header">
      <span class="brand">⛳ VPGA</span>
      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="mobileMenuOpen"
        aria-label="Toggle navigation menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        ☰
      </button>
    </div>

    <div class="nav-content" :class="{ open: mobileMenuOpen }">
      <template v-if="auth.isLoggedIn">
        <router-link to="/" @click="closeMobileMenu">{{ localeStore.t('standings') }}</router-link>
        <router-link to="/rounds" @click="closeMobileMenu">{{ localeStore.t('rounds') }}</router-link>
        <router-link to="/ompc" @click="closeMobileMenu">{{ localeStore.t('ompc') }}</router-link>
        <router-link to="/calendar" @click="closeMobileMenu">{{ localeStore.t('calendar') }}</router-link>
      </template>
      <template v-if="auth.isLoggedIn && auth.isAdmin">
        <span class="sep">|</span>
        <router-link to="/admin/members" @click="closeMobileMenu">{{ localeStore.t('members') }}</router-link>
        <router-link to="/admin/rounds" @click="closeMobileMenu">{{ localeStore.t('rounds') }}</router-link>
        <router-link to="/admin/scores" @click="closeMobileMenu">{{ localeStore.t('enterScores') }}</router-link>
        <router-link to="/admin/ompc" @click="closeMobileMenu">{{ localeStore.t('ompc') }}</router-link>
      </template>
      <div class="nav-right">
        <label class="locale-picker">
          <span>{{ localeStore.t('language') }}</span>
          <select v-model="localeStore.locale">
            <option value="sv">{{ localeStore.t('swedish') }}</option>
            <option value="en">{{ localeStore.t('english') }}</option>
          </select>
        </label>
        <template v-if="auth.isLoggedIn">
          <span class="username">{{ auth.name }}</span>
          <router-link to="/change-password" class="small-link" @click="closeMobileMenu">{{ localeStore.t('changePassword') }}</router-link>
          <button class="btn-logout" @click="logout">{{ localeStore.t('logout') }}</button>
        </template>
      </div>
    </div>
  </nav>

  <main>
    <router-view />
  </main>

  <footer class="app-footer">
    <span>Version: {{ version }}</span>
  </footer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import { useLocaleStore } from './stores/locale.js'

const auth = useAuthStore()
const localeStore = useLocaleStore()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)

const version = import.meta.env.VITE_VERSION || 'unknown'

auth.init()

function logout() {
  closeMobileMenu()
  auth.logout()
  router.push('/login')
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

watch(() => route.fullPath, closeMobileMenu)
</script>

<style>
.app-footer {
  text-align: center;
  color: #888;
  font-size: 0.9em;
  margin: 2em 0 1em 0;
}
</style>
