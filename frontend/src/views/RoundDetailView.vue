<template>
  <div>
    <router-link to="/" class="back-link">← {{ localeStore.t('backToStandings') }}</router-link>

    <div v-if="round">
      <h2>VPGA{{ round.round_number }} &mdash; {{ round.date }}</h2>
      <p v-if="round.course" style="color:#6b7280;margin-bottom:1rem">📍 {{ round.course }}</p>
      <p v-if="round.notes"  style="color:#6b7280;margin-bottom:1rem">{{ round.notes }}</p>
    </div>

    <p v-if="loading" class="loading">{{ localeStore.t('loading') }}</p>

    <template v-else-if="scores.length > 0">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{{ localeStore.t('player') }}</th>
            <th style="text-align:center">{{ localeStore.t('netStrokes') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in scores"
            :key="s.member_id"
            :class="{ 'absent-row': s.absent }"
          >
            <td>{{ s.place ?? '–' }}</td>
            <td>{{ s.name }}</td>
            <td style="text-align:center">
              <span v-if="s.net_strokes !== null">
                {{ s.net_strokes }}<sup v-if="s.absent" :title="localeStore.t('absent')">*</sup>
              </span>
              <span v-else style="color:#ccc">–</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="scores.some(s => s.absent)" class="legend">
        * {{ localeStore.t('absentLegend') }}
      </p>
    </template>

    <div v-else-if="!loading" class="card">
      {{ localeStore.t('noScoresYet') }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/index.js'
import { useLocaleStore } from '../stores/locale.js'

const route   = useRoute()
const round   = ref(null)
const scores  = ref([])
const loading = ref(true)
const localeStore = useLocaleStore()

onMounted(async () => {
  try {
    const res = await api.get(`/api/rounds/${route.params.id}/scores`)
    round.value  = res.data.round
    scores.value = res.data.scores
  } finally {
    loading.value = false
  }
})
</script>
