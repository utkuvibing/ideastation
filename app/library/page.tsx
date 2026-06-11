import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default function Library() {
  const rows = db.prepare(`SELECT ideas.id,ideas.title,ideas.hook,ideas.format,ideas.cta,apps.name app_name,SUM(pm.views) views,SUM(pm.clicks) clicks,SUM(pm.installs) installs,SUM(pm.spend) spend,SUM(pm.revenue) revenue FROM ideas JOIN apps ON apps.id=ideas.app_id JOIN performance_metrics pm ON pm.idea_id=ideas.id WHERE ideas.deleted_at IS NULL AND ideas.status='published' GROUP BY ideas.id ORDER BY CASE WHEN SUM(pm.spend)>0 THEN SUM(pm.revenue)/SUM(pm.spend) ELSE 0 END DESC,SUM(pm.installs) DESC LIMIT 100`).all() as Record<string,any>[];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Winning Creative Library</h1>
        <p className="page-subtitle">En iyi performans gösteren yayınlanmış içerikler.</p>
      </header>
      {!rows.length && (
        <div className="card py-12 text-center">
          <h2 className="font-semibold">Henüz kazanan içerik yok</h2>
          <p className="muted mt-1 text-sm">Performans verisi olan published fikirler burada görünür.</p>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map(x=>(
          <article className="card card-hover space-y-3" key={x.id}>
            <div>
              <a href={`/ideas/${x.id}`} className="text-lg font-semibold hover:text-violet-600 dark:hover:text-violet-300">{x.title}</a>
              <p className="muted mt-0.5 text-sm">{[x.app_name, x.format].filter(Boolean).join(' · ')}</p>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-2"><dt className="shrink-0 font-medium">Hook:</dt><dd className="min-w-0">{x.hook||'-'}</dd></div>
              <div className="flex gap-2"><dt className="shrink-0 font-medium">CTA:</dt><dd className="min-w-0">{x.cta||'-'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <span className="badge badge-neutral tabular-nums">{x.views ?? 0} views</span>
              <span className="badge badge-neutral tabular-nums">{x.clicks ?? 0} clicks</span>
              <span className="badge badge-neutral tabular-nums">{x.installs ?? 0} installs</span>
              <span className="badge bg-emerald-500/10 tabular-nums text-emerald-700 dark:text-emerald-300">ROAS {x.spend?(x.revenue/x.spend).toFixed(2):'-'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
