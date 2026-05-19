<template>
  <div>
    <div style="display:flex;align-items:center;gap:1.5em;margin-bottom:0.5em">
      <h2 style="margin:0">{{ localeStore.t('calendar') }}</h2>
      <select v-model="selectedYear" @change="filterEvents" style="font-size:1em">
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
      <a :href="icalUrl" target="_blank" rel="noopener" class="subscribe-btn">
        📅 {{ localeStore.t('subscribeCalendar') }}
      </a>
    </div>
    <div v-if="auth.isAdmin">
      <div class="card">
        <h3>{{ localeStore.t('addEvent') }}</h3>
        <form @submit.prevent="editing ? saveEdit() : addEvent()">
          <div class="row-gap">
            <label>
              {{ localeStore.t('eventTitle') }}
              <input v-model="form.title" type="text" required style="min-width:200px" />
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
              {{ localeStore.t('notes') }}
              <input v-model="form.notes" type="text" style="min-width:200px" />
            </label>
          </div>
          <p v-if="addError" class="error">{{ addError }}</p>
          <button type="submit">
            {{ editing ? localeStore.t('save') : localeStore.t('addEvent') }}
          </button>
          <button v-if="editing" type="button" @click="cancelEdit" style="margin-left:0.5em">{{ localeStore.t('cancel') }}</button>
        </form>
      </div>
    </div>
    <table style="margin-top:1em">
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
        <template v-for="ev in filteredEvents" :key="ev.id">
          <tr>
            <td>{{ ev.title }}</td>
            <td>{{ ev.date }}</td>
            <td>{{ fmt(ev) }}</td>
            <td style="color:#6b7280;font-size:0.88rem">{{ ev.notes }}</td>
            <td v-if="auth.isAdmin">
              <template v-if="ev.type === 'manual'">
                <button @click="startEdit(ev)" style="margin-right:0.5em">{{ localeStore.t('edit') }}</button>
                <button @click="deleteEvent(ev)" style="color:#b91c1c">{{ localeStore.t('delete') }}</button>
              </template>
            </td>
          </tr>
        </template>
        <tr v-if="allEvents.length === 0">
          <td colspan="4" style="color:#9ca3af;text-align:center">{{ localeStore.t('noEventsYet') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
const addError  = ref('')
const form = ref({
  title:      '',
  date:       '',
  duration:   '1day',
  start_time: '',
  notes:      '',
})

const fmt = (ev) => formatDuration(ev, localeStore.t)

function buildPayload(formData) {
  return {
    title:      formData.title,
    date:       formData.date,
    notes:      formData.notes,
    ...buildDurationPayload(formData),
  }
}

async function load() {
  // Fetch all events: manual, rounds, OMPC deadlines
  const res = await api.get('/api/calendar/all')
  allEvents.value = res.data
  // Find all years present in events
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
    .slice() // copy
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

async function addEvent() {
  addError.value = ''
  try {
    await api.post('/api/events', buildPayload(form.value))
    form.value = { title: '', date: '', duration: '1day', start_time: '', notes: '' }
    load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingEvent')
  }
}

onMounted(load)

// Edit/delete logic for manual events
function startEdit(ev) {
  editing.value = { ...ev }
  form.value = {
    title:      ev.title,
    date:       ev.date,
    duration:   deriveDuration(ev),
    start_time: ev.start_time || '',
    notes:      ev.notes || '',
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
    await api.put(`/api/events/${editing.value.id}`,
      { ...buildPayload(form.value), id: undefined })
    editing.value = null
    form.value = { title: '', date: '', duration: '1day', start_time: '', notes: '' }
    load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingEvent')
  }
}

async function deleteEvent(ev) {
  if (!confirm(localeStore.t('deleteEventConfirm', { title: ev.title }))) return
  try {
    await api.delete(`/api/events/${ev.id}`)
    load()
    if (editing.value && editing.value.id === ev.id) cancelEdit()
  } catch (e) {
    alert(e.response?.data?.error || 'Error deleting event')
  }
}
</script>
