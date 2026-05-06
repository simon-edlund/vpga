<template>
  <div>
    <h2>Season Standings</h2>

    <div class="controls">
      <label>
        Season
        <select v-model="selectedSeason" @change="loadStandings">
          <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <p v-if="loading" class="loading">Loading…</p>

    <template v-else-if="data">
      <div v-if="data.rounds.length === 0" class="card">
        No rounds have been created for {{ selectedSeason }} yet.
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th
                v-for="round in data.rounds"
                :key="round.id"
                style="text-align:center"
              >
                <router-link :to="'/rounds/' + round.id" style="color:#a7f3d0">
                  R{{ round.round_number }}
                </router-link>
                <div style="font-weight:400;font-size:0.78rem;opacity:0.8">{{ round.date }}</div>
              </th>
              <th style="text-align:center">Best&nbsp;4</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(member, idx) in data.standings" :key="member.id">
              <td>{{ member.total !== null ? idx + 1 : '–' }}</td>
              <td>{{ member.name }}</td>
              <td
                v-for="rs in member.roundScores"
                :key="rs.round_id"
                :class="['score-cell', rs.is_best4 ? 'best4' : '', rs.absent ? 'absent' : '']"
                style="text-align:center"
              >
                <span v-if="rs.score !== null">
                  {{ rs.score }}<sup v-if="rs.absent" title="Absent – assigned max+1">*</sup>
                </span>
                <span v-else style="color:#ccc">–</span>
              </td>
              <td class="total" style="text-align:center">
                {{ member.total ?? '–' }}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="legend">
          <strong>Best 4</strong> cells are highlighted green. &nbsp;
          * Absent player – assigned highest score in that round + 1.
        </p>
      </div>
    </template>

    <div v-else-if="!loading" class="card">
      No seasons found. An admin needs to create rounds first.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'

const seasons        = ref([])
const selectedSeason = ref(new Date().getFullYear())
const data           = ref(null)
const loading        = ref(false)

async function loadSeasons() {
  const res = await api.get('/api/standings')
  seasons.value = res.data
  if (seasons.value.length > 0) {
    selectedSeason.value = seasons.value[0]
    await loadStandings()
  } else {
    loading.value = false
  }
}

async function loadStandings() {
  loading.value = true
  data.value    = null
  try {
    const res = await api.get(`/api/standings/${selectedSeason.value}`)
    data.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(loadSeasons)
</script>
