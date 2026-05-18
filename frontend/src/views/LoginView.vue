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
        <p v-if="success" class="success">{{ success }}</p>
        <p class="legend">{{ localeStore.t('firstLoginHelp') }}</p>
        <button type="submit" style="width:100%;margin-top:0.5rem">{{ localeStore.t('continue') }}</button>
        <button type="button" class="secondary" style="width:100%;margin-top:0.5rem" @click="forgotPassword">
          {{ localeStore.t('forgotPassword') }}
        </button>
      </form>
      <form v-else @submit.prevent="completeSetup">
        <p style="margin-bottom:1rem">{{ localeStore.t('passwordSetupFromEmail') }}</p>
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
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useLocaleStore } from '../stores/locale.js'

const email = ref('')
const password = ref('')
const newPassword1 = ref('')
const newPassword2 = ref('')
const setupToken = ref('')
const error = ref('')
const success = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const localeStore = useLocaleStore()

watch(
  () => route.query.setup_token,
  setupTokenQuery => {
    setupToken.value = typeof setupTokenQuery === 'string' ? setupTokenQuery : ''
  },
  { immediate: true }
)

async function doLogin() {
  error.value = ''
  success.value = ''
  try {
    const result = await auth.login(email.value, password.value)
    if (result.first_login) {
      password.value = ''
      success.value = localeStore.t('firstLoginEmailSent', { email: result.email })
      return
    }
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || localeStore.t('invalidEmailOrPassword')
  }
}

async function completeSetup() {
  error.value = ''
  success.value = ''
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

async function forgotPassword() {
  error.value = ''
  success.value = ''
  if (!email.value.trim()) {
    error.value = localeStore.t('enterEmailFirst')
    return
  }

  try {
    await auth.requestPasswordSetup(email.value)
    success.value = localeStore.t('passwordResetEmailSent')
  } catch (err) {
    error.value = err.response?.data?.error || localeStore.t('couldNotSendPasswordResetEmail')
  }
}
</script>
