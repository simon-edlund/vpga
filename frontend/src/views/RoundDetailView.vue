<template>
  <div class="page-stack">
    <router-link to="/rounds" class="back-link">← {{ localeStore.t('backToRounds') }}</router-link>

    <div v-if="round" class="page-stack" style="gap: 0.5rem;">
      <h1 class="page-title">VPGA{{ round.round_number }} — {{ round.date }}</h1>
      <p v-if="round.course" class="page-subtitle q-ma-none">📍 {{ round.course }}</p>
      <p v-if="round.notes" class="page-subtitle q-ma-none">{{ round.notes }}</p>
    </div>

    <q-banner v-if="loading" dense rounded class="bg-grey-2 text-grey-8">{{ localeStore.t('loading') }}</q-banner>

    <q-card v-else-if="scores.length > 0" flat bordered class="table-card surface-table">
      <q-card-section class="q-pa-none table-wrap">
        <q-markup-table flat separator="cell" wrap-cells>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ localeStore.t('player') }}</th>
              <th class="text-center">{{ localeStore.t('netStrokes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in scores" :key="s.member_id" :class="{ 'absent-row': s.absent }">
              <td>{{ s.place ?? '–' }}</td>
              <td>{{ s.name }}</td>
              <td class="text-center">
                <span v-if="s.net_strokes !== null">
                  {{ s.net_strokes }}<sup v-if="s.absent" :title="localeStore.t('absent')">*</sup>
                </span>
                <span v-else class="text-grey-5">–</span>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
      <q-card-section v-if="scores.some(s => s.absent)">
        <p class="legend q-ma-none">* {{ localeStore.t('absentLegend') }}</p>
      </q-card-section>
    </q-card>

    <q-card v-else-if="!loading" flat bordered class="surface-card">
      <q-card-section>{{ localeStore.t('noScoresYet') }}</q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'

const route = useRoute()
const round = ref(null)
const scores = ref([])
const loading = ref(true)
const localeStore = useLocaleStore()

onMounted(async () => {
  try {
    const res = await api.get(`/api/rounds/${route.params.id}/scores`)
    round.value = res.data.round
    scores.value = res.data.scores
  } finally {
    loading.value = false
  }
})
</script>
