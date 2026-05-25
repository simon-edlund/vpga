<template>
  <div class="page-stack">
    <h1 class="page-title">{{ localeStore.t('manageRounds') }}</h1>

    <q-card flat bordered class="surface-card section-card">
      <q-card-section>
        <h2 class="card-title">{{ localeStore.t('addRound') }}</h2>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="page-stack" @submit="addRound">
          <div class="form-grid">
            <q-input v-model.number="form.season" outlined type="number" min="2000" max="2100" :label="localeStore.t('season')" required />
            <q-input v-model.number="form.round_number" outlined type="number" min="1" max="99" :label="localeStore.t('roundNumber')" required />
            <q-input v-model="form.date" outlined type="date" :label="localeStore.t('date')" required />
            <q-select v-model="form.duration" outlined :label="localeStore.t('duration')" :options="durationOptions" emit-value map-options />
            <q-input v-if="form.duration === 'timed'" v-model="form.start_time" outlined type="time" :label="localeStore.t('startTime')" required />
            <q-input v-model="form.course" outlined :label="localeStore.t('course')" required />
            <q-input v-model="form.notes" outlined :label="localeStore.t('notes')" />
          </div>
          <q-banner v-if="addError" dense rounded class="bg-red-1 text-negative">{{ addError }}</q-banner>
          <div class="form-actions">
            <q-btn type="submit" color="primary" no-caps :label="localeStore.t('addRound')" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="table-card surface-table">
      <q-card-section class="q-pa-none table-wrap">
        <q-markup-table flat separator="cell" wrap-cells>
          <thead>
            <tr>
              <th>{{ localeStore.t('season') }}</th>
              <th>{{ localeStore.t('round') }}</th>
              <th>{{ localeStore.t('date') }}</th>
              <th>{{ localeStore.t('duration') }}</th>
              <th>{{ localeStore.t('course') }}</th>
              <th>{{ localeStore.t('notes') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rounds" :key="r.id" :class="{ 'bg-blue-1': editingId === r.id }">
              <template v-if="editingId !== r.id">
                <td>{{ r.season }}</td>
                <td>VPGA{{ r.round_number }}</td>
                <td>{{ r.date }}</td>
                <td>{{ fmt(r) }}</td>
                <td>{{ r.course }}</td>
                <td class="muted-text">{{ r.notes }}</td>
                <td>
                  <div class="inline-actions">
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('edit')" @click="startEdit(r)" />
                    <q-btn dense flat no-caps color="negative" :label="localeStore.t('delete')" @click="deleteRound(r)" />
                  </div>
                </td>
              </template>
              <template v-else>
                <td><q-input v-model.number="editForm.season" dense outlined type="number" /></td>
                <td><q-input v-model.number="editForm.round_number" dense outlined type="number" /></td>
                <td><q-input v-model="editForm.date" dense outlined type="date" /></td>
                <td>
                  <div class="page-stack" style="gap: 0.5rem;">
                    <q-select v-model="editForm.duration" dense outlined :options="durationOptions" emit-value map-options />
                    <q-input v-if="editForm.duration === 'timed'" v-model="editForm.start_time" dense outlined type="time" />
                  </div>
                </td>
                <td><q-input v-model="editForm.course" dense outlined /></td>
                <td><q-input v-model="editForm.notes" dense outlined /></td>
                <td>
                  <div class="inline-actions">
                    <q-btn dense color="primary" no-caps :label="localeStore.t('save')" @click="saveEdit" />
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('cancel')" @click="editingId = null" />
                  </div>
                </td>
              </template>
            </tr>
            <tr v-if="rounds.length === 0">
              <td colspan="7" class="text-center text-grey-5">{{ localeStore.t('noRoundsYet') }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'
import { deriveDuration, formatDuration, buildDurationPayload } from '../../utils/duration.js'

const rounds = ref([])
const addError = ref('')
const localeStore = useLocaleStore()
const editingId = ref(null)
const editForm = ref({})
const form = ref({
  season: new Date().getFullYear(),
  round_number: 1,
  date: '',
  duration: '1day',
  start_time: '',
  course: '',
  notes: '',
})

const durationOptions = computed(() => [
  { label: localeStore.t('duration1Day'), value: '1day' },
  { label: localeStore.t('duration2Days'), value: '2days' },
  { label: localeStore.t('durationTimed'), value: 'timed' },
])

const fmt = r => formatDuration(r, localeStore.t)

function buildPayload(formData) {
  return {
    season: formData.season,
    round_number: formData.round_number,
    date: formData.date,
    course: formData.course,
    notes: formData.notes,
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
    form.value.round_number += 1
    form.value.date = ''
    form.value.duration = '1day'
    form.value.start_time = ''
    form.value.course = ''
    form.value.notes = ''
    await load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingRound')
  }
}

async function deleteRound(r) {
  if (!window.confirm(localeStore.t('deleteRoundConfirm', { round: r.round_number, date: r.date }))) return
  await api.delete(`/api/rounds/${r.id}`)
  await load()
}

function startEdit(r) {
  editingId.value = r.id
  editForm.value = {
    season: r.season,
    round_number: r.round_number,
    date: r.date,
    duration: deriveDuration(r),
    start_time: r.start_time || '',
    course: r.course,
    notes: r.notes || '',
  }
}

async function saveEdit() {
  await api.put(`/api/rounds/${editingId.value}`, buildPayload(editForm.value))
  editingId.value = null
  await load()
}

onMounted(load)
</script>
