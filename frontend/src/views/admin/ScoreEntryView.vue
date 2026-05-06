<template>
  <div>
    <h2>Enter Scores</h2>

    <div class="controls">
      <label>
        Season
        <select v-model.number="selectedSeason" @change="loadRounds">
          <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label>
        Round
        <select v-model="selectedRoundId" @change="loadScores">
          <option value="">— Select round —</option>
          <option v-for="r in rounds" :key="r.id" :value="r.id">
            Round {{ r.round_number }} – {{ r.date }}{{ r.course ? ' · ' + r.course : '' }}
          </option>
        </select>
      </label>
    </div>

    <template v-if="selectedRoundId && members.length > 0">
      <div class="card">
        <p style="color:#6b7280;font-size:0.9rem;margin-bottom:1rem">
          Enter net strokes for each player. Leave blank for absent players
          (they will automatically receive the highest score&nbsp;+&nbsp;1).
        </p>

        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th style="text-align:center">Net strokes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id">
              <td>{{ m.name }}</td>
              <td style="text-align:center">
                <input
                  v-model="scoreInputs[m.id]"
                  type="number"
                  min="50"
                  max="200"
                  placeholder="absent"
                  style="width:90px;text-align:center"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:1rem;display:flex;align-items:center;gap:1rem">
          <button @click="saveScores">Save Scores</button>
          <span v-if="saved" class="success">✓ Saved!</span>
        </div>
      </div>
    </template>

    <div v-else-if="!selectedRoundId && rounds.length > 0" class="card" style="color:#6b7280">
      Select a round above to enter scores.
    </div>

    <div v-else-if="seasons.length === 0" class="card" style="color:#6b7280">
      No rounds exist yet. Create rounds first.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'

const seasons        = ref([])
const selectedSeason = ref(new Date().getFullYear())
const rounds         = ref([])
const selectedRoundId = ref('')
const members        = ref([])
const scoreInputs    = ref({})   // member_id -> string (number or '')
const saved          = ref(false)

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
  rounds.value       = res.data
  selectedRoundId.value = ''
  members.value      = []
  scoreInputs.value  = {}
}

async function loadScores() {
  if (!selectedRoundId.value) return
  saved.value = false

  const [membersRes, scoresRes] = await Promise.all([
    api.get('/api/members'),
    api.get(`/api/rounds/${selectedRoundId.value}/scores`),
  ])

  members.value = membersRes.data.filter(m => m.active)

  // Initialise all as blank (absent)
  scoreInputs.value = {}
  for (const m of members.value) scoreInputs.value[m.id] = ''

  // Pre-populate with existing played scores
  for (const s of scoresRes.data.scores) {
    if (!s.absent && s.net_strokes !== null) {
      scoreInputs.value[s.member_id] = String(s.net_strokes)
    }
  }
}

async function saveScores() {
  const scores = members.value
    .map(m => ({ member_id: m.id, raw: scoreInputs.value[m.id] }))
    .filter(s => s.raw !== '' && s.raw !== null && s.raw !== undefined)
    .map(s => ({ member_id: s.member_id, net_strokes: parseInt(s.raw, 10) }))
    .filter(s => !isNaN(s.net_strokes))

  await api.put(`/api/rounds/${selectedRoundId.value}/scores`, { scores })
  saved.value = true
  setTimeout(() => (saved.value = false), 4000)
}

onMounted(loadSeasons)
</script>
