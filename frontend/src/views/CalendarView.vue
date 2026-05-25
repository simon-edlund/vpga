<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ localeStore.t('calendar') }}</h1>
      </div>
      <div class="controls-row">
        <q-select
          v-model="selectedYear"
          outlined
          dense
          :label="localeStore.t('season')"
          :options="years"
          style="min-width: 140px;"
          @update:model-value="filterEvents"
        />
        <q-btn
          flat
          no-caps
          color="secondary"
          :href="icalUrl"
          target="_blank"
          rel="noopener"
          :label="`📅 ${localeStore.t('subscribeCalendar')}`"
        />
      </div>
    </div>

    <q-card v-if="auth.isAdmin" flat bordered class="surface-card section-card">
      <q-card-section>
        <h2 class="card-title">{{ localeStore.t('addEvent') }}</h2>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="page-stack" @submit="editing ? saveEdit() : addEvent()">
          <div class="form-grid">
            <q-input v-model="form.title" outlined :label="localeStore.t('eventTitle')" required />
            <q-input v-model="form.date" outlined type="date" :label="localeStore.t('date')" required />
            <q-select v-model="form.duration" outlined :label="localeStore.t('duration')" :options="durationOptions" emit-value map-options />
            <q-input v-if="form.duration === 'timed'" v-model="form.start_time" outlined type="time" :label="localeStore.t('startTime')" required />
            <q-input v-model="form.notes" outlined :label="localeStore.t('notes')" />
          </div>
          <q-banner v-if="addError" dense rounded class="bg-red-1 text-negative">{{ addError }}</q-banner>
          <div class="form-actions">
            <q-btn type="submit" color="primary" no-caps :label="editing ? localeStore.t('save') : localeStore.t('addEvent')" />
            <q-btn v-if="editing" flat no-caps color="secondary" :label="localeStore.t('cancel')" @click="cancelEdit" />
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
              <th v-if="auth.isAdmin">{{ localeStore.t('edit') }}/{{ localeStore.t('delete') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in filteredEvents" :key="ev.id">
              <td>{{ ev.title }}</td>
              <td>{{ ev.date }}</td>
              <td>{{ fmt(ev) }}</td>
              <td class="muted-text">{{ ev.notes }}</td>
              <td v-if="auth.isAdmin">
                <div v-if="ev.type === 'manual'" class="inline-actions">
                  <q-btn flat dense no-caps color="secondary" :label="localeStore.t('edit')" @click="startEdit(ev)" />
                  <q-btn flat dense no-caps color="negative" :label="localeStore.t('delete')" @click="deleteEvent(ev)" />
                </div>
              </td>
            </tr>
            <tr v-if="allEvents.length === 0">
              <td :colspan="auth.isAdmin ? 5 : 4" class="text-center text-grey-5">{{ localeStore.t('noEventsYet') }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'
import { useAuthStore } from '../stores/auth.js'
import { deriveDuration, formatDuration, buildDurationPayload } from '../utils/duration.js'

const localeStore = useLocaleStore()
const auth = useAuthStore()
const allEvents = ref([])
const filteredEvents = ref([])
const selectedYear = ref(new Date().getFullYear())
const years = ref([])
const icalUrl = '/api/calendar/vpga.ics'
const editing = ref(null)
const addError = ref('')
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

const fmt = ev => formatDuration(ev, localeStore.t)

function buildPayload(formData) {
  return {
    title: formData.title,
    date: formData.date,
    notes: formData.notes,
    ...buildDurationPayload(formData),
  }
}

async function load() {
  const res = await api.get('/api/calendar/all')
  allEvents.value = res.data
  const eventYears = Array.from(new Set(res.data.map(ev => (ev.date || '').slice(0, 4)).filter(Boolean))).map(Number)
  const thisYear = new Date().getFullYear()
  if (!eventYears.includes(thisYear)) eventYears.push(thisYear)
  years.value = eventYears.sort((a, b) => b - a)
  if (!years.value.includes(selectedYear.value)) selectedYear.value = thisYear
  filterEvents()
}

function filterEvents() {
  filteredEvents.value = allEvents.value
    .filter(ev => (ev.date || '').startsWith(String(selectedYear.value)))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
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

function startEdit(ev) {
  editing.value = { ...ev }
  form.value = {
    title: ev.title,
    date: ev.date,
    duration: deriveDuration(ev),
    start_time: ev.start_time || '',
    notes: ev.notes || '',
  }
}

function cancelEdit() {
  editing.value = null
  form.value = { title: '', date: '', duration: '1day', start_time: '', notes: '' }
}

async function saveEdit() {
  if (!editing.value) return
  addError.value = ''
  try {
    await api.put(`/api/events/${editing.value.id}`, { ...buildPayload(form.value), id: undefined })
    cancelEdit()
    await load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingEvent')
  }
}

async function deleteEvent(ev) {
  if (!window.confirm(localeStore.t('deleteEventConfirm', { title: ev.title }))) return
  try {
    await api.delete(`/api/events/${ev.id}`)
    await load()
    if (editing.value && editing.value.id === ev.id) cancelEdit()
  } catch (e) {
    window.alert(e.response?.data?.error || 'Error deleting event')
  }
}

onMounted(load)
</script>
