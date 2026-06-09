import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.env.DATABASE_PATH || './data/app.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath, { timeout: 5000 });
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDatabasePath() {
  return dbPath;
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDb();
