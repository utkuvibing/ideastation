import Link from 'next/link';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Audit() {
  await requireRole('admin');
  const rows = db.prepare('select * from audit_log order by id desc limit 250').all() as Record<string, any>[];
  return (
    <div className="space-y-6">
      <header>
        <Link href="/settings" className="muted text-sm hover:text-zinc-900 dark:hover:text-zinc-100">← Settings</Link>
        <h1 className="mt-1 text-2xl font-bold">Audit Log</h1>
        <p className="page-subtitle">Son 250 işlem kaydı.</p>
      </header>
      <section className="card overflow-x-auto p-0 sm:p-0">
        {!rows.length ? (
          <div className="py-10 text-center">
            <h2 className="font-semibold">Henüz kayıt yok</h2>
            <p className="muted mt-1 text-sm">Yapılan işlemler burada listelenir.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr><th>Tarih</th><th>Kullanıcı</th><th>İşlem</th><th>Kayıt</th></tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">{r.created_at}</td>
                  <td>{r.actor}</td>
                  <td><span className="badge badge-neutral">{r.action}</span></td>
                  <td>{r.entity_type} #{r.entity_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
