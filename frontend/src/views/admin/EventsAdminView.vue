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
            <input v-model="form.date" type="date" required />
          </label>
          <label>
            {{ localeStore.t('dateEnd') }}
            <input v-model="form.date_end" type="date" />
          </label>
          <label>
            {{ localeStore.t('startTime') }}
            <input v-model="form.start_time" type="time" style="width:110px" />
          </label>
          <label>
            {{ localeStore.t('notes') }}
            <input v-model="form.notes" type="text" style="min-width:200px" />
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
          <th>{{ localeStore.t('dateEnd') }}</th>
          <th>{{ localeStore.t('startTime') }}</th>
          <th>{{ localeStore.t('notes') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="ev in events" :key="ev.id">
          <!-- view row -->
          <tr v-if="editingId !== ev.id">
            <td>{{ ev.title }}</td>
            <td>{{ ev.date }}</td>
            <td>{{ ev.date_end || '–' }}</td>
            <td>{{ ev.start_time || '–' }}</td>
            <td style="color:#6b7280;font-size:0.88rem">{{ ev.notes }}</td>
            <td style="white-space:nowrap">
              <button class="sm" @click="startEdit(ev)" style="margin-right:4px">{{ localeStore.t('edit') }}</button>
              <button class="sm danger" @click="deleteEvent(ev)">{{ localeStore.t('delete') }}</button>
            </td>
          </tr>
          <!-- inline edit row -->
          <tr v-else style="background:#f0f9ff">
            <td><input v-model="editForm.title" type="text" style="min-width:160px" /></td>
            <td><input v-model="editForm.date" type="date" /></td>
            <td><input v-model="editForm.date_end" type="date" /></td>
            <td><input v-model="editForm.start_time" type="time" style="width:100px" /></td>
            <td><input v-model="editForm.notes" type="text" style="min-width:140px" /></td>
            <td style="white-space:nowrap">
              <button class="sm" @click="saveEdit" style="margin-right:4px">{{ localeStore.t('save') }}</button>
              <button class="sm" @click="editingId = null">{{ localeStore.t('cancel') }}</button>
            </td>
          </tr>
        </template>
        <tr v-if="events.length === 0">
          <td colspan="6" style="color:#9ca3af;text-align:center">{{ localeStore.t('noEventsYet') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'

const events    = ref([])
const addError  = ref('')
const localeStore = useLocaleStore()
const editingId = ref(null)
const editForm  = ref({})
const form = ref({
  title:      '',
  date:       '',
  date_end:   '',
  start_time: '',
  notes:      '',
})

async function load() {
  const res = await api.get('/api/events')
  events.value = res.data
}

async function addEvent() {
  addError.value = ''
  try {
    await api.post('/api/events', form.value)
    form.value = { title: '', date: '', date_end: '', start_time: '', notes: '' }
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
    date_end:   ev.date_end || '',
    start_time: ev.start_time || '',
    notes:      ev.notes || '',
  }
}

async function saveEdit() {
  await api.put(`/api/events/${editingId.value}`, editForm.value)
  editingId.value = null
  load()
}

onMounted(load)
</script>
