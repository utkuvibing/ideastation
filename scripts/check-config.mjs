import fs from 'node:fs';
import path from 'node:path';

const errors = [];
const warnings = [];
const secret = process.env.SESSION_SECRET || '';
const users = process.env.IDEASTATION_USERS || '';
const authMode = process.env.AUTH_MODE || 'local';
const databasePath = path.resolve(process.env.DATABASE_PATH || './data/app.db');

if (secret.length < 32) errors.push('SESSION_SECRET must contain at least 32 characters.');
if (!['local', 'trusted-header'].includes(authMode)) errors.push('AUTH_MODE must be local or trusted-header.');
if (authMode === 'local') {
  if (!users.trim()) errors.push('IDEASTATION_USERS must contain at least one email:role:password entry.');
  for (const entry of users.split(',').filter(Boolean)) {
    const [email, second, ...rest] = entry.split(':');
    const explicitRole = ['viewer', 'reviewer', 'editor', 'admin'].includes(second);
    const password = explicitRole ? rest.join(':') : [second, ...rest].join(':');
    if (!email || !password) {
      errors.push('Every IDEASTATION_USERS entry must use email:role:password format.');
    }
    if (!explicitRole) {
      if (process.env.NODE_ENV === 'production') errors.push(`Production user ${email} must include an explicit role.`);
      else warnings.push(`Legacy user ${email} has no role and is treated as admin.`);
    }
    if (process.env.NODE_ENV === 'production' && !password.startsWith('scrypt$')) {
      errors.push(`Production password for ${email || 'unknown user'} must use a scrypt hash.`);
    }
  }
}
if (authMode === 'trusted-header' && !process.env.AUTH_EMAIL_HEADER) {
  warnings.push('AUTH_EMAIL_HEADER is not set; x-auth-request-email will be used.');
}
for (const name of ['SLACK_WEBHOOK_URL', 'TEAMS_WEBHOOK_URL']) {
  const value = process.env[name];
  if (value) {
    try { new URL(value); } catch { errors.push(`${name} must be a valid URL.`); }
  }
}

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
console.log(`Configuration OK. Auth: ${authMode}. Database: ${databasePath}`);
