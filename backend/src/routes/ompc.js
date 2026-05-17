
const express = require('express')
const db = require('../db')

const router = express.Router()

function getParticipantIds(cupId) {
  return db.prepare('SELECT member_id FROM ompc_participants WHERE cup_id = ? ORDER BY member_id').all(cupId).map(row => row.member_id)
}

function getRoundCount(participantCount) {
  return Math.ceil(Math.log2(Math.max(2, participantCount)))
}

function getRoundMatchCounts(participantCount) {
  const normalizedCount = Math.max(2, participantCount)
  const bracketSize = 2 ** Math.ceil(Math.log2(normalizedCount))
  const previousPowerOfTwo = 2 ** Math.floor(Math.log2(normalizedCount))
  const matchCounts = []

  if (normalizedCount === previousPowerOfTwo) {
    let playersInStage = normalizedCount
    while (playersInStage > 1) {
      matchCounts.push(playersInStage / 2)
      playersInStage /= 2
    }
    return matchCounts
  }

  matchCounts.push(normalizedCount - previousPowerOfTwo)

  let playersInStage = previousPowerOfTwo
  while (playersInStage > 1) {
    matchCounts.push(playersInStage / 2)
    playersInStage /= 2
  }

  return matchCounts
}

function clearNextRoundSlot(cupId, round, matchNumber, slotColumn) {
  db.prepare(`UPDATE ompc_matches SET ${slotColumn} = NULL, winner_id = NULL, status = 'pending' WHERE cup_id = ? AND round = ? AND match_number = ?`)
    .run(cupId, round, matchNumber)
}

function advanceWinner(matchId, winnerId, status) {
  const match = db.prepare('SELECT * FROM ompc_matches WHERE id = ?').get(matchId)
  if (!match) {
    throw new Error('Match not found')
  }

  db.prepare('UPDATE ompc_matches SET winner_id = ?, status = ? WHERE id = ?').run(winnerId, status || 'completed', matchId)

  const nextRound = match.round + 1
  const nextMatchNumber = Math.ceil(match.match_number / 2)
  const slotColumn = match.match_number % 2 === 1 ? 'player1_id' : 'player2_id'
  const nextMatch = db.prepare('SELECT id FROM ompc_matches WHERE cup_id = ? AND round = ? AND match_number = ?').get(match.cup_id, nextRound, nextMatchNumber)

  if (nextMatch) {
    db.prepare(`UPDATE ompc_matches SET ${slotColumn} = ?, winner_id = NULL, status = CASE WHEN status = 'completed' THEN 'pending' ELSE status END WHERE id = ?`)
      .run(winnerId, nextMatch.id)
  }
}

router.get('/cup/:season', (req, res) => {
  const { season } = req.params
  const cup = db.prepare('SELECT * FROM ompc_cup WHERE season = ?').get(season)
  if (!cup) return res.status(404).json({ error: 'OMPC cup not found' })

  const participants = getParticipantIds(cup.id)
  res.json({ ...cup, participants })
})

router.post('/cup', (req, res) => {
  const { season, created_by } = req.body

  try {
    const existingCup = db.prepare('SELECT * FROM ompc_cup WHERE season = ?').get(season)
    if (existingCup) {
      return res.json({ id: existingCup.id, existing: true })
    }

    const now = new Date().toISOString()
    const result = db.prepare('INSERT INTO ompc_cup (season, created_by, created_at) VALUES (?, ?, ?)').run(season, created_by, now)
    res.json({ id: result.lastInsertRowid })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/cup/:season', (req, res) => {
  const { season } = req.params
  const existingCup = db.prepare('SELECT id FROM ompc_cup WHERE season = ?').get(season)

  if (!existingCup) {
    return res.status(404).json({ error: 'OMPC cup not found' })
  }

  db.prepare('DELETE FROM ompc_cup WHERE season = ?').run(season)
  res.json({ success: true })
})

router.post('/cup/:cup_id/participants', (req, res) => {
  const { cup_id } = req.params
  const { member_ids } = req.body
  const insert = db.prepare('INSERT OR IGNORE INTO ompc_participants (cup_id, member_id) VALUES (?, ?)')
  const tx = db.transaction(ids => {
    ids.forEach(memberId => insert.run(cup_id, memberId))
  })

  try {
    tx(member_ids)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/cup/:cup_id/matches', (req, res) => {
  const { cup_id } = req.params
  const matches = db.prepare('SELECT * FROM ompc_matches WHERE cup_id = ? ORDER BY round ASC, match_number ASC, id ASC').all(cup_id)
  res.json(matches)
})

router.post('/cup/:cup_id/generate-bracket', (req, res) => {
  const { cup_id } = req.params
  const { deadlines = {} } = req.body
  const participantIds = getParticipantIds(cup_id)

  if (participantIds.length < 2) {
    return res.status(400).json({ error: 'At least 2 participants required' })
  }

  const totalRounds = getRoundCount(participantIds.length)
  const roundMatchCounts = getRoundMatchCounts(participantIds.length)
  const insertMatch = db.prepare(`
    INSERT INTO ompc_matches (
      cup_id, round, match_number, player1_id, player2_id, scheduled_date, deadline_date, status
    ) VALUES (?, ?, ?, NULL, NULL, '', ?, 'pending')
  `)

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM ompc_matches WHERE cup_id = ?').run(cup_id)

    for (let round = 1; round <= totalRounds; round += 1) {
      const matchesInRound = roundMatchCounts[round - 1]
      for (let matchNumber = 1; matchNumber <= matchesInRound; matchNumber += 1) {
        insertMatch.run(cup_id, round, matchNumber, deadlines[round] || '')
      }
    }
  })

  tx()
  res.json({ success: true, total_rounds: totalRounds })
})

router.put('/match/:match_id/slot', (req, res) => {
  const { match_id } = req.params
  const { slot, member_id } = req.body

  if (!['player1', 'player2'].includes(slot)) {
    return res.status(400).json({ error: 'Invalid slot' })
  }

  const match = db.prepare('SELECT * FROM ompc_matches WHERE id = ?').get(match_id)
  if (!match) {
    return res.status(404).json({ error: 'Match not found' })
  }

  const targetColumn = slot === 'player1' ? 'player1_id' : 'player2_id'
  const otherColumn = slot === 'player1' ? 'player2_id' : 'player1_id'

  const tx = db.transaction(() => {
    if (member_id) {
      db.prepare(`UPDATE ompc_matches SET player1_id = CASE WHEN player1_id = ? THEN NULL ELSE player1_id END, player2_id = CASE WHEN player2_id = ? THEN NULL ELSE player2_id END, winner_id = CASE WHEN winner_id = ? THEN NULL ELSE winner_id END, status = 'pending' WHERE cup_id = ?`)
        .run(member_id, member_id, member_id, match.cup_id)
    }

    db.prepare(`UPDATE ompc_matches SET ${targetColumn} = ?, winner_id = NULL, status = CASE WHEN ${otherColumn} IS NULL AND ? IS NULL THEN 'pending' ELSE status END WHERE id = ?`)
      .run(member_id || null, member_id || null, match_id)

    if (match.round < db.prepare('SELECT MAX(round) AS max_round FROM ompc_matches WHERE cup_id = ?').get(match.cup_id).max_round) {
      const nextRound = match.round + 1
      const nextMatchNumber = Math.ceil(match.match_number / 2)
      const nextSlotColumn = match.match_number % 2 === 1 ? 'player1_id' : 'player2_id'
      clearNextRoundSlot(match.cup_id, nextRound, nextMatchNumber, nextSlotColumn)
    }
  })

  tx()
  res.json({ success: true })
})

router.put('/cup/:cup_id/round/:round/deadline', (req, res) => {
  const { cup_id, round } = req.params
  const { deadline_date } = req.body

  db.prepare('UPDATE ompc_matches SET deadline_date = ? WHERE cup_id = ? AND round = ?').run(deadline_date || '', cup_id, round)
  res.json({ success: true })
})

router.post('/match/:match_id/result', (req, res) => {
  const { match_id } = req.params
  const { winner_id, status } = req.body

  try {
    advanceWinner(match_id, winner_id || null, status)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
