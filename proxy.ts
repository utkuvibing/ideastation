import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/api/health'];
const sessionCookie = 'ideastation_session';

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function hasValidSession(request: NextRequest) {
  if (process.env.AUTH_MODE === 'trusted-header') {
    const emailHeader = process.env.AUTH_EMAIL_HEADER || 'x-auth-request-email';
    if (request.headers.get(emailHeader)?.trim()) return true;
  }
  const value = request.cookies.get(sessionCookie)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!value || !secret || secret.length < 32) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return false;
    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as {
      email?: string;
      expiresAt?: number;
    };
    return Boolean(session.email && session.expiresAt && session.expiresAt > Date.now());
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();
  if (!(await hasValidSession(request))) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
