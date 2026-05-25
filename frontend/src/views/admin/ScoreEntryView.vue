<template>
  <div class="page-stack">
    <h1 class="page-title">{{ localeStore.t('enterScores') }}</h1>

    <div class="controls-row">
      <q-select
        v-model="selectedSeason"
        outlined
        dense
        :label="localeStore.t('season')"
        :options="seasons"
        style="min-width: 160px;"
        @update:model-value="loadRounds"
      />
      <q-select
        v-model="selectedRoundId"
        outlined
        dense
        :label="localeStore.t('selectRound')"
        :options="roundOptions"
        emit-value
        map-options
        style="min-width: 320px;"
        @update:model-value="loadScores"
      />
    </div>

    <q-card v-if="selectedRoundId && members.length > 0" flat bordered class="surface-card section-card">
      <q-card-section>
        <p class="legend q-ma-none">{{ localeStore.t('enterNetStrokesHelp') }}</p>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="score-entry-list">
          <div class="score-entry-row score-entry-header">
            <span>{{ localeStore.t('player') }}</span>
            <span>{{ localeStore.t('netStrokes') }}</span>
          </div>
          <div v-for="m in members" :key="m.id" class="score-entry-row">
            <label :for="`score-${m.id}`">{{ m.name }}</label>
            <q-input
              :id="`score-${m.id}`"
              v-model="scoreInputs[m.id]"
              dense
              outlined
              type="number"
              min="50"
              max="200"
              :placeholder="localeStore.t('absentPlaceholder')"
            />
          </div>
        </div>
        <div class="score-actions">
          <q-btn color="primary" no-caps :label="localeStore.t('saveScores')" @click="saveScores" />
          <q-banner v-if="saved" dense rounded class="bg-green-1 text-positive">✓ {{ localeStore.t('saved') }}</q-banner>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-else-if="!selectedRoundId && rounds.length > 0" flat bordered class="surface-card">
      <q-card-section class="text-grey-7">{{ localeStore.t('selectRoundAbove') }}</q-card-section>
    </q-card>

    <q-card v-else-if="seasons.length === 0" flat bordered class="surface-card">
      <q-card-section class="text-grey-7">{{ localeStore.t('noRoundsCreateFirst') }}</q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useLocaleStore } from '../../stores/locale.js'

const seasons = ref([])
const selectedSeason = ref(new Date().getFullYear())
const rounds = ref([])
const selectedRoundId = ref('')
const members = ref([])
const scoreInputs = ref({})
const saved = ref(false)
const localeStore = useLocaleStore()

const roundOptions = computed(() => [
  { label: `- ${localeStore.t('selectRoundPlaceholder')} -`, value: '' },
  ...rounds.value.map(r => ({
    label: `VPGA${r.round_number} - ${r.date}${r.course ? ' · ' + r.course : ''}`,
    value: r.id,
  })),
])

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
  selectedRoundId.value = ''
  members.value = []
  scoreInputs.value = {}
}

async function loadScores() {
  if (!selectedRoundId.value) return
  saved.value = false

  const [membersRes, scoresRes] = await Promise.all([
    api.get('/api/members'),
    api.get(`/api/rounds/${selectedRoundId.value}/scores`),
  ])

  members.value = membersRes.data.filter(m => m.active)
  scoreInputs.value = {}
  for (const m of members.value) scoreInputs.value[m.id] = ''
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
    .filter(s => !Number.isNaN(s.net_strokes))

  await api.put(`/api/rounds/${selectedRoundId.value}/scores`, { scores })
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 4000)
}

onMounted(loadSeasons)
</script>

<style scoped>
.score-entry-list {
  border: 1px solid #e4ece7;
  border-radius: 16px;
  overflow: hidden;
}

.score-entry-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #e9f0eb;
  background: #fff;
}

.score-entry-row:last-child {
  border-bottom: none;
}

.score-entry-header {
  background: #1b4332;
  color: #fff;
  font-weight: 600;
}

.score-entry-header span:last-child {
  text-align: center;
}

.score-actions {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 700px) {
  .score-entry-row {
    grid-template-columns: 1fr;
  }

  .score-entry-header {
    display: none;
  }

  .score-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
