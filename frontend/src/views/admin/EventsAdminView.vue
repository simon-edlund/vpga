<template>
  <div class="page-stack">
    <h1 class="page-title">{{ localeStore.t('events') }}</h1>

    <q-card flat bordered class="surface-card section-card">
      <q-card-section>
        <h2 class="card-title">{{ localeStore.t('addEvent') }}</h2>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="page-stack" @submit="addEvent">
          <div class="form-grid">
            <q-input v-model="form.title" outlined :label="localeStore.t('eventTitle')" required />
            <q-input v-model="form.date" outlined type="date" :label="localeStore.t('date')" required />
            <q-select v-model="form.duration" outlined :label="localeStore.t('duration')" :options="durationOptions" emit-value map-options />
            <q-input v-if="form.duration === 'timed'" v-model="form.start_time" outlined type="time" :label="localeStore.t('startTime')" required />
            <q-input v-model="form.notes" outlined :label="localeStore.t('notes')" />
          </div>
          <q-banner v-if="addError" dense rounded class="bg-red-1 text-negative">{{ addError }}</q-banner>
          <div class="form-actions">
            <q-btn type="submit" color="primary" no-caps :label="localeStore.t('addEvent')" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="table-card surface-table">
      <q-card-section class="q-pa-none table-wrap">
        <q-markup-table flat separator="cell" wrap-cells>
          <thead>
            <tr>
              <th>{{ localeStore.t('eventTitle') }}</th>
              <th>{{ localeStore.t('date') }}</th>
              <th>{{ localeStore.t('duration') }}</th>
              <th>{{ localeStore.t('notes') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev.id" :class="{ 'bg-blue-1': editingId === ev.id }">
              <template v-if="editingId !== ev.id">
                <td>{{ ev.title }}</td>
                <td>{{ ev.date }}</td>
                <td>{{ fmt(ev) }}</td>
                <td class="muted-text">{{ ev.notes }}</td>
                <td>
                  <div class="inline-actions">
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('edit')" @click="startEdit(ev)" />
                    <q-btn dense flat no-caps color="negative" :label="localeStore.t('delete')" @click="deleteEvent(ev)" />
                  </div>
                </td>
              </template>
              <template v-else>
                <td><q-input v-model="editForm.title" dense outlined /></td>
                <td><q-input v-model="editForm.date" dense outlined type="date" /></td>
                <td>
                  <div class="page-stack" style="gap: 0.5rem;">
                    <q-select v-model="editForm.duration" dense outlined :options="durationOptions" emit-value map-options />
                    <q-input v-if="editForm.duration === 'timed'" v-model="editForm.start_time" dense outlined type="time" />
                  </div>
                </td>
                <td><q-input v-model="editForm.notes" dense outlined /></td>
                <td>
                  <div class="inline-actions">
                    <q-btn dense color="primary" no-caps :label="localeStore.t('save')" @click="saveEdit" />
                    <q-btn dense flat no-caps color="secondary" :label="localeStore.t('cancel')" @click="editingId = null" />
                  </div>
                </td>
              </template>
            </tr>
            <tr v-if="events.length === 0">
              <td colspan="5" class="text-center text-grey-5">{{ localeStore.t('noEventsYet') }}</td>
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

const events = ref([])
const addError = ref('')
const localeStore = useLocaleStore()
const editingId = ref(null)
const editForm = ref({})
const form = ref({
  title: '',
  date: '',
  duration: '1day',
  start_time: '',
  notes: '',
})

const durationOptions = computed(() => [
  { label: localeStore.t('duration1Day'), value: '1day' },
  { label: localeStore.t('duration2Days'), value: '2days' },
  { label: localeStore.t('durationTimed'), value: 'timed' },
])

function buildPayload(formData) {
  return {
    title: formData.title,
    date: formData.date,
    notes: formData.notes,
    ...buildDurationPayload(formData),
  }
}

const fmt = ev => formatDuration(ev, localeStore.t)

async function load() {
  const res = await api.get('/api/events')
  events.value = res.data
}

async function addEvent() {
  addError.value = ''
  try {
    await api.post('/api/events', buildPayload(form.value))
    form.value = { title: '', date: '', duration: '1day', start_time: '', notes: '' }
    await load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingEvent')
  }
}

async function deleteEvent(ev) {
  if (!window.confirm(localeStore.t('deleteEventConfirm', { title: ev.title }))) return
  await api.delete(`/api/events/${ev.id}`)
  await load()
}

function startEdit(ev) {
  editingId.value = ev.id
  editForm.value = {
    title: ev.title,
    date: ev.date,
    duration: deriveDuration(ev),
    start_time: ev.start_time || '',
    notes: ev.notes || '',
  }
}

async function saveEdit() {
  await api.put(`/api/events/${editingId.value}`, buildPayload(editForm.value))
  editingId.value = null
  await load()
}

onMounted(load)
</script>
