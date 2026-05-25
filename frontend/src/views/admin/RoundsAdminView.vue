<template>
  <div>
    <h2>{{ localeStore.t('manageRounds') }}</h2>

    <div class="card">
      <h3>{{ localeStore.t('addRound') }}</h3>
      <form @submit.prevent="addRound">
        <div class="row-gap">
          <label>
            {{ localeStore.t('season') }}
            <input v-model.number="form.season" type="number" min="2000" max="2100" style="width:90px" required />
          </label>
          <label>
            {{ localeStore.t('roundNumber') }}
            <input v-model.number="form.round_number" type="number" min="1" max="99" style="width:70px" required />
          </label>
          <label>
            {{ localeStore.t('date') }}
            <input v-model="form.date" type="date" lang="sv" required />
          </label>
          <label>
            {{ localeStore.t('duration') }}
            <select v-model="form.duration" style="width:130px">
              <option value="1day">{{ localeStore.t('duration1Day') }}</option>
              <option value="2days">{{ localeStore.t('duration2Days') }}</option>
              <option value="timed">{{ localeStore.t('durationTimed') }}</option>
            </select>
          </label>
          <label v-if="form.duration === 'timed'">
            {{ localeStore.t('startTime') }}
            <input v-model="form.start_time" type="time" lang="sv" style="width:110px" required />
          </label>
          <label>
            {{ localeStore.t('course') }}
            <input v-model="form.course" type="text" required style="min-width:180px" />
          </label>
          <label>
            {{ localeStore.t('description') }}
            <input v-model="form.description" type="text" style="min-width:180px" />
          </label>
          <label>
            {{ localeStore.t('notes') }}
            <input v-model="form.notes" type="text" style="min-width:180px" />
          </label>
        </div>
        <p v-if="addError" class="error">{{ addError }}</p>
        <button type="submit">{{ localeStore.t('addRound') }}</button>
      </form>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{ localeStore.t('season') }}</th>
          <th>{{ localeStore.t('round') }}</th>
          <th>{{ localeStore.t('date') }}</th>
          <th>{{ localeStore.t('duration') }}</th>
          <th>{{ localeStore.t('course') }}</th>
          <th>{{ localeStore.t('description') }}</th>
          <th>{{ localeStore.t('notes') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="r in rounds" :key="r.id">
          <!-- view row -->
          <tr v-if="editingId !== r.id">
            <td>{{ r.season }}</td>
            <td>VPGA{{ r.round_number }}</td>
            <td>{{ r.date }}</td>
            <td>{{ fmt(r) }}</td>
            <td>{{ r.course }}</td>
            <td style="color:#6b7280;font-size:0.88rem">{{ r.description || r.notes }}</td>
            <td style="color:#6b7280;font-size:0.88rem">{{ r.notes }}</td>
            <td style="white-space:nowrap">
              <button class="sm" @click="startEdit(r)" style="margin-right:4px">{{ localeStore.t('edit') }}</button>
              <button class="sm danger" @click="deleteRound(r)">{{ localeStore.t('delete') }}</button>
            </td>
          </tr>
          <!-- inline edit row -->
          <tr v-else style="background:#f0f9ff">
            <td><input v-model.number="editForm.season" type="number" style="width:70px" /></td>
            <td><input v-model.number="editForm.round_number" type="number" style="width:55px" /></td>
            <td><input v-model="editForm.date" type="date" lang="sv" /></td>
            <td>
              <select v-model="editForm.duration" style="width:120px">
                <option value="1day">{{ localeStore.t('duration1Day') }}</option>
                <option value="2days">{{ localeStore.t('duration2Days') }}</option>
                <option value="timed">{{ localeStore.t('durationTimed') }}</option>
              </select>
              <input v-if="editForm.duration === 'timed'" v-model="editForm.start_time" type="time" lang="sv" style="width:100px;margin-left:4px" required />
            </td>
            <td><input v-model="editForm.course" type="text" style="min-width:130px" /></td>
            <td><input v-model="editForm.description" type="text" style="min-width:130px" /></td>
            <td><input v-model="editForm.notes" type="text" style="min-width:130px" /></td>
            <td style="white-space:nowrap">
              <button class="sm" @click="saveEdit" style="margin-right:4px">{{ localeStore.t('save') }}</button>
              <button class="sm" @click="editingId = null">{{ localeStore.t('cancel') }}</button>
            </td>
          </tr>
        </template>
        <tr v-if="rounds.length === 0">
          <td colspan="8" style="color:#9ca3af;text-align:center">{{ localeStore.t('noRoundsYet') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'
import { addOneDay, deriveDuration, formatDuration, buildDurationPayload } from '../../utils/duration.js'

const rounds   = ref([])
const addError = ref('')
const localeStore = useLocaleStore()
const editingId = ref(null)
const editForm  = ref({})
const form     = ref({
  season:       new Date().getFullYear(),
  round_number: 1,
  date:         '',
  duration:     '1day',
  start_time:   '',
  course:       '',
  description:  '',
  notes:        '',
})

const fmt = (r) => formatDuration(r, localeStore.t)

function buildPayload(formData) {
  return {
    season:       formData.season,
    round_number: formData.round_number,
    date:         formData.date,
    course:       formData.course,
    description:  formData.description,
    notes:        formData.notes,
    ...buildDurationPayload(formData),
  }
}

async function load() {
  const res = await api.get('/api/rounds')
  rounds.value = res.data
}

async function addRound() {
  addError.value = ''
  try {
    await api.post('/api/rounds', buildPayload(form.value))
    form.value.round_number++
    form.value.date = ''
    form.value.duration = '1day'
    form.value.start_time = ''
    form.value.course = ''
    form.value.description = ''
    form.value.notes = ''
    load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingRound')
  }
}

async function deleteRound(r) {
  if (!confirm(localeStore.t('deleteRoundConfirm', { round: r.round_number, date: r.date }))) return
  await api.delete(`/api/rounds/${r.id}`)
  load()
}

function startEdit(r) {
  editingId.value = r.id
  editForm.value = {
    season:       r.season,
    round_number: r.round_number,
    date:         r.date,
    duration:     deriveDuration(r),
    start_time:   r.start_time || '',
    course:       r.course,
    description:  r.description || r.notes || '',
    notes:        r.notes || '',
  }
}

async function saveEdit() {
  await api.put(`/api/rounds/${editingId.value}`, buildPayload(editForm.value))
  editingId.value = null
  load()
}

onMounted(load)
</script>
