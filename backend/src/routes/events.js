const router = require('express').Router()
const db = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// List all events
router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM events ORDER BY date, id').all())
})

// Create an event
router.post('/', requireAdmin, (req, res) => {
  const { title, date, date_end, start_time, description, notes } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
  if (!date)          return res.status(400).json({ error: 'Date is required' })
  const r = db.prepare(
    'INSERT INTO events (title, date, date_end, start_time, description, notes) VALUES (?,?,?,?,?,?)'
  ).run(title.trim(), date, date_end || '', start_time || '', description || '', notes || '')
  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(r.lastInsertRowid))
})

// Update an event
router.put('/:id', requireAdmin, (req, res) => {
  const { title, date, date_end, start_time, description, notes } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
  if (!date)          return res.status(400).json({ error: 'Date is required' })
  db.prepare('UPDATE events SET title=?, date=?, date_end=?, start_time=?, description=?, notes=? WHERE id=?')
    .run(title.trim(), date, date_end || '', start_time || '', description || '', notes || '', req.params.id)
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!ev) return res.status(404).json({ error: 'Not found' })
  res.json(ev)
})

// Delete an event
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
