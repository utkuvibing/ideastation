import { db } from '@/lib/db';
import { markNotificationsRead } from '@/app/actions';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export default async function Notifications() {
  const session = await requireRole('viewer');
  const items = db.prepare('select * from notifications where recipient=? order by id desc limit 100').all(session.email) as Record<string, any>[];
  return <div className="space-y-6"><div className="flex justify-between"><h1 className="text-3xl font-bold">Notifications</h1><form action={markNotificationsRead}><button>Mark all read</button></form></div><section className="card">{items.map(n=><a key={n.id} href={n.href || '#'} className={`block border-t py-3 ${n.read_at ? 'opacity-60' : 'font-semibold'}`}>{n.message}<span className="block text-xs opacity-60">{n.created_at}</span></a>)}</section></div>;
}
