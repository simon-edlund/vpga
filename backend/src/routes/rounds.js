const router = require('express').Router()
const db = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

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

// List rounds (optionally filtered by season)
router.get('/', requireAuth, (req, res) => {
  const { season } = req.query
  const rounds = season
    ? db.prepare('SELECT * FROM rounds WHERE season = ? ORDER BY round_number').all(season)
    : db.prepare('SELECT * FROM rounds ORDER BY season DESC, round_number').all()
  res.json(rounds)
})

// Create a round
router.post('/', requireAdmin, (req, res) => {
  const { season, round_number, date, date_end, start_time, course, notes } = req.body
  if (!date) {
    return res.status(400).json({ error: 'Date is required' })
  }
  if (!course?.trim()) {
    return res.status(400).json({ error: 'Course is required' })
  }
  try {
    const r = db.prepare(
      'INSERT INTO rounds (season, round_number, date, date_end, start_time, course, notes) VALUES (?,?,?,?,?,?,?)'
    ).run(season, round_number, date, date_end || '', start_time || '', course.trim(), notes || '')
    res.status(201).json(db.prepare('SELECT * FROM rounds WHERE id = ?').get(r.lastInsertRowid))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Update a round
router.put('/:id', requireAdmin, (req, res) => {
  const { season, round_number, date, date_end, start_time, course, notes } = req.body
  if (!date) {
    return res.status(400).json({ error: 'Date is required' })
  }
  if (!course?.trim()) {
    return res.status(400).json({ error: 'Course is required' })
  }
  try {
    db.prepare('UPDATE rounds SET season=?, round_number=?, date=?, date_end=?, start_time=?, course=?, notes=? WHERE id=?')
      .run(season, round_number, date, date_end || '', start_time || '', course.trim(), notes || '', req.params.id)
    const r = db.prepare('SELECT * FROM rounds WHERE id = ?').get(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json(r)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Delete a round (cascades to scores)
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM rounds WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Scores ────────────────────────────────────────────────────────────────────

// Get scores for a round.
// Active members without an entered score are marked absent and assigned max+1.
// If no scores have been entered at all the round is considered unplayed and
// every member gets score = null.
router.get('/:id/scores', requireAuth, (req, res) => {
  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(req.params.id)
  if (!round) return res.status(404).json({ error: 'Round not found' })

  const members = db.prepare(
    'SELECT id, name FROM members WHERE active = 1 ORDER BY name COLLATE NOCASE'
  ).all()

  const playedRows = db.prepare(
    'SELECT member_id, net_strokes FROM scores WHERE round_id = ?'
  ).all(req.params.id)

  const scoreMap = Object.fromEntries(playedRows.map(s => [s.member_id, s.net_strokes]))
  const roundPlayed = playedRows.length > 0
  const maxScore    = roundPlayed ? Math.max(...playedRows.map(s => s.net_strokes)) : null
  const absentScore = roundPlayed ? maxScore + 1 : null

  const scores = members.map(m => {
    const played = Object.prototype.hasOwnProperty.call(scoreMap, m.id)
    return {
      member_id:   m.id,
      name:        m.name,
      net_strokes: played ? scoreMap[m.id] : absentScore,
      absent:      !played,
    }
  })

  // Sort by net_strokes ascending (nulls last)
  scores.sort((a, b) => {
    if (a.net_strokes === null) return 1
    if (b.net_strokes === null) return -1
    return a.net_strokes - b.net_strokes
  })

  res.json({ round, scores: addPlacementLabels(scores, 'net_strokes') })
})

// Save scores for a round.
// Sends an array of { member_id, net_strokes } for players who participated.
// Any active member NOT in the array is treated as absent (no row stored).
router.put('/:id/scores', requireAdmin, (req, res) => {
  const { scores } = req.body
  if (!Array.isArray(scores)) return res.status(400).json({ error: 'scores must be an array' })

  const save = db.transaction((roundId, scores) => {
    db.prepare('DELETE FROM scores WHERE round_id = ?').run(roundId)
    const insert = db.prepare(
      'INSERT INTO scores (round_id, member_id, net_strokes) VALUES (?,?,?)'
    )
    for (const s of scores) {
      insert.run(roundId, s.member_id, s.net_strokes)
    }
  })

  save(req.params.id, scores)
  res.json({ ok: true })
})

module.exports = router
