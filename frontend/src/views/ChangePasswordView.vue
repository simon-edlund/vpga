<template>
  <div class="page-stack">
    <q-card flat bordered class="surface-card" style="max-width: 420px;">
      <q-card-section>
        <h2 class="card-title">{{ localeStore.t('changePassword') }}</h2>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="page-stack" @submit="submit">
          <q-input v-model="form.old" type="password" outlined :label="localeStore.t('currentPassword')" required />
          <q-input v-model="form.new1" type="password" outlined :label="localeStore.t('newPassword')" minlength="6" required />
          <q-input v-model="form.new2" type="password" outlined :label="localeStore.t('repeatNewPassword')" required />
          <q-banner v-if="error" dense rounded class="bg-red-1 text-negative">{{ error }}</q-banner>
          <q-banner v-if="success" dense rounded class="bg-green-1 text-positive">{{ localeStore.t('passwordChanged') }}</q-banner>
          <div class="form-actions">
            <q-btn type="submit" color="primary" no-caps :label="localeStore.t('save')" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'

const form = ref({ old: '', new1: '', new2: '' })
const error = ref('')
const success = ref(false)
const localeStore = useLocaleStore()

async function submit() {
  error.value = ''
  success.value = false
  if (form.value.new1 !== form.value.new2) {
    error.value = localeStore.t('passwordsDoNotMatch')
    return
  }
  try {
    await api.post('/api/auth/change-password', {
      old_password: form.value.old,
      new_password: form.value.new1,
    })
    success.value = true
    form.value = { old: '', new1: '', new2: '' }
  } catch (e) {
    error.value = e.response?.data?.error || localeStore.t('errorChangingPassword')
  }
}
</script>
