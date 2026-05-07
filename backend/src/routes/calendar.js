const router = require('express').Router()
const db = require('../db')

// ── iCal helpers ──────────────────────────────────────────────────────────────

function icalDate(dateStr) {
  // dateStr: 'YYYY-MM-DD' → 'YYYYMMDD'
  return dateStr.replace(/-/g, '')
}

function icalDateTime(dateStr, timeStr) {
  // Returns local-time datetime string without Z (naive local), with TZID Europe/Stockholm
  const [h, m] = timeStr.split(':').map(Number)
  return `${icalDate(dateStr)}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
}

function addHours(dateStr, timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  d.setHours(d.getHours() + hours)
  const yy = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${yy}${mo}${dd}T${hh}${mm}00`
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + n)
  const yy = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}${mo}${dd}`
}

function foldLine(line) {
  // iCal lines must be at most 75 octets; fold longer lines
  const bytes = Buffer.from(line, 'utf8')
  if (bytes.length <= 75) return line
  const chunks = []
  let pos = 0
  while (pos < bytes.length) {
    const limit = pos === 0 ? 75 : 74
    chunks.push(bytes.slice(pos, pos + limit).toString('utf8'))
    pos += limit
  }
  return chunks.join('\r\n ')
}

function buildIcs(items) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VPGA//Golf Tour//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:VPGA',
    'X-WR-TIMEZONE:Europe/Stockholm',
    'X-WR-CALDESC:VPGA Golf Tour tävlingskalender',
  ]

  for (const item of items) {
    const uid      = item.uid
    const summary  = item.title
    const location = item.course || ''
    const hasTime  = item.start_time && item.start_time.trim() !== ''
    const hasEnd   = item.date_end  && item.date_end.trim()  !== ''

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(foldLine(`SUMMARY:${summary}`))
    if (location) lines.push(foldLine(`LOCATION:${location}`))
    if (item.notes) lines.push(foldLine(`DESCRIPTION:${item.notes}`))

    if (hasTime) {
      lines.push(`DTSTART;TZID=Europe/Stockholm:${icalDateTime(item.date, item.start_time)}`)
      lines.push(`DTEND;TZID=Europe/Stockholm:${addHours(item.date, item.start_time, 6)}`)
    } else if (hasEnd) {
      lines.push(`DTSTART;VALUE=DATE:${icalDate(item.date)}`)
      lines.push(`DTEND;VALUE=DATE:${addDays(item.date_end, 1)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icalDate(item.date)}`)
      lines.push(`DTEND;VALUE=DATE:${addDays(item.date, 1)}`)
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

// ── Public route (no auth) ────────────────────────────────────────────────────

router.get('/vpga.ics', (req, res) => {
  const rounds = db.prepare(
    'SELECT * FROM rounds ORDER BY season, round_number'
  ).all()

  // Map rounds to the same shape buildIcs expects, add a generated title
  const roundItems = rounds.map(r => ({
    ...r,
    title: `VPGA${r.round_number}${r.course ? ' – ' + r.course : ''}`,
    uid:   `vpga-round-${r.id}@vpga`,
  }))

  // Custom admin events
  const eventItems = db.prepare(
    'SELECT * FROM events ORDER BY date, id'
  ).all().map(e => ({
    ...e,
    uid: `vpga-event-${e.id}@vpga`,
  }))

  const ics = buildIcs([...roundItems, ...eventItems])
  res.set('Content-Type', 'text/calendar; charset=utf-8')
  res.set('Content-Disposition', 'attachment; filename="vpga.ics"')
  res.send(ics)
})

module.exports = router
