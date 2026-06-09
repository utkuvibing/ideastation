import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'ideastation_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export const roles = ['viewer', 'reviewer', 'editor', 'admin'] as const;
export type Role = (typeof roles)[number];

export type Session = {
  email: string;
  role: Role;
  expiresAt: number;
};

const roleRank = new Map<Role, number>(roles.map((role, index) => [role, index]));

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

export function decodeSession(value?: string): Session | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    if (!session.email || !roles.includes(session.role) || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

type ConfiguredUser = { password: string; role: Role };

export function configuredUsers() {
  const raw = process.env.IDEASTATION_USERS || '';
  const users = new Map<string, ConfiguredUser>();
  for (const entry of raw.split(',').map((item) => item.trim()).filter(Boolean)) {
    const [emailValue, secondValue, ...remainingParts] = entry.split(':');
    const email = emailValue?.trim().toLowerCase();
    const hasExplicitRole = roles.includes(secondValue as Role);
    const role = hasExplicitRole ? secondValue as Role : 'admin';
    const password = hasExplicitRole ? remainingParts.join(':') : [secondValue, ...remainingParts].join(':');
    if (email && password) users.set(email, { password, role });
  }
  return users;
}

function verifyPassword(stored: string, supplied: string) {
  if (!stored.startsWith('scrypt$')) return safeEqual(stored, supplied);
  const [, salt, expected] = stored.split('$');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(supplied, salt, 64).toString('base64url');
  return safeEqual(expected, actual);
}

export function credentialsAreValid(email: string, password: string) {
  const user = configuredUsers().get(email);
  return user && verifyPassword(user.password, password) ? user : null;
}

export async function createSession(email: string, role: Role) {
  (await cookies()).set(
    SESSION_COOKIE,
    encodeSession({ email, role, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }),
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
  const localSession = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (localSession) return localSession;

  if (process.env.AUTH_MODE !== 'trusted-header') return null;
  const requestHeaders = await headers();
  const email = requestHeaders.get(process.env.AUTH_EMAIL_HEADER || 'x-auth-request-email')?.trim().toLowerCase();
  const roleValue = requestHeaders.get(process.env.AUTH_ROLE_HEADER || 'x-auth-request-role')?.trim().toLowerCase();
  if (!email) return null;
  const role = roles.includes(roleValue as Role) ? roleValue as Role : 'viewer';
  return { email, role, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 };
}

export async function requireRole(minimumRole: Role = 'viewer') {
  const session = await getSession();
  if (!session) redirect('/login');
  if ((roleRank.get(session.role) ?? -1) < (roleRank.get(minimumRole) ?? 0)) {
    throw new Error('Bu işlem için yetkiniz yok.');
  }
  return session;
}

export function can(session: Session | null, minimumRole: Role) {
  return Boolean(session && (roleRank.get(session.role) ?? -1) >= (roleRank.get(minimumRole) ?? 0));
}
