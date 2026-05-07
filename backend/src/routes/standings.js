const router = require('express').Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

// ── Core computation ──────────────────────────────────────────────────────────

function addPlacementLabels(rows, scoreKey) {
  let lastScore = null
  let currentPlace = 0
  let tieCount = 0

  return rows.map((row, index) => {
    const score = row[scoreKey]
    if (score === null) {
      return { ...row, place: null }
    }

    if (lastScore === null || score !== lastScore) {
      currentPlace = index + 1
      tieCount = 1
    } else {
      tieCount += 1
    }

    lastScore = score

    const nextScore = index + 1 < rows.length ? rows[index + 1][scoreKey] : null
    const isTied = tieCount > 1 || nextScore === score

    return {
      ...row,
      place: `${isTied ? 'T' : ''}${currentPlace}`,
    }
  })
}

function computeStandings(season) {
  const members = db.prepare(
    'SELECT id, name FROM members WHERE active = 1 ORDER BY name COLLATE NOCASE'
  ).all()

  const rounds = db.prepare(
    'SELECT * FROM rounds WHERE season = ? ORDER BY round_number'
  ).all(season)

  // All scores for rounds in this season
  const allScores = db.prepare(`
    SELECT s.round_id, s.member_id, s.net_strokes
    FROM scores s
    INNER JOIN rounds r ON r.id = s.round_id
    WHERE r.season = ?
  `).all(season)

  // scoreMap[round_id][member_id] = net_strokes
  const scoreMap = {}
  for (const r of rounds) scoreMap[r.id] = {}
  for (const s of allScores) scoreMap[s.round_id][s.member_id] = s.net_strokes

  // Compute the absent-score (max + 1) for each played round
  const absentScore = {}
  const roundPlayed = {}
  for (const r of rounds) {
    const played = Object.values(scoreMap[r.id])
    roundPlayed[r.id] = played.length > 0
    absentScore[r.id] = played.length > 0 ? Math.max(...played) + 1 : null
  }

  // Build per-member rows
  const standings = members.map(member => {
    const roundScores = rounds.map(round => {
      if (!roundPlayed[round.id]) {
        // Round not played yet – no score for anyone
        return { round_id: round.id, score: null, absent: false }
      }
      const s = scoreMap[round.id][member.id]
      if (s !== undefined) {
        return { round_id: round.id, score: s, absent: false }
      }
      return { round_id: round.id, score: absentScore[round.id], absent: true }
    })

    // Best-4 logic: take the 4 lowest scores from played rounds
    const withScore = roundScores.filter(rs => rs.score !== null)
    const sorted    = [...withScore].sort((a, b) => a.score - b.score)
    const best4     = sorted.slice(0, 4)
    const best4Ids  = new Set(best4.map(rs => rs.round_id))
    const total     = best4.reduce((sum, rs) => sum + rs.score, 0)

    return {
      id:          member.id,
      name:        member.name,
      roundScores: roundScores.map(rs => ({
        ...rs,
        is_best4: rs.score !== null && best4Ids.has(rs.round_id),
      })),
      total: withScore.length > 0 ? total : null,
    }
  })

  // Sort by total ascending, members with no scores last
  standings.sort((a, b) => {
    if (a.total === null) return 1
    if (b.total === null) return -1
    return a.total - b.total
  })

  return {
    season: parseInt(season),
    rounds,
    standings: addPlacementLabels(standings, 'total'),
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// List seasons that have at least one round
router.get('/', requireAuth, (req, res) => {
  const seasons = db.prepare(
    'SELECT DISTINCT season FROM rounds ORDER BY season DESC'
  ).all().map(r => r.season)
  res.json(seasons)
})

// Season standings
router.get('/:season', requireAuth, (req, res) => {
  res.json(computeStandings(req.params.season))
})

module.exports = router
