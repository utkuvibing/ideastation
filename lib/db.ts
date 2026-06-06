import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './data/app.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath, { timeout: 5000 });
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, company_name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS apps (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, one_liner TEXT, target_audience TEXT, main_problem TEXT, core_features TEXT, unique_selling_points TEXT, competitors TEXT, brand_tone TEXT, content_style TEXT, dos TEXT, donts TEXT, winning_ads TEXT, failed_ads TEXT, app_store_link TEXT, play_store_link TEXT, ai_instructions TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, app_id INTEGER, title TEXT NOT NULL, format TEXT, status TEXT DEFAULT 'draft', created_by TEXT, description TEXT, hook TEXT, script TEXT, storyboard TEXT, visual_notes TEXT, voiceover TEXT, caption TEXT, cta TEXT, hashtags TEXT, why_it_might_work TEXT, risks TEXT, production_difficulty TEXT, ai_score INTEGER, source TEXT, competitor_url TEXT, competitor_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, idea_id INTEGER NOT NULL, user_name TEXT, sentiment TEXT, viral_score INTEGER, ease_score INTEGER, brand_fit_score INTEGER, originality_score INTEGER, comment TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, idea_id INTEGER NOT NULL, user_name TEXT, body TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS ai_generations (id INTEGER PRIMARY KEY AUTOINCREMENT, app_id INTEGER, idea_id INTEGER, provider TEXT, model TEXT, action TEXT, prompt TEXT, response TEXT, created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT, entity_id INTEGER, file_name TEXT, file_path TEXT, mime_type TEXT, size INTEGER, uploaded_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
}
initDb();
