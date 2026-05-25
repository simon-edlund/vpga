const router = require('express').Router()
const db = require('../db')

// ── iCal helpers ──────────────────────────────────────────────────────────────
const SAFE_LOCAL_HOUR = 12

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
  const d = new Date(`${dateStr}T${String(SAFE_LOCAL_HOUR).padStart(2, '0')}:00:00`)
  d.setDate(d.getDate() + n)
  const yy = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}${mo}${dd}`
}

function toIsoDateString(date) {
  const yy = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mo}-${dd}`
}

function validateIsoDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr || '') ? dateStr : ''
}

function getIcsCutoffDate(now = new Date()) {
  const cutoff = new Date(now.getTime())
  cutoff.setHours(SAFE_LOCAL_HOUR, 0, 0, 0)
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  return toIsoDateString(cutoff)
}

function getEffectiveEndDate(item) {
  const dateEnd = typeof item.date_end === 'string' ? item.date_end.trim() : ''
  const date = typeof item.date === 'string' ? item.date : ''
  return dateEnd !== '' ? dateEnd : date
}

function shouldIncludeIcsItem(item, cutoffDate) {
  const endDate = validateIsoDate(getEffectiveEndDate(item))
  const validCutoffDate = validateIsoDate(cutoffDate)
  return !!endDate && !!validCutoffDate && endDate >= validCutoffDate
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

function buildIcs(items, currentDate = new Date()) {
  const now = currentDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const cutoffDate = getIcsCutoffDate(currentDate)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VPGA//Golf Tour//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:VPGA',
    'X-WR-TIMEZONE:Europe/Stockholm',
    'X-WR-CALDESC:VPGA Golf Tour tävlingskalender',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Stockholm',
    'X-LIC-LOCATION:Europe/Stockholm',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]

  for (const item of items) {
    if (!shouldIncludeIcsItem(item, cutoffDate)) continue

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
    const description = item.description || item.notes || ''
    if (description) lines.push(foldLine(`DESCRIPTION:${description}`))

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


// ── Language-specific iCal endpoints ──
function getOmpcRoundName(round, lang = 'sv', roundNameMap = {}) {
  const names = {
    sv: {
      32: 'Sextondelsfinaler',
      16: 'Åttondelsfinaler',
      8:  'Kvartsfinaler',
      4:  'Semifinaler',
      2:  'Final',
    },
    en: {
      32: 'Round of 32',
      16: 'Round of 16',
      8:  'Quarterfinals',
      4:  'Semifinals',
      2:  'Final',
    }
  }
  const size = [32, 16, 8, 4, 2].find(s => roundNameMap[round] === s)
  if (size) return names[lang][size]
  return lang === 'sv' ? `Omgång ${round}` : `Round ${round}`
}

router.get('/:lang(vpga.ics|sv/vpga.ics|en/vpga.ics)', (req, res) => {
  // Determine language
  let lang = 'sv'
  if (req.params.lang === 'en/vpga.ics') lang = 'en'
  // ("vpga.ics" and "sv/vpga.ics" both default to sv)

  const rounds = db.prepare(
    'SELECT * FROM rounds ORDER BY season, round_number'
  ).all()
  const roundItems = rounds.map(r => ({
    ...r,
    title: lang === 'sv'
      ? `VPGA${r.round_number}${r.course ? ' – ' + r.course : ''}`
      : `VPGA${r.round_number}${r.course ? ' – ' + r.course : ''}`,
    uid:   `vpga-round-${r.id}@vpga`,
  }))

  // Custom admin events
  const eventItems = db.prepare(
    'SELECT * FROM events ORDER BY date, id'
  ).all().map(e => ({
    ...e,
    uid: `vpga-event-${e.id}@vpga`,
  }))

  // OMPC deadlines per round (not per match)
  const ompcDeadlinesRaw = db.prepare(
    "SELECT round, MIN(deadline_date) as deadline_date FROM ompc_matches WHERE deadline_date IS NOT NULL AND deadline_date != '' GROUP BY round"
  ).all()
  // Map round numbers to bracket size (for naming)
  const ompcRounds = db.prepare('SELECT DISTINCT round FROM ompc_matches ORDER BY round').all().map(r => r.round)
  const roundNameMap = {}
  if (ompcRounds.length) {
    let size = 2 ** ompcRounds.length
    for (let i = 0; i < ompcRounds.length; ++i) {
      roundNameMap[ompcRounds[i]] = size
      size = size / 2
    }
  }
  const ompcDeadlines = ompcDeadlinesRaw.map(r => ({
    uid: 'vpga-ompc-round-' + r.round + '@vpga',
    title: 'OMPC ' + getOmpcRoundName(r.round, lang, roundNameMap) + ' deadline',
    date: r.deadline_date,
    date_end: '',
    start_time: '',
    notes: '',
  }))

  const ics = buildIcs([...roundItems, ...eventItems, ...ompcDeadlines])
  res.set('Content-Type', 'text/calendar; charset=utf-8')
  res.set('Content-Disposition', `attachment; filename=vpga.ics`)
  res.send(ics)
})

// Aggregate all events for calendar view (manual, rounds, OMPC deadlines)
router.get('/all', (req, res) => {
  try {
    const manualEvents = db.prepare(
      'SELECT id, title, date, date_end, start_time, description, notes FROM events ORDER BY date, id'
    ).all().map(e => ({ id: String(e.id), title: e.title, date: e.date, date_end: e.date_end || '', start_time: e.start_time || '', description: e.description || e.notes || '', notes: e.notes || '', type: 'manual' }))

    const rounds = db.prepare(
      'SELECT id, season, round_number, date, date_end, start_time, course, description, notes FROM rounds ORDER BY season, round_number'
    ).all().map(r => ({
      id: 'round-' + r.id,
      title: 'VPGA' + r.round_number + (r.course ? ' - ' + r.course : ''),
      date: r.date,
      date_end: r.date_end || '',
      start_time: r.start_time || '',
      description: r.description || r.notes || '',
      notes: r.notes || '',
      type: 'round',
    }))

    // OMPC deadlines per round (not per match)
    const ompcDeadlinesRaw = db.prepare(
      "SELECT round, MIN(deadline_date) as deadline_date FROM ompc_matches WHERE deadline_date IS NOT NULL AND deadline_date != '' GROUP BY round"
    ).all()

    // Swedish/English round names
    function getOmpcRoundName(round, lang = 'sv') {
      // Map round numbers to names (for 32, 16, 8, 4, 2)
      const names = {
        sv: {
          32: 'Sextondelsfinaler',
          16: 'Åttondelsfinaler',
          8:  'Kvartsfinaler',
          4:  'Semifinaler',
          2:  'Final',
        },
        en: {
          32: 'Round of 32',
          16: 'Round of 16',
          8:  'Quarterfinals',
          4:  'Semifinals',
          2:  'Final',
        }
      }
      // Guess size from round number
      const size = [32, 16, 8, 4, 2].find(s => roundNameMap[round] === s)
      if (size) return names[lang][size]
      return lang === 'sv' ? `Omgång ${round}` : `Round ${round}`
    }

    // Map round numbers to bracket size (for naming)
    // This assumes round 1 = 16-delsfinal (32), round 2 = åttondel (16), etc.
    // We'll infer the mapping from the number of rounds present
    const ompcRounds = db.prepare('SELECT DISTINCT round FROM ompc_matches ORDER BY round').all().map(r => r.round)
    const roundNameMap = {}
    if (ompcRounds.length) {
      let size = 2 ** ompcRounds.length
      for (let i = 0; i < ompcRounds.length; ++i) {
        roundNameMap[ompcRounds[i]] = size
        size = size / 2
      }
    }

    const ompcDeadlines = ompcDeadlinesRaw.map(r => ({
      id: 'ompc-round-' + r.round,
      title: 'OMPC ' + getOmpcRoundName(r.round, 'sv') + ' deadline',
      date: r.deadline_date,
      date_end: '',
      start_time: '',
      description: '',
      notes: '',
      type: 'ompc_deadline',
    }))

    const all = [...manualEvents, ...rounds, ...ompcDeadlines].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
    res.json(all)
  } catch (err) {
    console.error('/api/calendar/all error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
