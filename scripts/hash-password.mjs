import crypto from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 12) throw new Error('Usage: node scripts/hash-password.mjs "<password-with-at-least-12-characters>"');
const salt = crypto.randomBytes(16).toString('base64url');
const hash = crypto.scryptSync(password, salt, 64).toString('base64url');
console.log(`scrypt$${salt}$${hash}`);
