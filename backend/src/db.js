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
`)

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  const hasColumn = columns.some(info => info.name === column)
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
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
