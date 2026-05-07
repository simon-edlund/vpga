<template>
  <div>
    <h2>{{ localeStore.t('enterScores') }}</h2>

    <div class="controls">
      <label>
        {{ localeStore.t('season') }}
        <select v-model.number="selectedSeason" @change="loadRounds">
          <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label>
        {{ localeStore.t('selectRound') }}
        <select v-model="selectedRoundId" @change="loadScores">
          <option value="">- {{ localeStore.t('selectRoundPlaceholder') }} -</option>
          <option v-for="r in rounds" :key="r.id" :value="r.id">
            VPGA{{ r.round_number }} - {{ r.date }}{{ r.course ? ' · ' + r.course : '' }}
          </option>
        </select>
      </label>
    </div>

    <template v-if="selectedRoundId && members.length > 0">
      <div class="card">
        <p style="color:#6b7280;font-size:0.9rem;margin-bottom:1rem">
          {{ localeStore.t('enterNetStrokesHelp') }}
        </p>

        <table>
          <thead>
            <tr>
              <th>{{ localeStore.t('player') }}</th>
              <th style="text-align:center">{{ localeStore.t('netStrokes') }}</th>
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
                  :placeholder="localeStore.t('absentPlaceholder')"
                  style="width:90px;text-align:center"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:1rem;display:flex;align-items:center;gap:1rem">
          <button @click="saveScores">{{ localeStore.t('saveScores') }}</button>
          <span v-if="saved" class="success">✓ {{ localeStore.t('saved') }}</span>
        </div>
      </div>
    </template>

    <div v-else-if="!selectedRoundId && rounds.length > 0" class="card" style="color:#6b7280">
      {{ localeStore.t('selectRoundAbove') }}
    </div>

    <div v-else-if="seasons.length === 0" class="card" style="color:#6b7280">
      {{ localeStore.t('noRoundsCreateFirst') }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'

const seasons        = ref([])
const selectedSeason = ref(new Date().getFullYear())
const rounds         = ref([])
const selectedRoundId = ref('')
const members        = ref([])
const scoreInputs    = ref({})   // member_id -> string (number or '')
const saved          = ref(false)
const localeStore = useLocaleStore()

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
