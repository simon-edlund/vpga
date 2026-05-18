const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const rateLimit = require('express-rate-limit')
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

const loginRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
})

const setupEmailRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
})

function issueMemberToken(member) {
  return jwt.sign(
    { id: member.id, email: member.email, name: member.name, is_admin: !!member.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function issuePasswordSetupToken(member) {
  return jwt.sign(
    { member_id: member.id, email: member.email, type: 'password_setup' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  if (!host || !user || !pass || !from) return null

  const port = Number(process.env.SMTP_PORT || 587)
  const secureSetting = process.env.SMTP_SECURE
  const secure = secureSetting === undefined || secureSetting === ''
    ? port === 465
    : secureSetting === 'true'
  return { host, port, secure, user, pass, from }
}

function getSmtpTransport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })
}

function buildPasswordSetupLink(setupToken) {
  let appBaseUrl = process.env.APP_BASE_URL
  if (!appBaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_BASE_URL must be configured in production')
    }
    appBaseUrl = 'http://localhost:5173'
  }
  const url = new URL('/login', appBaseUrl)
  url.searchParams.set('setup_token', setupToken)
  return url.toString()
}

async function sendPasswordSetupEmail(member, setupToken) {
  const setupLink = buildPasswordSetupLink(setupToken)
  const smtpConfig = getSmtpConfig()

  if (!smtpConfig) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP configuration is missing')
    }
    console.warn('SMTP is not configured. Password setup link:', setupLink)
    return
  }

  const transport = getSmtpTransport(smtpConfig)
  await transport.sendMail({
    from: smtpConfig.from,
    to: member.email,
    subject: 'VPGA - Set your password',
    text: [
      'Hi,',
      '',
      'Use the link below to set (or reset) your VPGA password.',
      'The link expires in 24 hours.',
      '',
      setupLink,
      '',
      'If you did not request this email, you can ignore it.',
    ].join('\n'),
  })
}

router.post('/dev-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' })
  }

  const member = db.prepare('SELECT * FROM members WHERE email = ? AND active = 1').get('simon@edlund.nl')
  if (!member) {
    return res.status(404).json({ error: 'Development user not found' })
  }

  const token = issueMemberToken(member)
  res.json({ token, is_admin: !!member.is_admin, name: member.name, email: member.email })
})

router.post('/login', loginRateLimit, async (req, res) => {
  const { email, password } = req.body
  const member = db.prepare('SELECT * FROM members WHERE email = ? AND active = 1').get((email || '').trim().toLowerCase())
  if (!member) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  if (!member.password_hash || !member.email_verified) {
    try {
      await sendPasswordSetupEmail(member, issuePasswordSetupToken(member))
      return res.json({ first_login: true, email: member.email })
    } catch (error) {
      console.error('Could not send first-login email', error)
      return res.status(500).json({ error: 'Could not send validation email' })
    }
  }

  if (!password || !bcrypt.compareSync(password, member.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = issueMemberToken(member)
  res.json({ token, is_admin: !!member.is_admin, name: member.name, email: member.email })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

router.post('/request-password-setup', setupEmailRateLimit, async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase()
  const member = db.prepare('SELECT * FROM members WHERE email = ? AND active = 1').get(email)
  if (!member) {
    return res.json({ ok: true })
  }

  try {
    await sendPasswordSetupEmail(member, issuePasswordSetupToken(member))
    return res.json({ ok: true })
  } catch (error) {
    console.error('Could not send password setup email', error)
    return res.status(500).json({ error: 'Could not send reset email' })
  }
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

  if (payload.type !== 'password_setup') {
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

  const token = issueMemberToken(member)
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
