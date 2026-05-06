<template>
  <div>
    <h2>Manage Rounds</h2>

    <!-- Add round form -->
    <div class="card">
      <h3>Add Round</h3>
      <form @submit.prevent="addRound">
        <div class="row-gap">
          <label>
            Season
            <input v-model.number="form.season" type="number" min="2000" max="2100" style="width:90px" required />
          </label>
          <label>
            Round #
            <input v-model.number="form.round_number" type="number" min="1" max="99" style="width:70px" required />
          </label>
          <label>
            Date
            <input v-model="form.date" type="date" required />
          </label>
          <label>
            Course
            <input v-model="form.course" type="text" style="min-width:180px" />
          </label>
          <label>
            Notes
            <input v-model="form.notes" type="text" style="min-width:180px" />
          </label>
        </div>
        <p v-if="addError" class="error">{{ addError }}</p>
        <button type="submit">Add Round</button>
      </form>
    </div>

    <!-- Rounds list -->
    <table>
      <thead>
        <tr>
          <th>Season</th>
          <th>Round</th>
          <th>Date</th>
          <th>Course</th>
          <th>Notes</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rounds" :key="r.id">
          <td>{{ r.season }}</td>
          <td>{{ r.round_number }}</td>
          <td>{{ r.date }}</td>
          <td>{{ r.course }}</td>
          <td style="color:#6b7280;font-size:0.88rem">{{ r.notes }}</td>
          <td>
            <button class="sm danger" @click="deleteRound(r)">Delete</button>
          </td>
        </tr>
        <tr v-if="rounds.length === 0">
          <td colspan="6" style="color:#9ca3af;text-align:center">No rounds yet.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'

const rounds   = ref([])
const addError = ref('')
const form     = ref({
  season:       new Date().getFullYear(),
  round_number: 1,
  date:         '',
  course:       '',
  notes:        '',
})

async function load() {
  const res = await api.get('/api/rounds')
  rounds.value = res.data
}

async function addRound() {
  addError.value = ''
  try {
    await api.post('/api/rounds', form.value)
    form.value.round_number++
    form.value.date = ''
    load()
  } catch (e) {
    addError.value = e.response?.data?.error || 'Error adding round'
  }
}

async function deleteRound(r) {
  if (!confirm(`Delete round ${r.round_number} (${r.date})? All scores for this round will be deleted.`)) return
  await api.delete(`/api/rounds/${r.id}`)
  load()
}

onMounted(load)
</script>
