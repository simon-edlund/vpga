<template>
  <div>
    <h2>{{ localeStore.t('enterScores') }}</h2>

    <div class="controls score-entry-controls">
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
        <p class="score-help">
          {{ localeStore.t('enterNetStrokesHelp') }}
        </p>

        <div class="score-entry-list">
          <div class="score-entry-row score-entry-header">
            <span>{{ localeStore.t('player') }}</span>
            <span>{{ localeStore.t('netStrokes') }}</span>
          </div>
          <div v-for="m in members" :key="m.id" class="score-entry-row">
            <label :for="`score-${m.id}`">{{ m.name }}</label>
            <input
              :id="`score-${m.id}`"
              v-model="scoreInputs[m.id]"
              type="number"
              min="50"
              max="200"
              :placeholder="localeStore.t('absentPlaceholder')"
              class="score-input"
            />
          </div>
        </div>

        <div class="score-actions">
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

<style scoped>
.score-help {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.score-entry-list {
  border: 1px solid #e4ece7;
  border-radius: 7px;
  overflow: hidden;
}

.score-entry-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 130px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.8rem;
  border-bottom: 1px solid #e9f0eb;
  background: #fff;
}

.score-entry-row:last-child {
  border-bottom: none;
}

.score-entry-row label {
  min-width: 0;
}

.score-entry-header {
  background: #1b4332;
  color: #fff;
  font-weight: 600;
}

.score-entry-header span:last-child {
  text-align: center;
}

.score-input {
  width: 100%;
  text-align: center;
}

.score-actions {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 700px) {
  .score-entry-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .score-entry-controls label {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .score-entry-controls select {
    width: 100%;
    min-width: 0;
  }

  .score-entry-header {
    display: none;
  }

  .score-entry-row {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }

  .score-input {
    text-align: left;
  }

  .score-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
  }

  .score-actions button {
    width: 100%;
  }
}
</style>
