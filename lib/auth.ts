import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'ideastation_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type Session = {
  email: string;
  expiresAt: number;
};

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
  }
  return secret;
}

function sign(payload: string) {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value?: string): Session | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    return session.email && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function configuredUsers() {
  const raw = process.env.IDEASTATION_USERS || '';
  const users = new Map<string, string>();
  for (const entry of raw.split(',').map((item) => item.trim()).filter(Boolean)) {
    const separator = entry.indexOf(':');
    if (separator < 1) continue;
    const email = entry.slice(0, separator).trim().toLowerCase();
    const password = entry.slice(separator + 1);
    if (email && password) users.set(email, password);
  }
  return users;
}

export function credentialsAreValid(email: string, password: string) {
  const expected = configuredUsers().get(email);
  return Boolean(expected && safeEqual(expected, password));
}

export async function createSession(email: string) {
  (await cookies()).set(
    SESSION_COOKIE,
    encodeSession({ email, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    },
  );
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}
