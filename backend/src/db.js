require('dotenv').config()
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/golf.db')

// Ensure data directory exists
const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    golf_id        TEXT    NOT NULL DEFAULT '',
    handicap       REAL    NOT NULL DEFAULT 0,
    email          TEXT    NOT NULL UNIQUE,
    active         INTEGER NOT NULL DEFAULT 1,
    is_admin       INTEGER NOT NULL DEFAULT 0,
    password_hash  TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    season       INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    date         TEXT    NOT NULL,
    course       TEXT    NOT NULL DEFAULT '',
    notes        TEXT    NOT NULL DEFAULT '',
    UNIQUE(season, round_number)
  );

  CREATE TABLE IF NOT EXISTS scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id    INTEGER NOT NULL REFERENCES rounds(id)  ON DELETE CASCADE,
    member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    net_strokes INTEGER NOT NULL,
    UNIQUE(round_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS ompc_cup (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    season     INTEGER NOT NULL UNIQUE,
    created_by INTEGER NOT NULL REFERENCES members(id),
    created_at TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ompc_participants (
    cup_id    INTEGER NOT NULL REFERENCES ompc_cup(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
    PRIMARY KEY (cup_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS ompc_matches (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    cup_id         INTEGER NOT NULL REFERENCES ompc_cup(id) ON DELETE CASCADE,
    round          INTEGER NOT NULL,
    match_number   INTEGER NOT NULL DEFAULT 1,
    player1_id     INTEGER REFERENCES members(id),
    player2_id     INTEGER REFERENCES members(id),
    winner_id      INTEGER REFERENCES members(id),
    scheduled_date TEXT    NOT NULL DEFAULT '',
    deadline_date  TEXT    NOT NULL DEFAULT '',
    status         TEXT    NOT NULL DEFAULT 'pending'
  );
`)

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  const hasColumn = columns.some(info => info.name === column)
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

function recreateOmpcParticipantsIfNeeded() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ompc_participants'").all()
  if (tables.length === 0) {
    return
  }

  const columns = db.prepare('PRAGMA table_info(ompc_participants)').all()
  const columnNames = new Set(columns.map(column => column.name))

  if (columnNames.has('cup_id')) {
    return
  }

  db.exec('ALTER TABLE ompc_participants RENAME TO ompc_participants_old')

  db.exec(`
    CREATE TABLE ompc_participants (
      cup_id    INTEGER NOT NULL REFERENCES ompc_cup(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
      PRIMARY KEY (cup_id, member_id)
    )
  `)

  const oldRows = db.prepare('SELECT * FROM ompc_participants_old').all()
  const oldColumns = new Set(db.prepare('PRAGMA table_info(ompc_participants_old)').all().map(column => column.name))
  const defaultCreator = db.prepare('SELECT id FROM members WHERE is_admin = 1 ORDER BY id LIMIT 1').get()
    || db.prepare('SELECT id FROM members ORDER BY id LIMIT 1').get()

  const createCup = db.prepare('INSERT OR IGNORE INTO ompc_cup (season, created_by, created_at) VALUES (?, ?, ?)')
  const getCupId = db.prepare('SELECT id FROM ompc_cup WHERE season = ?')
  const insertParticipant = db.prepare('INSERT OR IGNORE INTO ompc_participants (cup_id, member_id) VALUES (?, ?)')

  const migrateRows = db.transaction(rows => {
    const now = new Date().toISOString()

    for (const row of rows) {
      const season = oldColumns.has('season') ? row.season : null
      if (!season || !defaultCreator?.id) {
        continue
      }

      createCup.run(season, defaultCreator.id, now)
      const cup = getCupId.get(season)
      if (!cup) {
        continue
      }

      insertParticipant.run(cup.id, row.member_id)
    }
  })

  migrateRows(oldRows)
  db.exec('DROP TABLE ompc_participants_old')
}

function recreateOmpcMatchesIfNeeded() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ompc_matches'").all()
  if (tables.length === 0) {
    return
  }

  const columns = db.prepare('PRAGMA table_info(ompc_matches)').all()
  const columnNames = new Set(columns.map(column => column.name))
  const player1 = columns.find(column => column.name === 'player1_id')
  const player2 = columns.find(column => column.name === 'player2_id')
  const needsMatchNumber = !columnNames.has('match_number')
  const needsCupId = !columnNames.has('cup_id')
  const needsWinnerId = !columnNames.has('winner_id')
  const needsScheduledDate = !columnNames.has('scheduled_date')
  const needsDeadlineDate = !columnNames.has('deadline_date')
  const needsStatus = !columnNames.has('status')
  const needsNullablePlayers = !!player1?.notnull || !!player2?.notnull

  if (!player1 || !player2) {
    return
  }

  if (!needsMatchNumber && !needsCupId && !needsWinnerId && !needsScheduledDate && !needsDeadlineDate && !needsStatus && !needsNullablePlayers) {
    return
  }

  db.exec('ALTER TABLE ompc_matches RENAME TO ompc_matches_old')

  db.exec(`
    CREATE TABLE ompc_matches (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      cup_id         INTEGER NOT NULL REFERENCES ompc_cup(id) ON DELETE CASCADE,
      round          INTEGER NOT NULL,
      match_number   INTEGER NOT NULL DEFAULT 1,
      player1_id     INTEGER REFERENCES members(id),
      player2_id     INTEGER REFERENCES members(id),
      winner_id      INTEGER REFERENCES members(id),
      scheduled_date TEXT    NOT NULL DEFAULT '',
      deadline_date  TEXT    NOT NULL DEFAULT '',
      status         TEXT    NOT NULL DEFAULT 'pending'
    )
  `)

  const oldColumns = new Set(db.prepare('PRAGMA table_info(ompc_matches_old)').all().map(column => column.name))
  const oldRows = db.prepare('SELECT * FROM ompc_matches_old').all()
  const onlyCup = db.prepare('SELECT id FROM ompc_cup ORDER BY id LIMIT 1').get()
  const insertMatch = db.prepare(`
    INSERT INTO ompc_matches (
      id, cup_id, round, match_number, player1_id, player2_id, winner_id, scheduled_date, deadline_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const migrateRows = db.transaction(rows => {
    for (const row of rows) {
      const cupId = oldColumns.has('cup_id') ? row.cup_id : onlyCup?.id
      if (!cupId) {
        continue
      }

      insertMatch.run(
        row.id,
        cupId,
        oldColumns.has('round') ? row.round : 1,
        oldColumns.has('match_number') ? row.match_number : 1,
        oldColumns.has('player1_id') ? row.player1_id : null,
        oldColumns.has('player2_id') ? row.player2_id : null,
        oldColumns.has('winner_id') ? row.winner_id : null,
        oldColumns.has('scheduled_date') ? (row.scheduled_date || '') : '',
        oldColumns.has('deadline_date') ? (row.deadline_date || '') : '',
        oldColumns.has('status') ? (row.status || 'pending') : 'pending'
      )
    }
  })

  migrateRows(oldRows)
  db.exec('DROP TABLE ompc_matches_old')
}

addColumnIfMissing('rounds', 'date_end',    "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('rounds', 'start_time',  "TEXT NOT NULL DEFAULT ''")

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    date       TEXT NOT NULL,
    date_end   TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL DEFAULT '',
    notes      TEXT NOT NULL DEFAULT ''
  );
`)

addColumnIfMissing('members', 'golf_id', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('members', 'handicap', 'REAL NOT NULL DEFAULT 0')
addColumnIfMissing('members', 'email', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('members', 'is_admin', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('members', 'password_hash', 'TEXT')
addColumnIfMissing('members', 'email_verified', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('ompc_matches', 'match_number', 'INTEGER NOT NULL DEFAULT 1')

recreateOmpcParticipantsIfNeeded()
recreateOmpcMatchesIfNeeded()

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email ON members(email)')

const simon = db.prepare('SELECT id FROM members WHERE email = ?').get('simon@edlund.nl')
if (!simon) {
  db.prepare(
    `INSERT INTO members (
      name, golf_id, handicap, email, active, is_admin, password_hash, email_verified
    ) VALUES (?, ?, ?, ?, 1, 1, NULL, 0)`
  ).run('Simon Edlund', '', 0, 'simon@edlund.nl')
  console.log('Created initial admin member Simon Edlund (simon@edlund.nl)')
} else {
  db.prepare('UPDATE members SET is_admin = 1, active = 1 WHERE email = ?').run('simon@edlund.nl')
}

module.exports = db
