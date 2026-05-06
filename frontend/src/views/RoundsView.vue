<template>
  <div>
    <h2>Rounds</h2>

    <div class="controls">
      <label>
        Season
        <select v-model="selectedSeason" @change="loadRounds">
          <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <p v-if="rounds.length === 0" class="card">No rounds for this season yet.</p>

    <table v-else>
      <thead>
        <tr>
          <th>Round</th>
          <th>Date</th>
          <th>Course</th>
          <th>Notes</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="round in rounds" :key="round.id">
          <td>{{ round.round_number }}</td>
          <td>{{ round.date }}</td>
          <td>{{ round.course }}</td>
          <td style="color:#6b7280;font-size:0.88rem">{{ round.notes }}</td>
          <td>
            <router-link :to="'/rounds/' + round.id">View scores →</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'

const seasons        = ref([])
const selectedSeason = ref(new Date().getFullYear())
const rounds         = ref([])

async function loadSeasons() {
  const res = await api.get('/api/standings')
  seasons.value = res.data
  if (seasons.value.length > 0) {
    selectedSeason.value = seasons.value[0]
    await loadRounds()
  }
}

async function loadRounds() {
  const res = await api.get('/api/rounds', { params: { season: selectedSeason.value } })
  rounds.value = res.data
}

onMounted(loadSeasons)
</script>
