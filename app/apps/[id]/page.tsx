import Link from 'next/link';
import { db } from '@/lib/db';
import { deleteApp, updateApp } from '@/app/actions';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { appFieldLabels } from '@/lib/field-labels';

export const dynamic = 'force-dynamic';

export default async function AppDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = db.prepare('select * from apps where id=? and deleted_at is null').get(id) as Record<string, any> | undefined;
  if (!app) return <div className="card">App bulunamadi.</div>;
  const ideas = db.prepare('select id,title,status from ideas where app_id=? and deleted_at is null order by id desc').all(id) as {id:number;title:string;status:string}[];
  const revisions = db.prepare("select * from revisions where entity_type='app' and entity_id=? order by id desc limit 20").all(id) as Record<string, any>[];
  return <div className="space-y-6"><Link href="/apps">← Apps</Link>
    <div className="flex justify-between gap-3"><h1 className="text-3xl font-bold">{app.name}</h1><DeleteEntityButton action={deleteApp} entityId={app.id} idField="app_id" entityName={app.name} entityType="app"/></div>
    <form action={updateApp} className="card grid gap-3 md:grid-cols-2"><input type="hidden" name="app_id" value={app.id}/>{Object.entries(appFieldLabels).map(([field,label])=>field === 'name' ? <input key={field} name={field} defaultValue={app[field] || ''} placeholder={label}/> : <textarea key={field} name={field} defaultValue={app[field] || ''} placeholder={label}/>)}<button className="md:col-span-2">App brief guncelle</button></form>
    <section className="card"><h2 className="font-bold">Ideas ({ideas.length})</h2>{ideas.map(i=><Link className="block border-t py-2" key={i.id} href={`/ideas/${i.id}`}>{i.title} / {i.status}</Link>)}</section>
    <section className="card"><h2 className="font-bold">Revision history</h2>{revisions.map(r=><details className="border-t py-2" key={r.id}><summary>{r.created_at} / {r.changed_by}</summary><pre className="overflow-auto text-xs">{JSON.stringify(JSON.parse(r.snapshot),null,2)}</pre></details>)}</section>
  </div>;
}
