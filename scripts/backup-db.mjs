import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const databasePath = path.resolve(process.env.DATABASE_PATH || './data/app.db');
if (!fs.existsSync(databasePath)) {
  console.error(`Database does not exist: ${databasePath}`);
  process.exit(1);
}

const backupDirectory = path.resolve(process.env.BACKUP_DIR || './backups');
fs.mkdirSync(backupDirectory, { recursive: true });
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const destination = path.join(backupDirectory, `ideastation-${timestamp}.db`);
const db = new Database(databasePath, { readonly: true });

try {
  await db.backup(destination);
  console.log(destination);
} finally {
  db.close();
}

