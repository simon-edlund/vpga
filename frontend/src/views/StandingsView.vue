<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ localeStore.t('seasonStandings') }}</h1>
      </div>
      <div class="controls-row">
        <q-select
          v-model="selectedSeason"
          outlined
          dense
          :label="localeStore.t('season')"
          :options="seasons"
          style="min-width: 160px;"
          @update:model-value="loadStandings"
        />
      </div>
    </div>

    <q-banner v-if="loading" dense rounded class="bg-grey-2 text-grey-8">{{ localeStore.t('loading') }}</q-banner>

    <q-card v-else-if="data && data.rounds.length === 0" flat bordered class="surface-card">
      <q-card-section>
        {{ localeStore.t('noRoundsForSeason', { season: selectedSeason }) }}
      </q-card-section>
    </q-card>

    <q-card v-else-if="data" flat bordered class="table-card surface-table">
      <q-card-section class="q-pa-none table-wrap">
        <q-markup-table flat separator="cell" wrap-cells>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ localeStore.t('player') }}</th>
              <th v-for="round in data.rounds" :key="round.id" class="text-center">
                <router-link :to="`/round/${round.id}`" class="text-white">
                  VPGA{{ round.round_number }}
                </router-link>
                <div class="text-caption text-weight-regular" style="opacity: 0.85;">{{ round.date }}</div>
              </th>
              <th class="text-center">{{ localeStore.t('best4') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in data.standings" :key="member.id">
              <td>{{ member.place ?? '–' }}</td>
              <td>{{ member.name }}</td>
              <td
                v-for="rs in member.roundScores"
                :key="rs.round_id"
                :class="[rs.is_best4 ? 'best4' : '', rs.absent ? 'absent' : '']"
                class="text-center"
              >
                <span v-if="rs.score !== null">
                  {{ rs.score }}<sup v-if="rs.absent" :title="localeStore.t('absent')">*</sup>
                </span>
                <span v-else class="text-grey-5">–</span>
              </td>
              <td class="total text-center">{{ member.total ?? '–' }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
      <q-card-section>
        <p class="legend q-ma-none">
          <strong>{{ localeStore.t('best4') }}</strong> {{ localeStore.t('best4Legend') }} &nbsp; * {{ localeStore.t('absentLegend') }}
        </p>
      </q-card-section>
    </q-card>

    <q-card v-else-if="!loading" flat bordered class="surface-card">
      <q-card-section>{{ localeStore.t('noSeasonsFound') }}</q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'

const seasons = ref([])
const selectedSeason = ref(new Date().getFullYear())
const data = ref(null)
const loading = ref(false)
const localeStore = useLocaleStore()

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
  if (!selectedSeason.value) return
  loading.value = true
  data.value = null
  try {
    const res = await api.get(`/api/standings/${selectedSeason.value}`)
    data.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(loadSeasons)
</script>
