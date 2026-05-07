const router = require('express').Router()
const db = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// List all members
router.get('/', requireAuth, (req, res) => {
  const members = db.prepare(
    'SELECT id, name, golf_id, handicap, email, active, is_admin, email_verified FROM members ORDER BY name COLLATE NOCASE'
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
      db.prepare('SELECT id, name, golf_id, handicap, email, active, is_admin, email_verified FROM members WHERE id = ?').get(r.lastInsertRowid)
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
      'SELECT id, name, golf_id, handicap, email, active, is_admin, email_verified FROM members WHERE id = ?'
    ).get(req.params.id)
    if (!m) return res.status(404).json({ error: 'Not found' })
    res.json(m)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete a member
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
