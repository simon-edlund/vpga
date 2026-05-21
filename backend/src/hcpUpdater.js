require('dotenv').config()
const axios = require('axios')
const { CookieJar } = require('tough-cookie')
const { wrapper } = require('axios-cookiejar-support')
const db = require('./db')

const MINGOLF_USERNAME = process.env.MINGOLF_USERNAME
const MINGOLF_PASSWORD = process.env.MINGOLF_PASSWORD

function createClient() {
  const jar = new CookieJar()
  return wrapper(axios.create({ jar }))
}

async function loginMinGolf(client) {
  await client.post(
    'https://mingolf.golf.se/login/api/Users/Login',
    { GolfId: MINGOLF_USERNAME, Password: MINGOLF_PASSWORD },
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function fetchHcp(client, golfId) {
  const url = 'https://mingolf.golf.se/minainstallningar/favoriter/api/Persons'
  const params = {
    SearchPhrase: golfId,
    Country: 'Sweden',
    IsFromFriendsPage: true,
  }
  const response = await client.get(url, { params })
  if (response.status !== 200) {
    throw new Error(`Unexpected status code: ${response.status}`)
  }
  const data = response.data

  // Handle array responses (multiple matches)
  const record = Array.isArray(data) ? data[0] : data

  if (record == null || typeof record !== 'object') {
    throw new Error(`No data returned for golf ID: ${golfId}`)
  }
  if (!('hcp' in record)) {
    throw new Error(`HCP field missing in response for golf ID: ${golfId}`)
  }
  const rawHcp = typeof record.hcp === 'string' ? record.hcp.replace(',', '.') : record.hcp
  const hcp = Number(rawHcp)
  if (!Number.isFinite(hcp)) {
    throw new Error(`Invalid HCP value "${record.hcp}" for golf ID: ${golfId}`)
  }
  return hcp
}

async function logoutMinGolf(client) {
  try {
    await client.post('https://mingolf.golf.se/login/api/logout')
  } catch (_) {
    // ignore logout errors
  }
}

const MEMBER_COLS = 'id, name, golf_id, handicap, email, active, is_admin, email_verified, hcp_last_updated_at, hcp_last_update_status'

/**
 * Update HCP for a single member by their DB id.
 * Returns the updated member row.
 */
async function updateMemberHcp(memberId) {
  const member = db.prepare('SELECT id, golf_id FROM members WHERE id = ?').get(memberId)
  if (!member) throw new Error('Member not found')

  const now = new Date().toISOString()

  if (!member.golf_id || !member.golf_id.trim()) {
    db.prepare(
      "UPDATE members SET hcp_last_updated_at = ?, hcp_last_update_status = 'error' WHERE id = ?"
    ).run(now, memberId)
    const updated = db.prepare(`SELECT ${MEMBER_COLS} FROM members WHERE id = ?`).get(memberId)
    return updated
  }

  if (!MINGOLF_USERNAME || !MINGOLF_PASSWORD) {
    db.prepare(
      "UPDATE members SET hcp_last_updated_at = ?, hcp_last_update_status = 'error' WHERE id = ?"
    ).run(now, memberId)
    throw new Error('MINGOLF credentials not configured')
  }

  const client = createClient()
  try {
    await loginMinGolf(client)
    const hcp = await fetchHcp(client, member.golf_id.trim())
    db.prepare(
      "UPDATE members SET handicap = ?, hcp_last_updated_at = ?, hcp_last_update_status = 'ok' WHERE id = ?"
    ).run(hcp, now, memberId)
  } catch (err) {
    db.prepare(
      "UPDATE members SET hcp_last_updated_at = ?, hcp_last_update_status = 'error' WHERE id = ?"
    ).run(now, memberId)
    throw err
  } finally {
    await logoutMinGolf(client)
  }

  return db.prepare(`SELECT ${MEMBER_COLS} FROM members WHERE id = ?`).get(memberId)
}

/**
 * Update HCP for all active members that have a golf_id set.
 * Logs progress to stdout. Does not throw; errors per member are stored in DB.
 */
async function updateAllMembersHcp() {
  if (!MINGOLF_USERNAME || !MINGOLF_PASSWORD) {
    console.warn(`[${new Date().toISOString()}] HCP update skipped: MINGOLF_USERNAME or MINGOLF_PASSWORD not set`)
    return
  }

  const members = db
    .prepare("SELECT id, golf_id FROM members WHERE active = 1 AND golf_id != ''")
    .all()

  if (members.length === 0) {
    console.log(`[${new Date().toISOString()}] HCP update: no active members with a golf ID found`)
    return
  }

  console.log(`[${new Date().toISOString()}] HCP update started for ${members.length} member(s)`)

  const client = createClient()
  try {
    await loginMinGolf(client)
    console.log(`[${new Date().toISOString()}] HCP update: logged in to MinGolf`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] HCP update: login failed – ${err.message}`)
    const now = new Date().toISOString()
    for (const m of members) {
      db.prepare(
        "UPDATE members SET hcp_last_updated_at = ?, hcp_last_update_status = 'error' WHERE id = ?"
      ).run(now, m.id)
    }
    return
  }

  let successCount = 0
  let errorCount = 0

  for (const m of members) {
    const now = new Date().toISOString()
    try {
      const hcp = await fetchHcp(client, m.golf_id.trim())
      db.prepare(
        "UPDATE members SET handicap = ?, hcp_last_updated_at = ?, hcp_last_update_status = 'ok' WHERE id = ?"
      ).run(hcp, now, m.id)
      successCount++
    } catch (err) {
      db.prepare(
        "UPDATE members SET hcp_last_updated_at = ?, hcp_last_update_status = 'error' WHERE id = ?"
      ).run(now, m.id)
      console.error(`[${new Date().toISOString()}] HCP update failed for member ${m.id} (golf_id ${m.golf_id}): ${err.message}`)
      errorCount++
    }
  }

  await logoutMinGolf(client)
  console.log(`[${new Date().toISOString()}] HCP update finished: ${successCount} ok, ${errorCount} error(s)`)
}

module.exports = { updateMemberHcp, updateAllMembersHcp, MEMBER_COLS }
