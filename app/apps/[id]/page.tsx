import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AppDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app: Record<string, unknown> | undefined = db.prepare('select * from apps where id=?').get(id) as Record<string, unknown> | undefined;
  if (!app) return <div className="card">App bulunamadı.</div>;
  const ideas: { id: number; title: string; status: string }[] = db
    .prepare('select id, title, status from ideas where app_id=? order by id desc')
    .all(id) as { id: number; title: string; status: string }[];
  const fields = [
    'category',
    'one_liner',
    'target_audience',
    'main_problem',
    'core_features',
    'unique_selling_points',
    'competitors',
    'brand_tone',
    'content_style',
    'dos',
    'donts',
    'winning_ads',
    'failed_ads',
    'app_store_link',
    'play_store_link',
    'ai_instructions',
  ];
  return (
    <div className="space-y-6">
      <Link href="/apps" className="text-sm opacity-60 hover:opacity-100">
        ← Apps
      </Link>
      <h1 className="text-3xl font-bold">{String(app.name)}</h1>
      <div className="card space-y-2">
        {fields.map((k) =>
          app[k] ? (
            <p key={k}>
              <b>{k}:</b> {String(app[k])}
            </p>
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
