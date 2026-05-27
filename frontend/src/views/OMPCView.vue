<template>
  <div class="ompc-view">
    <div class="page-head">
      <div>
        <h1>{{ localeStore.t('ompcPlayerTitle') }}</h1>
        <p class="subtle">{{ localeStore.t('ompcPlayerIntro') }}</p>
      </div>
      <label class="season-picker">
        {{ localeStore.t('season') }}
        <input v-model.number="season" type="number" min="2020" />
      </label>
      <button @click="fetchCup">{{ localeStore.t('loadSeason') }}</button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="loading" class="loading">{{ localeStore.t('loading') }}</p>

    <template v-else>
      <div v-if="!cup" class="card empty-state">
        <p>{{ localeStore.t('noOmpcCupForSeason') }}</p>
      </div>

      <template v-else>
        <section v-if="matches.length > 0" class="card section-card">
          <div class="section-head">
            <div>
              <h2>{{ localeStore.t('ompcBracket') }}</h2>
              <p class="subtle">{{ localeStore.t('ompcBracketPlayerHelp') }}</p>
            </div>
          </div>

          <div class="bracket-scroll">
            <div class="bracket-grid" :style="bracketGridStyle">
              <div
                v-for="(round, colIdx) in bracketRounds"
                :key="'header-' + round.roundNumber"
                class="bracket-header-cell"
                :style="{ gridColumn: colIdx + 1, gridRow: 1 }"
              >
                <div class="round-header">
                  <div class="round-header-top">
                    <h3>{{ round.label }}</h3>
                    <p class="subtle">{{ round.matches.length }} {{ round.matches.length === 1 ? localeStore.t('matchSingular') : localeStore.t('matchPlural') }}</p>
                  </div>
                  <div class="deadline-box readonly-deadline">
                    <span class="deadline-label">{{ localeStore.t('deadline') }}</span>
                    <span>{{ roundDeadline(round.roundNumber) }}</span>
                  </div>
                </div>
              </div>

              <template v-for="match in bracketGridMatches" :key="'match-' + match.id">
                <article class="match-card" :style="{ gridColumn: match.gridColumn, gridRow: `${match.gridRow} / span 2` }">
                  <div class="match-meta">Match {{ matchDisplayNumbers.get(match.id) }}</div>
                  <div class="slot-readonly">
                    <template v-if="isWinner(match, 'player1')">🏅 <strong>{{ slotDisplay(match, 'player1') }}</strong></template>
                    <em v-else-if="isWinnerPlaceholder(match, 'player1')">{{ slotDisplay(match, 'player1') }}</em>
                    <template v-else>{{ slotDisplay(match, 'player1') }}</template>
                  </div>
                  <div class="slot-readonly">
                    <template v-if="isWinner(match, 'player2')">🏅 <strong>{{ slotDisplay(match, 'player2') }}</strong></template>
                    <em v-else-if="isWinnerPlaceholder(match, 'player2')">{{ slotDisplay(match, 'player2') }}</em>
                    <template v-else>{{ slotDisplay(match, 'player2') }}</template>
                  </div>
                  <div v-if="canManageResult(match)" class="result-actions">
                    <button
                      class="sm"
                      :disabled="reportingMatchId === match.id"
                      @click="reportResult(match, currentMemberId)"
                    >
                      {{ reportingMatchId === match.id ? localeStore.t('saving') : localeStore.t('iWon') }}
                    </button>
                    <button
                      class="sm secondary"
                      :disabled="reportingMatchId === match.id"
                      @click="reportResult(match, opponentId(match))"
                    >
                      {{ localeStore.t('playerWon', { name: opponentName(match) }) }}
                    </button>
                    <button
                      v-if="match.winner_id"
                      class="sm secondary"
                      :disabled="reportingMatchId === match.id"
                      @click="resetResult(match)"
                    >
                      {{ localeStore.t('resetResult') }}
                    </button>
                  </div>
                </article>
              </template>
            </div>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api, { getOMPCMatches, getOMPCup, updateOMPCMatchResult } from '../api/index.js'
import { useAuthStore } from '../stores/auth.js'
import { useLocaleStore } from '../stores/locale.js'

const auth = useAuthStore()
const localeStore = useLocaleStore()
const season = ref(new Date().getFullYear())
const cup = ref(null)
const members = ref([])
const matches = ref([])
const loading = ref(true)
const errorMessage = ref('')
const reportingMatchId = ref(null)
const GRID_TRACK_HEIGHT = 56
const GRID_ROW_GAP = 10

const currentMemberId = computed(() => extractMemberId(auth.token))

const bracketRounds = computed(() => {
  const grouped = new Map()
  for (const match of matches.value) {
    if (!grouped.has(match.round)) grouped.set(match.round, [])
    grouped.get(match.round).push(match)
  }

  const totalRounds = grouped.size

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([roundNumber, roundMatches]) => ({
      roundNumber,
      label: roundLabel(roundNumber, totalRounds),
      matches: roundMatches.sort((a, b) => a.match_number - b.match_number),
    }))
})

const bracketGridMatches = computed(() => {
  if (!matches.value.length) return []
  const result = []
  for (const match of matches.value) {
    const matchesInRound = matches.value.filter(item => item.round === match.round)
    const roundIdx = matchesInRound.findIndex(item => item.id === match.id)
    const roundOffset = 2 ** (match.round - 1)
    const rowStep = 2 ** match.round
    const row = 1 + roundOffset + roundIdx * rowStep
    result.push({ ...match, gridColumn: match.round, gridRow: row })
  }
  return result
})

const bracketGridStyle = computed(() => {
  const rounds = bracketRounds.value.length
  const totalTracks = 2 ** rounds
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${rounds}, 300px)`,
    gridTemplateRows: `minmax(120px, auto) repeat(${totalTracks}, ${GRID_TRACK_HEIGHT}px)`,
    gap: `${GRID_ROW_GAP}px 2.5rem`,
    minWidth: 'max-content',
    alignItems: 'center',
  }
})

const bracketSize = computed(() => {
  if (!matches.value.length) return 0
  const totalRounds = Math.max(...matches.value.map(match => match.round))
  return 2 ** totalRounds
})

function extractMemberId(token) {
  if (!token) return null
  try {
    const segment = token.split('.')[1]
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded))
    return Number(payload.id) || null
  } catch {
    return null
  }
}

function roundLabel(roundNumber) {
  const stageSize = Math.max(2, bracketSize.value / 2 ** (roundNumber - 1))
  if (stageSize === 2) return localeStore.t('final')
  if (stageSize === 4) return localeStore.t('semifinals')
  if (stageSize === 8) return localeStore.t('quarterfinals')
  if (stageSize === 16) return localeStore.t('roundOf16')
  return localeStore.t('roundOf', { size: stageSize })
}

const matchesSortedByRound = computed(() => {
  const map = new Map()
  for (const match of matches.value) {
    if (!map.has(match.round)) map.set(match.round, [])
    map.get(match.round).push(match)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.match_number - b.match_number)
  }
  return map
})

const matchDisplayNumbers = computed(() => {
  const map = new Map()
  let counter = 1
  const sortedRounds = [...matchesSortedByRound.value.keys()].sort((a, b) => a - b)
  for (const round of sortedRounds) {
    for (const match of matchesSortedByRound.value.get(round)) {
      map.set(match.id, counter++)
    }
  }
  return map
})

function feederDisplayNumber(match, slot) {
  const roundMatches = matchesSortedByRound.value.get(match.round) || []
  const positionInRound = roundMatches.findIndex(m => m.id === match.id) + 1
  const prevRoundMatches = matchesSortedByRound.value.get(match.round - 1) || []
  const feederPosition = slot === 'player1' ? 2 * positionInRound - 1 : 2 * positionInRound
  const feederMatch = prevRoundMatches[feederPosition - 1]
  return feederMatch ? matchDisplayNumbers.value.get(feederMatch.id) : null
}

function getSlotValue(match, slot) {
  return slot === 'player1' ? match.player1_id : match.player2_id
}

function isWinner(match, slot) {
  const slotValue = getSlotValue(match, slot)
  return !!slotValue && slotValue === match.winner_id
}

function isWinnerPlaceholder(match, slot) {
  return !getSlotValue(match, slot)
}

function slotDisplay(match, slot) {
  const slotValue = slot === 'player1' ? match.player1_id : match.player2_id
  if (slotValue) {
    return memberName(slotValue)
  }

  return localeStore.t('winnerOfMatch', { match: feederDisplayNumber(match, slot) })
}

function memberName(id) {
  if (!id) return ''
  return members.value.find(member => member.id === id)?.name || `Member ${id}`
}

function roundDeadline(roundNumber) {
  const match = matches.value.find(item => item.round === roundNumber)
  return match?.deadline_date || localeStore.t('notSet')
}

function opponentId(match) {
  if (!currentMemberId.value) return null
  return match.player1_id === currentMemberId.value ? match.player2_id : match.player1_id
}

function opponentName(match) {
  return memberName(opponentId(match)) || 'Opponent'
}

function canManageResult(match) {
  if (!currentMemberId.value) return false
  if (!match.player1_id || !match.player2_id) return false
  return match.player1_id === currentMemberId.value || match.player2_id === currentMemberId.value
}

async function fetchMembers() {
  const res = await api.get('/api/members')
  members.value = res.data
}

async function fetchMatches() {
  if (!cup.value) return
  matches.value = await getOMPCMatches(cup.value.id)
}

async function fetchCup() {
  loading.value = true
  errorMessage.value = ''
  cup.value = null
  matches.value = []

  try {
    cup.value = await getOMPCup(season.value)
    await fetchMatches()
  } catch (error) {
    if (error.response?.status === 404) {
      errorMessage.value = localeStore.t('noOmpcCupForSeason')
    } else {
      errorMessage.value = error.response?.data?.error || localeStore.t('couldNotLoadOmpcCup')
    }
  } finally {
    loading.value = false
  }
}

async function reportResult(match, winnerId) {
  if (!winnerId || reportingMatchId.value) return
  reportingMatchId.value = match.id
  errorMessage.value = ''

  try {
    await updateOMPCMatchResult(match.id, winnerId)
    await fetchMatches()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotUpdateMatchResult')
  } finally {
    reportingMatchId.value = null
  }
}

async function resetResult(match) {
  if (reportingMatchId.value) return
  reportingMatchId.value = match.id
  errorMessage.value = ''

  try {
    await updateOMPCMatchResult(match.id, null, 'pending')
    await fetchMatches()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotResetMatchResult')
  } finally {
    reportingMatchId.value = null
  }
}

onMounted(async () => {
  await fetchMembers()
  await fetchCup()
})
</script>

<style scoped>
.ompc-view {
  display: grid;
  gap: 1.5rem;
}

.page-head,
.section-head {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.page-head {
  align-items: end;
}

.season-picker {
  display: grid;
  gap: 0.35rem;
  font-size: 0.88rem;
  color: #4b5563;
}

.subtle {
  color: #6b7280;
  font-size: 0.9rem;
}

.section-card {
  display: grid;
  gap: 1.25rem;
}

.empty-state {
  display: grid;
  gap: 1rem;
  justify-items: start;
}

.bracket-scroll {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.bracket-header-cell {
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.round-header {
  display: grid;
  gap: 0.75rem;
  align-content: start;
  min-height: 100px;
}

.round-header-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  white-space: nowrap;
}

.round-header-top .subtle {
  font-size: 0.82rem;
}

.deadline-box,
.readonly-deadline {
  display: grid;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.deadline-label {
  font-weight: 600;
}

.match-card {
  position: relative;
  display: grid;
  gap: 0.3rem;
  padding: 0.6rem 0.65rem;
  border: 1px solid #d8e6dc;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f6fbf7 100%);
  box-shadow: 0 8px 24px rgba(27, 67, 50, 0.07);
}

.match-card::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -1.5rem;
  width: 1.5rem;
  height: 1px;
  background: #b9d0c1;
}

.match-meta {
  position: absolute;
  top: -0.45rem;
  left: 0.6rem;
  padding: 0 0.35rem;
  background: #ffffff;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: #64748b;
}

.slot-readonly {
  min-height: 32px;
  display: flex;
  align-items: center;
  padding: 0.3rem 0.55rem;
  border-radius: 6px;
  background: #f4f7f5;
  border: 1px solid #dbe8df;
  color: #4b5563;
}

.result-actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-top: 0.1rem;
}

.winner-state {
  font-size: 0.8rem;
  color: #1f5a3f;
  font-weight: 600;
  margin-top: 0.1rem;
}

@media (max-width: 900px) {
  .round-header-top {
    display: grid;
    white-space: normal;
  }
}
</style>
