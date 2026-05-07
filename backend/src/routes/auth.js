const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

router.post('/login', (req, res) => {
  const { email, password } = req.body
  const member = db.prepare('SELECT * FROM members WHERE email = ? AND active = 1').get((email || '').trim().toLowerCase())
  if (!member) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  if (!member.password_hash || !member.email_verified) {
    const setup_token = jwt.sign(
      { member_id: member.id, email: member.email, type: 'setup' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    return res.json({
      first_login: true,
      setup_token,
      email: member.email,
      name: member.name,
    })
  }

  if (!password || !bcrypt.compareSync(password, member.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: member.id, email: member.email, name: member.name, is_admin: !!member.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token, is_admin: !!member.is_admin, name: member.name, email: member.email })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

router.post('/complete-first-login', (req, res) => {
  const { setup_token, password } = req.body
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  let payload
  try {
    payload = jwt.verify(setup_token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Invalid or expired setup token' })
  }

  if (payload.type !== 'setup') {
    return res.status(401).json({ error: 'Invalid setup token' })
  }

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(payload.member_id)
  if (!member) {
    return res.status(404).json({ error: 'Member not found' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  db.prepare(
    'UPDATE members SET password_hash = ?, email_verified = 1 WHERE id = ?'
  ).run(passwordHash, member.id)

  const token = jwt.sign(
    { id: member.id, email: member.email, name: member.name, is_admin: !!member.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token, is_admin: !!member.is_admin, name: member.name, email: member.email })
})

router.post('/change-password', requireAuth, (req, res) => {
  const { old_password, new_password } = req.body
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.user.id)
  if (!member?.password_hash || !bcrypt.compareSync(old_password, member.password_hash)) {
    return res.status(400).json({ error: 'Current password is wrong' })
  }
  db.prepare('UPDATE members SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(new_password, 10), req.user.id)
  res.json({ ok: true })
})

module.exports = router
