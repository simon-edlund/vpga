<template>
  <div>
    <h2>{{ localeStore.t('rounds') }}</h2>

    <p style="margin-bottom:1rem">
      <a :href="calendarUrl" target="_blank" rel="noopener" class="cal-link">📅 {{ localeStore.t('subscribeCalendar') }}</a>
    </p>

    <div class="controls">
      <label>
        {{ localeStore.t('season') }}
        <select v-model="selectedSeason" @change="loadRounds">
          <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <p v-if="rounds.length === 0" class="card">{{ localeStore.t('noRoundsForSeason', { season: selectedSeason }) }}</p>

    <table v-else>
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
          <td style="color:#6b7280;font-size:0.88rem">{{ round.notes }}</td>
          <td>
            <router-link :to="'/rounds/' + round.id">{{ localeStore.t('viewScores') }} →</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'
import { addHoursToTime } from '../utils/duration.js'

const seasons        = ref([])
const selectedSeason = ref(new Date().getFullYear())
const rounds         = ref([])
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
  const res = await api.get('/api/rounds', { params: { season: selectedSeason.value } })
  rounds.value = res.data
}

onMounted(loadSeasons)
</script>
