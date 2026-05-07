<template>
  <div>
    <h2>{{ localeStore.t('members') }}</h2>

    <div class="card">
      <h3>{{ localeStore.t('addMember') }}</h3>
      <form @submit.prevent="addMember" class="row-gap">
        <label>
          {{ localeStore.t('name') }}
          <input v-model="newName" type="text" :placeholder="localeStore.t('fullName')" required style="min-width:220px" />
        </label>
        <label>
          {{ localeStore.t('golfId') }}
          <input v-model="newGolfId" type="text" placeholder="yymmdd-nnn" style="min-width:140px" />
        </label>
        <label>
          {{ localeStore.t('handicap') }}
          <input v-model="newHandicap" type="number" step="0.1" style="width:110px" />
        </label>
        <label>
          {{ localeStore.t('email') }}
          <input v-model="newEmail" type="email" placeholder="name@example.com" required style="min-width:220px" />
        </label>
        <button type="submit">{{ localeStore.t('addMember') }}</button>
      </form>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{ localeStore.t('name') }}</th>
          <th>{{ localeStore.t('golfId') }}</th>
          <th>{{ localeStore.t('handicap') }}</th>
          <th>{{ localeStore.t('email') }}</th>
          <th style="text-align:center">{{ localeStore.t('admin') }}</th>
          <th style="text-align:center">{{ localeStore.t('verified') }}</th>
          <th style="text-align:center">{{ localeStore.t('active') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in members" :key="m.id">
          <td>
            <span v-if="editingId !== m.id">{{ m.name }}</span>
            <input v-else v-model="editMember.name" type="text" style="width:200px" />
          </td>
          <td>
            <span v-if="editingId !== m.id">{{ m.golf_id }}</span>
            <input v-else v-model="editMember.golf_id" type="text" style="width:120px" />
          </td>
          <td>
            <span v-if="editingId !== m.id">{{ Number(m.handicap).toFixed(1) }}</span>
            <input v-else v-model="editMember.handicap" type="number" step="0.1" style="width:80px" />
          </td>
          <td>
            <span v-if="editingId !== m.id">{{ m.email }}</span>
            <input v-else v-model="editMember.email" type="email" style="width:220px" />
          </td>
          <td style="text-align:center">
            <input
              type="checkbox"
              :checked="!!(editingId === m.id ? editMember.is_admin : m.is_admin)"
              :disabled="editingId !== m.id"
              @change="editingId === m.id && (editMember.is_admin = $event.target.checked)"
            />
          </td>
          <td style="text-align:center">{{ m.email_verified ? localeStore.t('yes') : localeStore.t('no') }}</td>
          <td style="text-align:center">
            <input
              type="checkbox"
              :checked="!!(editingId === m.id ? editMember.active : m.active)"
              :disabled="editingId !== m.id"
              @change="editingId === m.id && (editMember.active = $event.target.checked)"
            />
          </td>
          <td style="display:flex;gap:0.5rem">
            <template v-if="editingId === m.id">
              <button class="sm" @click="saveMember(m)">{{ localeStore.t('save') }}</button>
              <button class="sm secondary" @click="editingId = null">{{ localeStore.t('cancel') }}</button>
            </template>
            <template v-else>
              <button class="sm" @click="startEdit(m)">{{ localeStore.t('edit') }}</button>
              <button class="sm danger" @click="deleteMember(m)">{{ localeStore.t('delete') }}</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'

const members = ref([])
const newName = ref('')
const newGolfId = ref('')
const newHandicap = ref(0)
const newEmail = ref('')
const editingId = ref(null)
const editMember = ref(null)
const localeStore = useLocaleStore()

async function load() {
  const res = await api.get('/api/members')
  members.value = res.data
}

async function addMember() {
  await api.post('/api/members', {
    name: newName.value,
    golf_id: newGolfId.value,
    handicap: newHandicap.value,
    email: newEmail.value,
  })
  newName.value = ''
  newGolfId.value = ''
  newHandicap.value = 0
  newEmail.value = ''
  load()
}

function startEdit(m) {
  editingId.value = m.id
  editMember.value = {
    name: m.name,
    golf_id: m.golf_id,
    handicap: m.handicap,
    email: m.email,
    active: !!m.active,
    is_admin: !!m.is_admin,
  }
}

async function saveMember(m) {
  await api.put(`/api/members/${m.id}`, editMember.value)
  editingId.value = null
  editMember.value = null
  load()
}

async function deleteMember(m) {
  if (!confirm(localeStore.t('deleteMemberConfirm', { name: m.name }))) return
  await api.delete(`/api/members/${m.id}`)
  load()
}

onMounted(load)
</script>
