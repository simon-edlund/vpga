import axios from 'axios'
import router from '../router/index.js'

const api = axios.create()

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

// OMPC API
export async function getOMPCup(season) {
  const { data } = await api.get(`/api/ompc/cup/${season}`)
  return data
}
export async function createOMPCup({ season, created_by }) {
  const { data } = await api.post('/api/ompc/cup', { season, created_by })
  return data
}
export async function deleteOMPCup(season) {
  const { data } = await api.delete(`/api/ompc/cup/${season}`)
  return data
}
export async function addOMPCParticipants(cup_id, member_ids) {
  const { data } = await api.post(`/api/ompc/cup/${cup_id}/participants`, { member_ids })
  return data
}
export async function getOMPCMatches(cup_id) {
  const { data } = await api.get(`/api/ompc/cup/${cup_id}/matches`)
  return data
}
export async function generateOMPCBracket(cup_id, deadlines) {
  const { data } = await api.post(`/api/ompc/cup/${cup_id}/generate-bracket`, { deadlines })
  return data
}
export async function updateOMPCMatchSlot(matchId, slot, memberId) {
  const { data } = await api.put(`/api/ompc/match/${matchId}/slot`, { slot, member_id: memberId })
  return data
}
export async function updateOMPCRoundDeadline(cupId, round, deadlineDate) {
  const { data } = await api.put(`/api/ompc/cup/${cupId}/round/${round}/deadline`, { deadline_date: deadlineDate })
  return data
}
export async function updateOMPCMatchResult(matchId, winnerId, status = 'completed') {
  const { data } = await api.post(`/api/ompc/match/${matchId}/result`, { winner_id: winnerId, status })
  return data
}
export { api }
export default api
