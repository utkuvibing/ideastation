import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const databasePath = path.resolve(process.env.DATABASE_PATH || './data/app.db');
if (!fs.existsSync(databasePath)) throw new Error(`Database does not exist: ${databasePath}`);

const backupDirectory = path.resolve(process.env.BACKUP_DIR || './backups');
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 30);
fs.mkdirSync(backupDirectory, { recursive: true });
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const destination = path.join(backupDirectory, `ideastation-${timestamp}.db`);
const db = new Database(databasePath, { readonly: true });

try {
  await db.backup(destination);
} finally {
  db.close();
}

const backup = new Database(destination, { readonly: true });
try {
  const result = backup.pragma('integrity_check', { simple: true });
  if (result !== 'ok') throw new Error(`Backup integrity check failed: ${result}`);
} finally {
  backup.close();
}

if (Number.isFinite(retentionDays) && retentionDays > 0) {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const entry of fs.readdirSync(backupDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith('ideastation-') || !entry.name.endsWith('.db')) continue;
    const file = path.join(backupDirectory, entry.name);
    if (fs.statSync(file).mtimeMs < cutoff) fs.rmSync(file);
  }
}

console.log(destination);
