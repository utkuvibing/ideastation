import Link from 'next/link';
import { db } from '@/lib/db';
import { deleteApp, updateApp } from '@/app/actions';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { StatusBadge } from '@/components/status-badge';
import { appFieldLabels } from '@/lib/field-labels';

export const dynamic = 'force-dynamic';

export default async function AppDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = db.prepare('select * from apps where id=? and deleted_at is null').get(id) as Record<string, any> | undefined;
  if (!app) return (
    <div className="card py-12 text-center">
      <h1 className="font-semibold">App bulunamadı</h1>
      <p className="muted mt-1 text-sm">Silinmiş veya hiç oluşturulmamış olabilir.</p>
      <Link className="btn mt-4 inline-flex" href="/apps">Apps listesine dön</Link>
    </div>
  );
  const ideas = db.prepare('select id,title,status from ideas where app_id=? and deleted_at is null order by id desc').all(id) as {id:number;title:string;status:string}[];
  const revisions = db.prepare("select * from revisions where entity_type='app' and entity_id=? order by id desc limit 20").all(id) as Record<string, any>[];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <header className="min-w-0">
        <Link href="/apps" className="muted text-sm hover:text-zinc-900 dark:hover:text-zinc-100">← Apps</Link>
        <h1 className="mt-1 text-2xl font-bold">{app.name}</h1>
        {app.one_liner && <p className="page-subtitle">{app.one_liner}</p>}
      </header>
      <div className="flex gap-2">
        <Link className="btn btn-secondary" href={`/ai-brainstorm?app_id=${app.id}`}>AI brainstorm</Link>
        <DeleteEntityButton action={deleteApp} entityId={app.id} idField="app_id" entityName={app.name} entityType="app"/>
      </div>
    </div>

    <form action={updateApp} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="app_id" value={app.id}/>
      <h2 className="font-semibold md:col-span-2">App brief</h2>
      <label>App adı<input name="name" defaultValue={app.name || ''} required/></label>
      {Object.entries(appFieldLabels).map(([field, label]) => (
        <label key={field}>{label}
          {field === 'app_store_link' || field === 'play_store_link' || field === 'category'
            ? <input name={field} defaultValue={app[field] || ''} placeholder={label}/>
            : <textarea name={field} defaultValue={app[field] || ''} placeholder={label}/>}
        </label>
      ))}
      <button className="md:col-span-2">App brief güncelle</button>
    </form>

    <section className="card">
      <h2 className="font-semibold">Ideas ({ideas.length})</h2>
      {!ideas.length && <p className="muted mt-3 text-sm">Bu app için henüz fikir yok.</p>}
      <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        {ideas.map(i=>(
          <li key={i.id}>
            <Link className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50" href={`/ideas/${i.id}`}>
              <span className="min-w-0 truncate font-medium">{i.title}</span>
              <StatusBadge status={i.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>

    <section className="card">
      <h2 className="font-semibold">Revizyon geçmişi</h2>
      {!revisions.length && <p className="muted mt-3 text-sm">Henüz revizyon kaydı yok.</p>}
      <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        {revisions.map(r=><details className="py-2" key={r.id}>
          <summary className="cursor-pointer rounded text-sm transition-colors hover:text-violet-600 dark:hover:text-violet-300">{r.created_at} · {r.changed_by}</summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">{JSON.stringify(JSON.parse(r.snapshot),null,2)}</pre>
        </details>)}
      </div>
    </section>
  </div>;
}
