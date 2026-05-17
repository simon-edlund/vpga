<template>
  <nav>
    <span class="brand">⛳ VPGA</span>
    <template v-if="auth.isLoggedIn">
      <router-link to="/">{{ localeStore.t('standings') }}</router-link>
      <router-link to="/rounds">{{ localeStore.t('rounds') }}</router-link>
      <router-link to="/ompc">{{ localeStore.t('ompc') }}</router-link>
    </template>
    <template v-if="auth.isLoggedIn && auth.isAdmin">
      <span class="sep">|</span>
      <router-link to="/admin/members">{{ localeStore.t('members') }}</router-link>
      <router-link to="/admin/rounds">{{ localeStore.t('rounds') }}</router-link>
      <router-link to="/admin/scores">{{ localeStore.t('enterScores') }}</router-link>
      <router-link to="/admin/events">{{ localeStore.t('events') }}</router-link>
      <router-link to="/admin/ompc">{{ localeStore.t('ompc') }}</router-link>
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
        <router-link to="/change-password" class="small-link">{{ localeStore.t('changePassword') }}</router-link>
        <button class="btn-logout" @click="logout">{{ localeStore.t('logout') }}</button>
      </template>
    </div>
  </nav>

  <main>
    <router-view />
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import { useLocaleStore } from './stores/locale.js'

const auth = useAuthStore()
const localeStore = useLocaleStore()
const router = useRouter()

auth.init()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
