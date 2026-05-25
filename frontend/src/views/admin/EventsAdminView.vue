<template>
  <div>
    <h2>{{ localeStore.t('events') }}</h2>

    <div class="card">
      <h3>{{ localeStore.t('addEvent') }}</h3>
      <form @submit.prevent="addEvent">
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
            {{ localeStore.t('description') }}
            <input v-model="form.description" type="text" style="min-width:200px" />
          </label>
        </div>
        <p v-if="addError" class="error">{{ addError }}</p>
        <button type="submit">{{ localeStore.t('addEvent') }}</button>
      </form>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{ localeStore.t('eventTitle') }}</th>
          <th>{{ localeStore.t('date') }}</th>
          <th>{{ localeStore.t('duration') }}</th>
          <th>{{ localeStore.t('description') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="ev in events" :key="ev.id">
          <!-- view row -->
          <tr v-if="editingId !== ev.id">
            <td>{{ ev.title }}</td>
            <td>{{ ev.date }}</td>
            <td>{{ fmt(ev) }}</td>
            <td style="color:#6b7280;font-size:0.88rem">{{ ev.description || ev.notes }}</td>
            <td style="white-space:nowrap">
              <button class="sm" @click="startEdit(ev)" style="margin-right:4px">{{ localeStore.t('edit') }}</button>
              <button class="sm danger" @click="deleteEvent(ev)">{{ localeStore.t('delete') }}</button>
            </td>
          </tr>
          <!-- inline edit row -->
          <tr v-else style="background:#f0f9ff">
            <td><input v-model="editForm.title" type="text" style="min-width:160px" /></td>
            <td><input v-model="editForm.date" type="date" lang="sv" /></td>
            <td>
              <select v-model="editForm.duration" style="width:120px">
                <option value="1day">{{ localeStore.t('duration1Day') }}</option>
                <option value="2days">{{ localeStore.t('duration2Days') }}</option>
                <option value="timed">{{ localeStore.t('durationTimed') }}</option>
              </select>
              <input v-if="editForm.duration === 'timed'" v-model="editForm.start_time" type="time" lang="sv" style="width:100px;margin-left:4px" required />
            </td>
            <td><input v-model="editForm.description" type="text" style="min-width:140px" /></td>
            <td style="white-space:nowrap">
              <button class="sm" @click="saveEdit" style="margin-right:4px">{{ localeStore.t('save') }}</button>
              <button class="sm" @click="editingId = null">{{ localeStore.t('cancel') }}</button>
            </td>
          </tr>
        </template>
        <tr v-if="events.length === 0">
          <td colspan="5" style="color:#9ca3af;text-align:center">{{ localeStore.t('noEventsYet') }}</td>
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

const events    = ref([])
const addError  = ref('')
const localeStore = useLocaleStore()
const editingId = ref(null)
const editForm  = ref({})
const form = ref({
  title:      '',
  date:       '',
  duration:   '1day',
  start_time: '',
  description:'',
})

function buildPayload(formData) {
  return {
    title:      formData.title,
    date:       formData.date,
    description: formData.description,
    ...buildDurationPayload(formData),
  }
}

const fmt = (ev) => formatDuration(ev, localeStore.t)

async function load() {
  const res = await api.get('/api/events')
  events.value = res.data
}

async function addEvent() {
  addError.value = ''
  try {
    await api.post('/api/events', buildPayload(form.value))
    form.value = { title: '', date: '', duration: '1day', start_time: '', description: '' }
    load()
  } catch (e) {
    addError.value = e.response?.data?.error || localeStore.t('errorAddingEvent')
  }
}

async function deleteEvent(ev) {
  if (!confirm(localeStore.t('deleteEventConfirm', { title: ev.title }))) return
  await api.delete(`/api/events/${ev.id}`)
  load()
}

function startEdit(ev) {
  editingId.value = ev.id
  editForm.value = {
    title:      ev.title,
    date:       ev.date,
    duration:   deriveDuration(ev),
    start_time: ev.start_time || '',
    description: ev.description || ev.notes || '',
  }
}

async function saveEdit() {
  await api.put(`/api/events/${editingId.value}`, buildPayload(editForm.value))
  editingId.value = null
  load()
}

onMounted(load)
</script>
