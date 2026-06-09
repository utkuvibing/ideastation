import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const databasePath = path.resolve(process.env.DATABASE_PATH || './data/app.db');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const migrations = [
  { version: 1, name: 'initial_schema', sql: `
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, company_name TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS apps (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200), category TEXT, one_liner TEXT, target_audience TEXT, main_problem TEXT, core_features TEXT, unique_selling_points TEXT, competitors TEXT, brand_tone TEXT, content_style TEXT, dos TEXT, donts TEXT, winning_ads TEXT, failed_ads TEXT, app_store_link TEXT, play_store_link TEXT, ai_instructions TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE, title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200), format TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','needs_feedback','approved','needs_script','ready_to_shoot','shooting','shot','editing','published','rejected','archived')), created_by TEXT NOT NULL, description TEXT, hook TEXT, script TEXT, storyboard TEXT, visual_notes TEXT, voiceover TEXT, caption TEXT, cta TEXT, hashtags TEXT, why_it_might_work TEXT, risks TEXT, production_difficulty TEXT, ai_score INTEGER CHECK(ai_score IS NULL OR ai_score BETWEEN 0 AND 10), source TEXT, competitor_url TEXT, competitor_notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, user_name TEXT NOT NULL, sentiment TEXT, viral_score INTEGER CHECK(viral_score BETWEEN 0 AND 10), ease_score INTEGER CHECK(ease_score BETWEEN 0 AND 10), brand_fit_score INTEGER CHECK(brand_fit_score BETWEEN 0 AND 10), originality_score INTEGER CHECK(originality_score BETWEEN 0 AND 10), comment TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, user_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS ai_generations (id INTEGER PRIMARY KEY AUTOINCREMENT, app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE, idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE, provider TEXT NOT NULL, model TEXT NOT NULL, action TEXT NOT NULL, prompt TEXT NOT NULL, response TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK(entity_type IN ('app','idea')), entity_id INTEGER NOT NULL, file_name TEXT NOT NULL, file_path TEXT NOT NULL, mime_type TEXT, size INTEGER CHECK(size IS NULL OR size >= 0), uploaded_by TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `},
  { version: 2, name: 'audit_and_indexes', sql: `
    CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER, metadata TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS idx_ideas_app_status ON ideas(app_id, status);
    CREATE INDEX IF NOT EXISTS idx_ideas_updated_at ON ideas(updated_at);
    CREATE INDEX IF NOT EXISTS idx_feedback_idea_id ON feedback(idea_id);
    CREATE INDEX IF NOT EXISTS idx_ai_generations_app_id ON ai_generations(app_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
  `},
  { version: 3, name: 'collaboration_and_operations', sql: `
    ALTER TABLE apps ADD COLUMN deleted_at TEXT;
    ALTER TABLE apps ADD COLUMN deleted_by TEXT;
    ALTER TABLE ideas ADD COLUMN owner TEXT;
    ALTER TABLE ideas ADD COLUMN team TEXT;
    ALTER TABLE ideas ADD COLUMN deadline TEXT;
    ALTER TABLE ideas ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent'));
    ALTER TABLE ideas ADD COLUMN tags TEXT;
    ALTER TABLE ideas ADD COLUMN deleted_at TEXT;
    ALTER TABLE ideas ADD COLUMN deleted_by TEXT;
    ALTER TABLE ai_generations ADD COLUMN duration_ms INTEGER;
    ALTER TABLE ai_generations ADD COLUMN input_chars INTEGER;
    ALTER TABLE ai_generations ADD COLUMN output_chars INTEGER;
    ALTER TABLE ai_generations ADD COLUMN estimated_cost_usd REAL;
    ALTER TABLE ai_generations ADD COLUMN sensitive_data_warning INTEGER NOT NULL DEFAULT 0;
    CREATE TABLE IF NOT EXISTS revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('app','idea')),
      entity_id INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      actor TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      href TEXT,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS error_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      actor TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS uptime_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      ok INTEGER NOT NULL,
      latency_ms INTEGER,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_apps_deleted_at ON apps(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_ideas_deleted_at ON ideas(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_ideas_owner_deadline ON ideas(owner, deadline);
    CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_id, id);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient, read_at, id);
    CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at);
  `},
  { version: 4, name: 'analytics_approval_integrations', sql: `
    ALTER TABLE ideas ADD COLUMN campaign TEXT;
    ALTER TABLE ideas ADD COLUMN channel TEXT;
    ALTER TABLE ideas ADD COLUMN country TEXT;
    ALTER TABLE ideas ADD COLUMN language TEXT;
    ALTER TABLE ideas ADD COLUMN approved_by TEXT;
    ALTER TABLE ideas ADD COLUMN approved_at TEXT;
    ALTER TABLE ideas ADD COLUMN rejection_reason TEXT;
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      report_date TEXT NOT NULL,
      spend REAL NOT NULL DEFAULT 0 CHECK(spend >= 0),
      impressions INTEGER NOT NULL DEFAULT 0 CHECK(impressions >= 0),
      views INTEGER NOT NULL DEFAULT 0 CHECK(views >= 0),
      clicks INTEGER NOT NULL DEFAULT 0 CHECK(clicks >= 0),
      installs INTEGER NOT NULL DEFAULT 0 CHECK(installs >= 0),
      conversions INTEGER NOT NULL DEFAULT 0 CHECK(conversions >= 0),
      revenue REAL NOT NULL DEFAULT 0 CHECK(revenue >= 0),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      event TEXT NOT NULL,
      target TEXT NOT NULL,
      ok INTEGER NOT NULL,
      status_code INTEGER,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ideas_campaign_dimensions ON ideas(campaign, channel, country, language);
    CREATE INDEX IF NOT EXISTS idx_performance_idea_date ON performance_metrics(idea_id, report_date);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);
  `},
  { version: 5, name: 'background_ai_jobs', sql: `
    ALTER TABLE ai_generations ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'
      CHECK(status IN ('queued','running','completed','failed'));
    ALTER TABLE ai_generations ADD COLUMN error_message TEXT;
    ALTER TABLE ai_generations ADD COLUMN started_at TEXT;
    ALTER TABLE ai_generations ADD COLUMN completed_at TEXT;
    CREATE INDEX IF NOT EXISTS idx_ai_generations_user_status
      ON ai_generations(created_by, status, id);
  `},
];

db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
const apply = db.transaction((migration) => {
  db.exec(migration.sql);
  db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
});

try {
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version));
  for (const migration of migrations) {
    if (!applied.has(migration.version)) {
      apply(migration);
      console.log(`Applied migration ${migration.version}: ${migration.name}`);
    }
  }
  const problems = db.pragma('foreign_key_check');
  if (problems.length) throw new Error(`Foreign key check failed: ${JSON.stringify(problems)}`);
  console.log(`Database ready: ${databasePath}`);
} finally {
  db.close();
}
