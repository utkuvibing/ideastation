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
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Recycle Bin</h1><section className="card">{items.map((item) => <form action={restoreEntity} className="flex justify-between border-t py-2" key={`${item.type}-${item.id}`}><input type="hidden" name="entity_type" value={item.type}/><input type="hidden" name="entity_id" value={item.id}/><span>{item.type}: {item.name} / {item.deleted_at}</span><button>Restore</button></form>)}</section></div>;
}
