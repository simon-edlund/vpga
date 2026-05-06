const router = require('express').Router()
const db = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// List all members
router.get('/', requireAuth, (req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name COLLATE NOCASE').all()
  res.json(members)
})

// Add a member
router.post('/', requireAdmin, (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  const r = db.prepare('INSERT INTO members (name) VALUES (?)').run(name.trim())
  res.status(201).json(db.prepare('SELECT * FROM members WHERE id = ?').get(r.lastInsertRowid))
})

// Update a member
router.put('/:id', requireAdmin, (req, res) => {
  const { name, active } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  db.prepare('UPDATE members SET name = ?, active = ? WHERE id = ?')
    .run(name.trim(), active ? 1 : 0, req.params.id)
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'Not found' })
  res.json(m)
})

// Delete a member
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
