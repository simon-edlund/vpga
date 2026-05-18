/**
 * Adds one calendar day to a YYYY-MM-DD date string.
 * Returns '' if dateStr is falsy.
 */
export function addOneDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Adds `hours` to a HH:MM time string and returns the resulting HH:MM string.
 * Handles midnight wraparound (result is modulo 24h).
 * Returns '' if timeStr is falsy or not in HH:MM format.
 */
export function addHoursToTime(timeStr, hours) {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const totalMins = h * 60 + m + hours * 60
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

/**
 * Derives the duration type from stored event/round fields.
 * Returns 'timed' | '2days' | '1day'.
 */
export function deriveDuration(item) {
  if (item.start_time) return 'timed'
  if (item.date_end) return '2days'
  return '1day'
}

/**
 * Returns a human-readable duration label for display in tables.
 * `t` is the locale store's translation function.
 */
export function formatDuration(item, t) {
  if (item.start_time) {
    const end = addHoursToTime(item.start_time, 6)
    return end ? `${item.start_time} – ${end}` : item.start_time
  }
  if (item.date_end) return t('duration2Days')
  return t('duration1Day')
}

/**
 * Converts a form object (with a `duration` field) into the API payload
 * with the underlying `date_end` and `start_time` fields.
 */
export function buildDurationPayload(formData) {
  return {
    date_end:   formData.duration === '2days' ? addOneDay(formData.date) : '',
    start_time: formData.duration === 'timed'  ? formData.start_time : '',
  }
}
