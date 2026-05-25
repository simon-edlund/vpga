<template>
  <q-layout view="hHh lpR fFf" class="app-layout">
    <q-header elevated>
      <q-toolbar class="app-toolbar">
        <q-btn
          class="lt-md"
          flat
          dense
          no-caps
          label="☰"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        />

        <q-toolbar-title>
          <router-link to="/" class="brand-link" @click="closeMobileMenu">⛳ VPGA</router-link>
        </q-toolbar-title>

        <div v-if="auth.isLoggedIn" class="gt-sm row items-center q-gutter-sm">
          <q-btn flat no-caps :label="localeStore.t('standings')" to="/" />
          <q-btn flat no-caps :label="localeStore.t('rounds')" to="/rounds" />
          <q-btn flat no-caps :label="localeStore.t('ompc')" to="/ompc" />
          <q-btn flat no-caps :label="localeStore.t('calendar')" to="/calendar" />
        </div>

        <div v-if="auth.isLoggedIn && auth.isAdmin" class="gt-sm row items-center q-gutter-xs q-ml-sm">
          <q-separator vertical dark inset />
          <q-btn flat no-caps :label="localeStore.t('members')" to="/admin/members" />
          <q-btn flat no-caps :label="localeStore.t('rounds')" to="/admin/rounds" />
          <q-btn flat no-caps :label="localeStore.t('enterScores')" to="/admin/scores" />
          <q-btn flat no-caps :label="localeStore.t('events')" to="/admin/events" />
          <q-btn flat no-caps :label="localeStore.t('ompc')" to="/admin/ompc" />
        </div>

        <q-space />

        <div v-if="auth.isLoggedIn" class="gt-sm row items-center q-gutter-sm">
          <q-chip dense color="white" text-color="primary">{{ auth.name }}</q-chip>
          <q-btn flat no-caps :label="localeStore.t('changePassword')" to="/change-password" />
          <q-btn unelevated color="white" text-color="primary" no-caps :label="localeStore.t('logout')" @click="logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="mobileMenuOpen" side="right" overlay bordered>
      <q-list padding>
        <template v-if="auth.isLoggedIn">
          <q-item-label header>{{ auth.name }}</q-item-label>
          <q-item clickable v-ripple to="/" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('standings') }}</q-item-section></q-item>
          <q-item clickable v-ripple to="/rounds" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('rounds') }}</q-item-section></q-item>
          <q-item clickable v-ripple to="/ompc" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('ompc') }}</q-item-section></q-item>
          <q-item clickable v-ripple to="/calendar" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('calendar') }}</q-item-section></q-item>
          <q-item clickable v-ripple to="/change-password" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('changePassword') }}</q-item-section></q-item>
          <template v-if="auth.isAdmin">
            <q-separator spaced />
            <q-item clickable v-ripple to="/admin/members" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('members') }}</q-item-section></q-item>
            <q-item clickable v-ripple to="/admin/rounds" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('rounds') }}</q-item-section></q-item>
            <q-item clickable v-ripple to="/admin/scores" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('enterScores') }}</q-item-section></q-item>
            <q-item clickable v-ripple to="/admin/events" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('events') }}</q-item-section></q-item>
            <q-item clickable v-ripple to="/admin/ompc" @click="closeMobileMenu"><q-item-section>{{ localeStore.t('ompc') }}</q-item-section></q-item>
          </template>
          <q-separator spaced />
          <q-item clickable v-ripple @click="logout">
            <q-item-section>{{ localeStore.t('logout') }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <div class="app-page-shell">
        <router-view />
      </div>
    </q-page-container>

    <q-footer class="bg-transparent text-grey-7">
      <q-toolbar class="justify-center">
        <div class="footer-version">Version: {{ version }}</div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import { useLocaleStore } from './stores/locale.js'

const auth = useAuthStore()
const localeStore = useLocaleStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const version = import.meta.env.VITE_VERSION || 'unknown'

auth.init()

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function logout() {
  closeMobileMenu()
  auth.logout()
  router.push('/login')
}

watch(() => router.currentRoute.value.fullPath, closeMobileMenu)
</script>
