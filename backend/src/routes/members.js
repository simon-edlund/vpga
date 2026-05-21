const router = require('express').Router()
const db = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { updateMemberHcp, updateAllMembersHcp, MEMBER_COLS } = require('../hcpUpdater')

// List all members
router.get('/', requireAuth, (req, res) => {
  const members = db.prepare(
    `SELECT ${MEMBER_COLS} FROM members ORDER BY name COLLATE NOCASE`
  ).all()
  res.json(members)
})

// Add a member
router.post('/', requireAdmin, (req, res) => {
  const { name, golf_id, handicap, email } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
  try {
    const r = db.prepare(
      'INSERT INTO members (name, golf_id, handicap, email) VALUES (?, ?, ?, ?)'
    ).run(
      name.trim(),
      (golf_id || '').trim(),
      Number.isFinite(Number(handicap)) ? Number(handicap) : 0,
      email.trim().toLowerCase()
    )
    res.status(201).json(
      db.prepare(`SELECT ${MEMBER_COLS} FROM members WHERE id = ?`).get(r.lastInsertRowid)
    )
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update a member
router.put('/:id', requireAdmin, (req, res) => {
  const { name, golf_id, handicap, email, active, is_admin } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
  try {
    db.prepare(
      'UPDATE members SET name = ?, golf_id = ?, handicap = ?, email = ?, active = ?, is_admin = ? WHERE id = ?'
    ).run(
      name.trim(),
      (golf_id || '').trim(),
      Number.isFinite(Number(handicap)) ? Number(handicap) : 0,
      email.trim().toLowerCase(),
      active ? 1 : 0,
      is_admin ? 1 : 0,
      req.params.id
    )
    const m = db.prepare(
      `SELECT ${MEMBER_COLS} FROM members WHERE id = ?`
    ).get(req.params.id)
    if (!m) return res.status(404).json({ error: 'Not found' })
    res.json(m)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Reset a member login so first-login setup must be completed again
router.post('/:id/reset-login', requireAdmin, (req, res) => {
  const result = db.prepare(
    'UPDATE members SET password_hash = NULL, email_verified = 0 WHERE id = ?'
  ).run(req.params.id)

  if (!result.changes) {
    return res.status(404).json({ error: 'Not found' })
  }

  const member = db.prepare(
    `SELECT ${MEMBER_COLS} FROM members WHERE id = ?`
  ).get(req.params.id)

  res.json(member)
})

// Delete a member
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// Trigger HCP update for a single member
router.post('/:id/update-hcp', requireAdmin, async (req, res) => {
  try {
    const member = await updateMemberHcp(req.params.id)
    res.json(member)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Trigger HCP update for all active members
router.post('/update-hcp-all', requireAdmin, async (req, res) => {
  // Respond immediately; run update in background
  res.json({ ok: true })
  updateAllMembersHcp().catch(err => {
    console.error(`[${new Date().toISOString()}] Manual HCP update-all error: ${err.message}`)
  })
})

module.exports = router
