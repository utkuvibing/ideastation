import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    db.prepare('SELECT 1').get();
    return NextResponse.json({ status: 'ok', database: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error', database: 'unavailable' }, { status: 503 });
  }
}
