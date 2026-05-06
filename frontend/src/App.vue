<template>
  <nav v-if="auth.isLoggedIn">
    <span class="brand">⛳ Golf Tour</span>
    <router-link to="/">Standings</router-link>
    <router-link to="/rounds">Rounds</router-link>
    <template v-if="auth.isAdmin">
      <span class="sep">|</span>
      <router-link to="/admin/members">Members</router-link>
      <router-link to="/admin/rounds">Rounds</router-link>
      <router-link to="/admin/scores">Enter Scores</router-link>
    </template>
    <div class="nav-right">
      <span class="username">{{ auth.username }}</span>
      <router-link to="/change-password" class="small-link">Change password</router-link>
      <button class="btn-logout" @click="logout">Log out</button>
    </div>
  </nav>

  <main>
    <router-view />
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

auth.init()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
