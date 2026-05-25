<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ localeStore.t('members') }}</h1>
      </div>
      <q-btn color="secondary" no-caps :label="localeStore.t('hcpUpdateAll')" @click="updateAllHcp" />
    </div>

    <q-card flat bordered class="surface-card section-card">
      <q-card-section>
        <h2 class="card-title">{{ localeStore.t('addMember') }}</h2>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="page-stack" @submit="addMember">
          <div class="form-grid">
            <q-input v-model="newName" outlined :label="localeStore.t('name')" :placeholder="localeStore.t('fullName')" required />
            <q-input v-model="newGolfId" outlined :label="localeStore.t('golfId')" placeholder="yymmdd-nnn" />
            <q-input v-model="newHandicap" outlined type="number" step="0.1" :label="localeStore.t('handicap')" />
            <q-input v-model="newEmail" outlined type="email" :label="localeStore.t('email')" placeholder="name@example.com" required />
          </div>
          <div class="form-actions">
            <q-btn type="submit" color="primary" no-caps :label="localeStore.t('addMember')" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="table-card surface-table">
      <q-card-section class="q-pa-none table-wrap">
        <q-markup-table flat separator="cell" wrap-cells>
          <thead>
            <tr>
              <th>{{ localeStore.t('name') }}</th>
              <th>{{ localeStore.t('golfId') }}</th>
              <th>{{ localeStore.t('handicap') }}</th>
              <th>{{ localeStore.t('email') }}</th>
              <th class="text-center">{{ localeStore.t('admin') }}</th>
              <th class="text-center">{{ localeStore.t('verified') }}</th>
              <th class="text-center">{{ localeStore.t('active') }}</th>
              <th class="text-center" :title="localeStore.t('hcpStatus')">HCP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id">
              <td>
                <span v-if="editingId !== m.id">{{ m.name }}</span>
                <q-input v-else v-model="editMember.name" dense outlined />
              </td>
              <td>
                <span v-if="editingId !== m.id">{{ m.golf_id }}</span>
                <q-input v-else v-model="editMember.golf_id" dense outlined />
              </td>
              <td>
                <span v-if="editingId !== m.id">{{ Number(m.handicap).toFixed(1) }}</span>
                <q-input v-else v-model="editMember.handicap" dense outlined type="number" step="0.1" />
              </td>
              <td>
                <span v-if="editingId !== m.id">{{ m.email }}</span>
                <q-input v-else v-model="editMember.email" dense outlined type="email" />
              </td>
              <td class="text-center">
                <q-checkbox
                  :model-value="!!(editingId === m.id ? editMember.is_admin : m.is_admin)"
                  :disable="editingId !== m.id"
                  @update:model-value="value => editingId === m.id && (editMember.is_admin = value)"
                />
              </td>
              <td class="text-center">{{ m.email_verified ? localeStore.t('yes') : localeStore.t('no') }}</td>
              <td class="text-center">
                <q-checkbox
                  :model-value="!!(editingId === m.id ? editMember.active : m.active)"
                  :disable="editingId !== m.id"
                  @update:model-value="value => editingId === m.id && (editMember.active = value)"
                />
              </td>
              <td class="text-center">
                <q-chip dense :color="hcpStatusColor(m)" text-color="white" :label="hcpStatusIcon(m)" :title="hcpStatusTitle(m)" />
              </td>
              <td>
                <div class="inline-actions">
                  <template v-if="editingId === m.id">
                    <q-btn dense color="primary" no-caps :label="localeStore.t('save')" @click="saveMember(m)" />
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('cancel')" @click="editingId = null" />
                  </template>
                  <template v-else>
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('edit')" @click="startEdit(m)" />
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('resetLogin')" @click="resetLogin(m)" />
                    <q-btn dense flat no-caps color="secondary" :disable="updatingHcp.has(m.id)" :label="localeStore.t('hcpUpdate')" @click="updateHcp(m)" />
                    <q-btn dense flat no-caps color="negative" :label="localeStore.t('delete')" @click="deleteMember(m)" />
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'

const members = ref([])
const newName = ref('')
const newGolfId = ref('')
const newHandicap = ref(0)
const newEmail = ref('')
const editingId = ref(null)
const editMember = ref(null)
const updatingHcp = ref(new Set())
const localeStore = useLocaleStore()
let hcpPollInterval = null

onBeforeUnmount(() => {
  if (hcpPollInterval) {
    clearInterval(hcpPollInterval)
    hcpPollInterval = null
  }
})

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
  await load()
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
  await load()
}

async function deleteMember(m) {
  if (!window.confirm(localeStore.t('deleteMemberConfirm', { name: m.name }))) return
  await api.delete(`/api/members/${m.id}`)
  await load()
}

async function resetLogin(m) {
  if (!window.confirm(localeStore.t('resetLoginConfirm', { name: m.name }))) return
  await api.post(`/api/members/${m.id}/reset-login`)
  await load()
}

async function updateHcp(m) {
  updatingHcp.value = new Set([...updatingHcp.value, m.id])
  try {
    const res = await api.post(`/api/members/${m.id}/update-hcp`)
    members.value = members.value.map(x => (x.id === m.id ? res.data : x))
  } catch {
    await load()
  } finally {
    const next = new Set(updatingHcp.value)
    next.delete(m.id)
    updatingHcp.value = next
  }
}

async function updateAllHcp() {
  if (!window.confirm(localeStore.t('hcpUpdateAllConfirm'))) return
  await api.post('/api/members/update-hcp-all')
  if (hcpPollInterval) clearInterval(hcpPollInterval)
  let attempts = 0
  const maxAttempts = 12
  hcpPollInterval = setInterval(async () => {
    attempts += 1
    await load()
    if (attempts >= maxAttempts) {
      clearInterval(hcpPollInterval)
      hcpPollInterval = null
    }
  }, 5000)
}

function hcpStatusIcon(m) {
  if (!m.hcp_last_update_status) return '—'
  if (m.hcp_last_update_status === 'ok') return 'OK'
  return 'ERR'
}

function hcpStatusColor(m) {
  if (!m.hcp_last_update_status) return 'grey-5'
  return m.hcp_last_update_status === 'ok' ? 'positive' : 'negative'
}

function hcpStatusTitle(m) {
  if (!m.hcp_last_update_status) return localeStore.t('hcpStatusNever')
  const label = m.hcp_last_update_status === 'ok' ? localeStore.t('hcpStatusOk') : localeStore.t('hcpStatusError')
  return m.hcp_last_updated_at ? `${label} – ${new Date(m.hcp_last_updated_at).toLocaleString()}` : label
}

onMounted(load)
</script>
