<template>
  <div class="login-wrap">
    <div class="card">
      <h2 class="login-title">⛳ VPGA</h2>
      <form v-if="!setupToken" @submit.prevent="doLogin">
        <div class="field">
          <label>{{ localeStore.t('email') }}</label>
          <input v-model="email" type="email" autocomplete="username" required autofocus />
        </div>
        <div class="field">
          <label>{{ localeStore.t('password') }}</label>
          <input v-model="password" type="password" autocomplete="current-password" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <p class="legend">{{ localeStore.t('firstLoginHelp') }}</p>
        <button type="submit" style="width:100%;margin-top:0.5rem">{{ localeStore.t('continue') }}</button>
      </form>
      <form v-else @submit.prevent="completeSetup">
        <p style="margin-bottom:1rem">{{ localeStore.t('firstLoginVerified', { email: setupEmail }) }}</p>
        <div class="field">
          <label>{{ localeStore.t('newPassword') }}</label>
          <input v-model="newPassword1" type="password" minlength="6" required autofocus />
        </div>
        <div class="field">
          <label>{{ localeStore.t('repeatPassword') }}</label>
          <input v-model="newPassword2" type="password" minlength="6" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" style="width:100%;margin-top:0.5rem">{{ localeStore.t('setPassword') }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useLocaleStore } from '../stores/locale.js'

const email = ref('')
const password = ref('')
const newPassword1 = ref('')
const newPassword2 = ref('')
const setupToken = ref('')
const setupEmail = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()
const localeStore = useLocaleStore()

async function doLogin() {
  error.value = ''
  try {
    const result = await auth.login(email.value, password.value)
    if (result.first_login) {
      setupToken.value = result.setup_token
      setupEmail.value = result.email
      password.value = ''
      return
    }
    router.push('/')
  } catch {
    error.value = localeStore.t('invalidEmailOrPassword')
  }
}

async function completeSetup() {
  error.value = ''
  if (newPassword1.value !== newPassword2.value) {
    error.value = localeStore.t('passwordsDoNotMatch')
    return
  }
  try {
    await auth.completeFirstLogin(setupToken.value, newPassword1.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || localeStore.t('couldNotCompleteFirstLogin')
  }
}
</script>
