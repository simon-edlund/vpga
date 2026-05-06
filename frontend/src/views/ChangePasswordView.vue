<template>
  <div>
    <div class="card" style="max-width:380px">
      <h2>Change Password</h2>
      <form @submit.prevent="submit">
        <div class="field">
          <label>Current password</label>
          <input v-model="form.old" type="password" required />
        </div>
        <div class="field">
          <label>New password</label>
          <input v-model="form.new1" type="password" minlength="6" required />
        </div>
        <div class="field">
          <label>Repeat new password</label>
          <input v-model="form.new2" type="password" required />
        </div>
        <p v-if="error"   class="error">{{ error }}</p>
        <p v-if="success" class="success">Password changed!</p>
        <button type="submit">Save</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../api/index.js'

const form    = ref({ old: '', new1: '', new2: '' })
const error   = ref('')
const success = ref(false)

async function submit() {
  error.value   = ''
  success.value = false
  if (form.value.new1 !== form.value.new2) {
    error.value = 'New passwords do not match'
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
    error.value = e.response?.data?.error || 'Error changing password'
  }
}
</script>
