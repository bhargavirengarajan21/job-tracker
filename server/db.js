const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'jobtracker.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT DEFAULT 'applied',
      applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      job_url TEXT,
      ats_score REAL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tracked_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      careers_url TEXT NOT NULL,
      keywords TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fetched_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracked_company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      seen INTEGER DEFAULT 0,
      FOREIGN KEY (tracked_company_id) REFERENCES tracked_companies(id)
    )
  `);

  // Migrations for new columns (safe to run on existing DB)
  try { db.run('ALTER TABLE applications ADD COLUMN linkedin_message TEXT'); } catch (_) {}
  try { db.run('ALTER TABLE applications ADD COLUMN email_subject TEXT'); } catch (_) {}
  try { db.run('ALTER TABLE applications ADD COLUMN email_body TEXT'); } catch (_) {}

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] };
}

function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { getDb, runQuery, getOne, getAll, saveDb };
