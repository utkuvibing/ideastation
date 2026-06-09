import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const sourceArg = process.argv[2];
if (!sourceArg) throw new Error('Usage: npm run restore -- <backup-file>');
const source = path.resolve(sourceArg);
const destination = path.resolve(process.env.DATABASE_PATH || './data/app.db');
if (!fs.existsSync(source)) throw new Error(`Backup does not exist: ${source}`);

const backup = new Database(source, { readonly: true });
try {
  const result = backup.pragma('integrity_check', { simple: true });
  if (result !== 'ok') throw new Error(`Backup integrity check failed: ${result}`);
} finally {
  backup.close();
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
if (fs.existsSync(destination)) {
  const safetyCopy = `${destination}.before-restore-${new Date().toISOString().replaceAll(':', '-')}`;
  fs.copyFileSync(destination, safetyCopy);
  console.log(`Safety copy: ${safetyCopy}`);
}
fs.copyFileSync(source, destination);
for (const suffix of ['-wal', '-shm']) {
  const sidecar = `${destination}${suffix}`;
  if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
}
console.log(`Restored: ${destination}`);
