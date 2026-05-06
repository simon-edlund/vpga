<template>
  <div class="login-wrap">
    <div class="card">
      <h2 class="login-title">⛳ Golf Tour</h2>
      <form @submit.prevent="doLogin">
        <div class="field">
          <label>Username</label>
          <input v-model="username" type="text" autocomplete="username" required autofocus />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" style="width:100%;margin-top:0.5rem">Log in</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const username = ref('')
const password = ref('')
const error    = ref('')
const router   = useRouter()
const auth     = useAuthStore()

async function doLogin() {
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch {
    error.value = 'Invalid username or password'
  }
}
</script>
