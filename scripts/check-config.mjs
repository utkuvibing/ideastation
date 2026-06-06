import fs from 'node:fs';
import path from 'node:path';

const errors = [];
const warnings = [];
const secret = process.env.SESSION_SECRET || '';
const users = process.env.IDEASTATION_USERS || '';
const databasePath = path.resolve(process.env.DATABASE_PATH || './data/app.db');

if (secret.length < 32) errors.push('SESSION_SECRET must contain at least 32 characters.');
if (!users.trim()) errors.push('IDEASTATION_USERS must contain at least one email:password entry.');
if (users.split(',').some((entry) => !entry.includes(':'))) errors.push('Every IDEASTATION_USERS entry must use email:password format.');
if (users.includes('replace-with') || users.includes(':password')) warnings.push('IDEASTATION_USERS appears to contain a weak or placeholder password.');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
try {
  fs.accessSync(path.dirname(databasePath), fs.constants.R_OK | fs.constants.W_OK);
} catch {
  errors.push(`Database directory is not readable and writable: ${path.dirname(databasePath)}`);
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`Configuration OK. Database: ${databasePath}`);

