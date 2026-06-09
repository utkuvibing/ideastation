import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export async function GET() {
  await requireRole('viewer');
  const rows = db.prepare('select ideas.*, apps.name app_name from ideas join apps on apps.id=ideas.app_id where ideas.deleted_at is null order by ideas.id').all() as Record<string, unknown>[];
  const fields = ['id','app_name','title','status','owner','team','deadline','priority','tags','hook','created_at','updated_at'];
  const body = [fields.join(','), ...rows.map((row) => fields.map((field) => csv(row[field])).join(','))].join('\r\n');
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="ideas.csv"' } });
}
