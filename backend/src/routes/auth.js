const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: !!user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token, is_admin: !!user.is_admin, username: user.username })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

router.post('/change-password', requireAuth, (req, res) => {
  const { old_password, new_password } = req.body
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!bcrypt.compareSync(old_password, user.password_hash)) {
    return res.status(400).json({ error: 'Current password is wrong' })
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(new_password, 10), req.user.id)
  res.json({ ok: true })
})

module.exports = router
