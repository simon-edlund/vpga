<template>
  <div class="ompc-admin-view">
    <div class="page-head">
      <div>
        <h1>{{ localeStore.t('ompcAdminTitle') }}</h1>
        <p class="subtle">{{ localeStore.t('ompcAdminIntro') }}</p>
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
        <button @click="createCup">{{ localeStore.t('createOmpcCup') }}</button>
      </div>

      <template v-else>
        <section class="card section-card">
          <div class="section-head">
            <div>
              <h2>{{ localeStore.t('ompcParticipants') }}</h2>
              <p class="subtle">{{ localeStore.t('ompcParticipantsHelp') }}</p>
            </div>
          </div>

          <div class="participant-controls">
            <select v-model="selectedMember" :disabled="addingParticipant">
              <option :value="null">{{ localeStore.t('selectMember') }}</option>
              <option v-for="member in selectableMembers" :key="member.id" :value="member.id">{{ member.name }}</option>
            </select>
            <button @click="addParticipant" :disabled="!selectedMember || addingParticipant">{{ localeStore.t('addParticipantToCup') }}</button>
          </div>
          <div class="participant-pool">
            <div class="pool-column">
              <h3>{{ localeStore.t('ompcInCup') }}</h3>
              <div class="participant-status-list">
                <div v-for="participant in cupParticipants" :key="participant.id" class="participant-status-row">
                  <span class="participant-pill">{{ participant.name }}</span>
                  <span :class="['assignment-badge', participantAssignmentStatus(participant.id).kind]">
                    {{ participantAssignmentStatus(participant.id).label }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section-actions">
            <button @click="generateBracket" :disabled="cup.participants.length < 2">{{ localeStore.t('generateBracketTree') }}</button>
            <button class="secondary" @click="resetSeason" :disabled="resettingSeason">
              {{ resettingSeason ? localeStore.t('resetting') : localeStore.t('resetOmpcSeason') }}
            </button>
          </div>
        </section>

        <section v-if="matches.length > 0" class="card section-card">
          <div class="section-head">
            <div>
              <h2>{{ localeStore.t('ompcBracket') }}</h2>
              <p class="subtle">{{ localeStore.t('ompcBracketAdminHelp') }}</p>
            </div>
          </div>

          <div class="bracket-scroll">
            <div class="bracket-grid" :style="bracketGridStyle">
              <!-- Header row -->
              <div v-for="(round, colIdx) in bracketRounds" :key="'header-' + round.roundNumber" class="bracket-header-cell" :style="{ gridColumn: colIdx + 1, gridRow: 1 }">
                <div class="round-header">
                  <div class="round-header-top">
                    <h3>{{ round.label }}</h3>
                    <p class="subtle">{{ round.matches.length }} {{ round.matches.length === 1 ? localeStore.t('matchSingular') : localeStore.t('matchPlural') }}</p>
                  </div>
                  <div class="deadline-box">
                    <label>
                      {{ localeStore.t('deadline') }}
                      <input v-model="deadlineDrafts[round.roundNumber]" type="date" lang="sv" />
                    </label>
                    <button class="sm secondary" @click="saveRoundDeadline(round.roundNumber)">{{ localeStore.t('save') }}</button>
                  </div>
                </div>
              </div>
              <!-- Matches -->
              <template v-for="(match, idx) in bracketGridMatches" :key="'match-' + match.id">
                <article class="match-card"
                  :style="{ gridColumn: match.gridColumn, gridRow: `${match.gridRow} / span 2` }">
                  <div class="match-meta">Match {{ matchDisplayNumbers.get(match.id) }}</div>
                  <label class="slot-editor">
                    <select
                      v-if="isEditableSlot(match, 'player1')"
                      :value="match.player1_id ?? ''"
                      @change="changeSlot(match, 'player1', $event.target.value)"
                    >
                      <option value="">{{ localeStore.t('selectPlayer') }}</option>
                      <option v-for="participant in slotOptions(match, 'player1')" :key="participant.id" :value="participant.id">{{ participant.name }}</option>
                    </select>
                    <div v-else class="slot-readonly">
                      <template v-if="isWinner(match, 'player1')">🏅 <strong>{{ slotDisplay(match, 'player1') }}</strong></template>
                      <em v-else-if="isWinnerPlaceholder(match, 'player1')">{{ slotDisplay(match, 'player1') }}</em>
                      <template v-else>{{ slotDisplay(match, 'player1') }}</template>
                    </div>
                  </label>
                  <label class="slot-editor">
                    <select
                      v-if="isEditableSlot(match, 'player2')"
                      :value="match.player2_id ?? ''"
                      @change="changeSlot(match, 'player2', $event.target.value)"
                    >
                      <option value="">{{ localeStore.t('selectPlayer') }}</option>
                      <option v-for="participant in slotOptions(match, 'player2')" :key="participant.id" :value="participant.id">{{ participant.name }}</option>
                    </select>
                    <div v-else class="slot-readonly">
                      <template v-if="isWinner(match, 'player2')">🏅 <strong>{{ slotDisplay(match, 'player2') }}</strong></template>
                      <em v-else-if="isWinnerPlaceholder(match, 'player2')">{{ slotDisplay(match, 'player2') }}</em>
                      <template v-else>{{ slotDisplay(match, 'player2') }}</template>
                    </div>
                  </label>
                  <div v-if="canManageResult(match)" class="result-actions">
                    <button
                      class="sm"
                      :disabled="reportingMatchId === match.id"
                      @click="setWinner(match, match.player1_id)"
                    >
                      {{ reportingMatchId === match.id ? localeStore.t('saving') : localeStore.t('p1Won') }}
                    </button>
                    <button
                      class="sm secondary"
                      :disabled="reportingMatchId === match.id"
                      @click="setWinner(match, match.player2_id)"
                    >
                      {{ localeStore.t('p2Won') }}
                    </button>
                    <button
                      v-if="match.winner_id"
                      class="sm secondary"
                      :disabled="reportingMatchId === match.id"
                      @click="resetMatchResult(match)"
                    >
                      {{ localeStore.t('reset') }}
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
import api, {
  addOMPCParticipants,
  createOMPCup,
  deleteOMPCup,
  generateOMPCBracket,
  getOMPCMatches,
  getOMPCup,
  updateOMPCMatchResult,
  updateOMPCMatchSlot,
  updateOMPCRoundDeadline,
} from '../../api/index.js'
import { useAuthStore } from '../../stores/auth.js'
import { useLocaleStore } from '../../stores/locale.js'

const auth = useAuthStore()
const localeStore = useLocaleStore()
const season = ref(new Date().getFullYear())
const cup = ref(null)
const members = ref([])
const selectedMember = ref(null)
const addingParticipant = ref(false)
const resettingSeason = ref(false)
const reportingMatchId = ref(null)
const matches = ref([])
const loading = ref(true)
const errorMessage = ref('')
const deadlineDrafts = ref({})
const MATCH_CARD_HEIGHT = 92
const GRID_TRACK_HEIGHT = 44
const GRID_ROW_GAP = 8

const cupParticipants = computed(() => {
  if (!cup.value) return []
  return cup.value.participants
    .map(id => members.value.find(member => member.id === id))
    .filter(Boolean)
})

const initialRoundAssignments = computed(() => {
  const assignments = new Map()

  for (const match of matches.value.filter(match => match.round === 1)) {
    if (match.player1_id) {
      assignments.set(match.player1_id, { matchId: match.id, slot: 'player1' })
    }
    if (match.player2_id) {
      assignments.set(match.player2_id, { matchId: match.id, slot: 'player2' })
    }
  }

  return assignments
})

const selectableMembers = computed(() => {
  const existing = new Set(cup.value?.participants || [])
  return members.value.filter(member => !existing.has(member.id) && member.active)
})

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
      label: roundLabel(roundNumber, totalRounds, roundMatches.length),
      matches: roundMatches.sort((a, b) => a.match_number - b.match_number),
    }))
})

const bracketGridMatches = computed(() => {
  if (!matches.value.length) return []
  const result = []
  for (const match of matches.value) {
    const col = match.round
    const matchesInRound = matches.value.filter(m => m.round === match.round)
    const roundIdx = matchesInRound.findIndex(m => m.id === match.id)
    const roundOffset = 2 ** (match.round - 1)
    const rowStep = 2 ** match.round
    const row = 1 + roundOffset + roundIdx * rowStep
    result.push({ ...match, gridColumn: col, gridRow: row })
  }
  return result
})

const bracketGridStyle = computed(() => {
  const rounds = bracketRounds.value.length
  const totalTracks = 2 ** rounds
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${rounds}, 300px)`,
    gridTemplateRows: `minmax(132px, auto) repeat(${totalTracks}, ${GRID_TRACK_HEIGHT}px)`,
    gap: `${GRID_ROW_GAP}px 2.5rem`,
    minWidth: 'max-content',
    alignItems: 'center',
  }
})

const bracketSize = computed(() => {
  // Calculate the total number of participants or matches in the bracket
  if (!matches.value.length) return 0
  const totalRounds = Math.max(...matches.value.map(m => m.round))
  return 2 ** totalRounds // Assuming a full bracket with 2^n participants
})

function roundLabel(roundNumber, totalRounds, matchCount) {
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

function feederMatchNumber(matchNumber, slot) {
  return slot === 'player1' ? matchNumber * 2 - 1 : matchNumber * 2
}

function feederDisplayNumber(match, slot) {
  const roundMatches = matchesSortedByRound.value.get(match.round) || []
  const positionInRound = roundMatches.findIndex(m => m.id === match.id) + 1
  const prevRoundMatches = matchesSortedByRound.value.get(match.round - 1) || []
  const feederPosition = slot === 'player1' ? 2 * positionInRound - 1 : 2 * positionInRound
  const feederMatch = prevRoundMatches[feederPosition - 1]
  return feederMatch ? matchDisplayNumbers.value.get(feederMatch.id) : null
}

function isEditableSlot(match, slot) {
  if (match.winner_id) return false

  if (match.round === 1) {
    return true
  }

  const previousRoundMatches = matchesByRound.value.get(match.round - 1) || []
  const expectedMatchNumber = feederMatchNumber(match.match_number, slot)
  return !previousRoundMatches.some(previousMatch => previousMatch.match_number === expectedMatchNumber)
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

  const sourceMatchNumber = feederDisplayNumber(match, slot)
  return localeStore.t('winnerOfMatch', { match: sourceMatchNumber })
}

function memberName(id) {
  if (!id) return ''
  return members.value.find(member => member.id === id)?.name || `Member ${id}`
}

function hydrateDrafts() {
  const nextDeadlines = {}

  for (const match of matches.value) {
    if (!(match.round in nextDeadlines)) {
      nextDeadlines[match.round] = match.deadline_date || ''
    }
  }

  deadlineDrafts.value = nextDeadlines
}

function slotOptions(match, slot) {
  const currentValue = slot === 'player1' ? match.player1_id : match.player2_id
  return cupParticipants.value.filter(participant => {
    if (participant.id === currentValue) {
      return true
    }

    if (isAssignedElsewhere(participant.id, match.id)) {
      return false
    }

    const initialAssignment = initialRoundAssignments.value.get(participant.id)
    if (!initialAssignment) {
      return true
    }

    return initialAssignment.matchId === match.id && initialAssignment.slot === slot
  })
}

function isAssignedElsewhere(memberId, matchId) {
  return matches.value.some(match => match.id !== matchId && (match.player1_id === memberId || match.player2_id === memberId))
}

function canManageResult(match) {
  return !!match.player1_id && !!match.player2_id
}

function participantAssignmentStatus(memberId) {
  const assignment = initialRoundAssignments.value.get(memberId)
  if (!assignment) {
    return { kind: 'unassigned', label: localeStore.t('unassigned') }
  }

  const slotLabel = assignment.slot === 'player1' ? 'P1' : 'P2'
  return {
    kind: 'assigned',
    label: localeStore.t('assignedToMatch', { match: matchNumberById(assignment.matchId), slot: slotLabel }),
  }
}

function matchNumberById(matchId) {
  return matchDisplayNumbers.value.get(matchId) || '?'
}

async function fetchMembers() {
  const res = await api.get('/api/members')
  members.value = res.data
}

async function fetchMatches() {
  if (!cup.value) return
  matches.value = await getOMPCMatches(cup.value.id)
  hydrateDrafts()
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

async function createCup() {
  errorMessage.value = ''

  try {
    await createOMPCup({ season: season.value, created_by: auth.token ? 1 : 1 })
    await fetchCup()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotCreateOmpcCup')
  }
}

async function resetSeason() {
  if (!cup.value || resettingSeason.value) return

  const confirmed = window.confirm(localeStore.t('resetOmpcSeasonConfirm', { season: season.value }))
  if (!confirmed) return

  resettingSeason.value = true
  errorMessage.value = ''

  try {
    await deleteOMPCup(season.value)
    cup.value = null
    matches.value = []
    selectedMember.value = null
    deadlineDrafts.value = {}
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotResetOmpcSeason')
  } finally {
    resettingSeason.value = false
  }
}

async function addParticipant() {
  if (!cup.value || !selectedMember.value) return
  addingParticipant.value = true
  errorMessage.value = ''

  try {
    await addOMPCParticipants(cup.value.id, [selectedMember.value])
    selectedMember.value = null
    await fetchCup()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotAddParticipant')
  } finally {
    addingParticipant.value = false
  }
}

async function generateBracket() {
  if (!cup.value) return
  errorMessage.value = ''

  try {
    await generateOMPCBracket(cup.value.id, deadlineDrafts.value)
    await fetchMatches()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotGenerateBracket')
  }
}

async function changeSlot(match, slot, memberId) {
  errorMessage.value = ''

  try {
    await updateOMPCMatchSlot(match.id, slot, memberId ? Number(memberId) : null)
    await fetchMatches()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotUpdateBracketSlot')
  }
}

async function setWinner(match, winnerId) {
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

async function resetMatchResult(match) {
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

async function saveRoundDeadline(roundNumber) {
  if (!cup.value) return
  errorMessage.value = ''

  try {
    await updateOMPCRoundDeadline(cup.value.id, roundNumber, deadlineDrafts.value[roundNumber] || '')
    await fetchMatches()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || localeStore.t('couldNotUpdateRoundDeadline')
  }
}

const matchesByRound = computed(() => {
  const map = new Map();
  for (const match of matches.value) {
    if (!map.has(match.round)) {
      map.set(match.round, []);
    }
    map.get(match.round).push(match);
  }
  return map;
});

onMounted(async () => {
  console.log('Fetching members...')
  await fetchMembers()
  console.log('Members fetched. Fetching cup...')
  await fetchCup()
  console.log('Cup fetched.')
})
</script>

<style scoped>
.ompc-admin-view {
  display: grid;
  gap: 1.5rem;
}

.page-head,
.section-head,
.participant-controls,
.section-actions,
.round-header,
.match-footer,
.participant-pool {
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

.participant-pool {
  align-items: start;
}

.pool-column {
  flex: 1 1 280px;
  display: grid;
  gap: 0.75rem;
}

.chip-wrap {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.participant-pill {
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-size: 0.88rem;
}

.participant-pill {
  background: #eef2ef;
  color: #345445;
}

.participant-status-list {
  display: grid;
  gap: 0.55rem;
}

.participant-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.assignment-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.assignment-badge.assigned {
  background: #dceee4;
  color: #1f5a3f;
}

.assignment-badge.unassigned {
  background: #f2f4f7;
  color: #667085;
}

.muted-wrap {
  min-height: 2.5rem;
}

.bracket-scroll {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.bracket-header-row {
  display: flex;
  gap: 1.5rem;
  min-width: max-content;
  margin-bottom: 0.5rem;
}
.bracket-header-cell {
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.bracket-grid {
  display: flex;
  gap: 1.5rem;
  min-width: max-content;
  align-items: center;
}

.round-column {
  width: 280px;
  display: grid;
  gap: 1rem;
  align-content: center;
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

.deadline-box {
  display: grid;
  gap: 0.4rem;
  justify-items: stretch;
}

.deadline-box label,
.slot-editor,
.winner-picker {
  display: grid;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.match-stack {
  display: grid;
  gap: var(--round-gap, 1rem);
  justify-items: center;
}

.match-card {
  position: relative;
  display: grid;
  gap: 0.1rem;
  padding: 0.4rem 0.65rem;
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

.round-column:last-child .match-card::after {
  display: none;
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

.slot-editor select {
  width: 100%;
  min-height: 32px;
  height: 32px;
  padding: 0.25rem 0.55rem;
  line-height: 1.1;
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
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.result-actions > button {
  min-width: 0;
}

.winner-state {
  font-size: 0.8rem;
  color: #1f5a3f;
  font-weight: 600;
  margin-top: 0.1rem;
}

@media (max-width: 900px) {
  .round-column {
    width: 250px;
  }

  .round-header-top {
    display: grid;
    white-space: normal;
  }
}
</style>
