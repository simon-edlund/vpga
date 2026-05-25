<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ localeStore.t('rounds') }}</h1>
      </div>
      <div class="controls-row">
        <q-btn
          flat
          no-caps
          color="secondary"
          :label="`📅 ${localeStore.t('subscribeCalendar')}`"
          :href="calendarUrl"
          target="_blank"
          rel="noopener"
        />
        <q-select
          v-model="selectedSeason"
          outlined
          dense
          :label="localeStore.t('season')"
          :options="seasons"
          style="min-width: 160px;"
          @update:model-value="loadRounds"
        />
      </div>
    </div>

    <q-card v-if="rounds.length === 0" flat bordered class="surface-card">
      <q-card-section>{{ localeStore.t('noRoundsForSeason', { season: selectedSeason }) }}</q-card-section>
    </q-card>

    <q-card v-else flat bordered class="table-card surface-table">
      <q-card-section class="q-pa-none table-wrap">
        <q-markup-table flat separator="cell" wrap-cells>
          <thead>
            <tr>
              <th>{{ localeStore.t('round') }}</th>
              <th>{{ localeStore.t('date') }}</th>
              <th>{{ localeStore.t('course') }}</th>
              <th>{{ localeStore.t('notes') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="round in rounds" :key="round.id">
              <td>VPGA{{ round.round_number }}</td>
              <td>{{ formatRoundDate(round) }}</td>
              <td>{{ round.course }}</td>
              <td class="muted-text">{{ round.notes }}</td>
              <td>
                <q-btn flat dense no-caps color="secondary" :to="`/round/${round.id}`" :label="`${localeStore.t('viewScores')} →`" />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'
import { addHoursToTime } from '../utils/duration.js'

const seasons = ref([])
const selectedSeason = ref(new Date().getFullYear())
const rounds = ref([])
const localeStore = useLocaleStore()
const calendarUrl = `${window.location.protocol}//${window.location.hostname}:3001/api/calendar/vpga.ics`

function formatRoundDate(round) {
  if (round.start_time) {
    const end = addHoursToTime(round.start_time, 6)
    return `${round.date} · ${round.start_time}${end ? ' – ' + end : ''}`
  }
  if (round.date_end) return `${round.date} – ${round.date_end}`
  return round.date
}

async function loadSeasons() {
  const res = await api.get('/api/standings')
  seasons.value = res.data
  if (seasons.value.length > 0) {
    selectedSeason.value = seasons.value[0]
    await loadRounds()
  }
}

async function loadRounds() {
  if (!selectedSeason.value) return
  const res = await api.get('/api/rounds', { params: { season: selectedSeason.value } })
  rounds.value = res.data
}

onMounted(loadSeasons)
</script>
