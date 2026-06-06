import Link from 'next/link';
import { db } from '@/lib/db';
import { deleteApp } from '@/app/actions';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { appFieldLabels } from '@/lib/field-labels';

export const dynamic = 'force-dynamic';

export default async function AppDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app: Record<string, unknown> | undefined = db.prepare('select * from apps where id=?').get(id) as Record<string, unknown> | undefined;
  if (!app) return <div className="card">App bulunamadı.</div>;
  const ideas: { id: number; title: string; status: string }[] = db
    .prepare('select id, title, status from ideas where app_id=? order by id desc')
    .all(id) as { id: number; title: string; status: string }[];
  return (
    <div className="space-y-6">
      <Link href="/apps" className="text-sm opacity-60 hover:opacity-100">
        ← Apps
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{String(app.name)}</h1>
        <DeleteEntityButton
          action={deleteApp}
          entityId={Number(app.id)}
          idField="app_id"
          entityName={String(app.name)}
          entityType="app"
        />
      </div>
      <div className="card space-y-2">
        {Object.entries(appFieldLabels).map(([key, label]) =>
          app[key] ? (
            <div key={key} className="border-b border-zinc-200 pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
              <h2 className="font-bold">{label}</h2>
              <p className="mt-1 whitespace-pre-line">{String(app[key])}</p>
            </div>
          ) : null,
        )}
      </div>
      <section className="card space-y-2">
        <h2 className="font-bold">Ideas ({ideas.length})</h2>
        {ideas.map((i) => (
          <Link key={i.id} href={`/ideas/${i.id}`} className="block border-t py-2 hover:opacity-80">
            <b>{i.title}</b> <span className="text-sm opacity-60">/ {i.status}</span>
          </Link>
        ))}
        {!ideas.length && <p className="opacity-60 text-sm">Henüz fikir yok.</p>}
      </section>
    </div>
  );
}
