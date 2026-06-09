import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export async function GET() {
  await requireRole('viewer');
  const rows = db.prepare('select ideas.title,ideas.status,ideas.owner,ideas.deadline,ideas.priority,apps.name app_name from ideas join apps on apps.id=ideas.app_id where ideas.deleted_at is null order by ideas.id').all() as Record<string, unknown>[];
  const lines = rows.map((row) => `${row.title} | ${row.app_name} | ${row.status} | ${row.priority} | ${row.owner || '-'} | ${row.deadline || '-'}`);
  const escape = (text: string) => text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)').replace(/[^\x20-\x7E]/g, '?');
  const content = ['BT /F1 10 Tf 40 800 Td', '(IdeaStation Ideas) Tj', ...lines.slice(0, 55).map((line) => `0 -14 Td (${escape(line)}) Tj`), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Response(Buffer.from(pdf), { headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="ideas.pdf"' } });
}
