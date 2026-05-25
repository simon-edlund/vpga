<template>
  <div class="login-wrap">
    <q-card flat bordered class="surface-card">
      <q-card-section class="text-center q-pb-none">
        <h2 class="card-title">⛳ VPGA</h2>
      </q-card-section>

      <q-card-section>
        <q-form v-if="!setupToken" class="page-stack" @submit="doLogin">
          <q-input
            v-model="email"
            type="email"
            :label="localeStore.t('email')"
            autocomplete="username"
            outlined
            autofocus
            lazy-rules
            :rules="[value => !!value || localeStore.t('email')]"
          />
          <q-input
            v-model="password"
            type="password"
            :label="localeStore.t('password')"
            autocomplete="current-password"
            outlined
          />
          <q-banner v-if="error" dense rounded class="bg-red-1 text-negative">{{ error }}</q-banner>
          <p class="legend">{{ localeStore.t('firstLoginHelp') }}</p>
          <q-btn type="submit" color="primary" no-caps class="full-width" :label="localeStore.t('continue')" />
        </q-form>

        <q-form v-else class="page-stack" @submit="completeSetup">
          <q-banner dense rounded class="bg-green-1 text-primary">
            {{ localeStore.t('firstLoginVerified', { email: setupEmail }) }}
          </q-banner>
          <q-input
            v-model="newPassword1"
            type="password"
            :label="localeStore.t('newPassword')"
            outlined
            minlength="6"
            autofocus
          />
          <q-input
            v-model="newPassword2"
            type="password"
            :label="localeStore.t('repeatPassword')"
            outlined
            minlength="6"
          />
          <q-banner v-if="error" dense rounded class="bg-red-1 text-negative">{{ error }}</q-banner>
          <q-btn type="submit" color="primary" no-caps class="full-width" :label="localeStore.t('setPassword')" />
        </q-form>
      </q-card-section>
    </q-card>
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
