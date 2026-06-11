import { db } from '@/lib/db';
import { markNotificationsRead } from '@/app/actions';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export default async function Notifications() {
  const session = await requireRole('viewer');
  const items = db.prepare('select * from notifications where recipient=? order by id desc limit 100').all(session.email) as Record<string, any>[];
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="page-subtitle">{unread ? `${unread} okunmamış bildirim` : 'Tüm bildirimler okundu'}</p>
        </header>
        <form action={markNotificationsRead}><button className="btn-secondary">Tümünü okundu say</button></form>
      </div>
      <section className="card p-0 sm:p-0">
        {!items.length && (
          <div className="py-12 text-center">
            <h2 className="font-semibold">Bildirim yok</h2>
            <p className="muted mt-1 text-sm">Mention, atama ve durum değişiklikleri burada görünür.</p>
          </div>
        )}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map(n=>(
            <li key={n.id}>
              <a href={n.href || '#'} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-violet-500'}`} />
                <span className="min-w-0">
                  <span className={`block text-sm ${n.read_at ? 'text-zinc-500 dark:text-zinc-400' : 'font-medium'}`}>{n.message}</span>
                  <span className="muted block text-xs">{n.created_at}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
