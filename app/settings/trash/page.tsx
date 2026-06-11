import Link from 'next/link';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { restoreEntity } from '@/app/actions';

export const dynamic = 'force-dynamic';
type TrashItem = { id: number; name: string; deleted_at: string; type: 'app' | 'idea' };

export default async function Trash() {
  await requireRole('admin');
  const apps = db.prepare('select id,name,deleted_at from apps where deleted_at is not null').all() as Omit<TrashItem, 'type'>[];
  const ideas = db.prepare('select id,title name,deleted_at from ideas where deleted_at is not null').all() as Omit<TrashItem, 'type'>[];
  const items: TrashItem[] = [...apps.map((item) => ({ ...item, type: 'app' as const })), ...ideas.map((item) => ({ ...item, type: 'idea' as const }))];
  return (
    <div className="space-y-6">
      <header>
        <Link href="/settings" className="muted text-sm hover:text-zinc-900 dark:hover:text-zinc-100">← Settings</Link>
        <h1 className="mt-1 text-2xl font-bold">Recycle Bin</h1>
        <p className="page-subtitle">Silinen app ve fikirleri geri yükle.</p>
      </header>
      <section className="card">
        {!items.length && (
          <div className="py-10 text-center">
            <h2 className="font-semibold">Çöp kutusu boş</h2>
            <p className="muted mt-1 text-sm">Silinen kayıtlar burada görünür.</p>
          </div>
        )}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <form action={restoreEntity} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <input type="hidden" name="entity_type" value={item.type}/>
                <input type="hidden" name="entity_id" value={item.id}/>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="badge badge-neutral uppercase">{item.type}</span>
                  <span className="min-w-0 truncate font-medium">{item.name}</span>
                  <span className="muted shrink-0 text-xs">{item.deleted_at}</span>
                </span>
                <button className="btn-secondary btn-sm">Geri yükle</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
