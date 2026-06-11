import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { StatusBadge } from '@/components/status-badge';

export const dynamic = 'force-dynamic';

const statLabels: Record<string, string> = {
  apps: 'Apps',
  ideas: 'Toplam fikir',
  published: 'Yayınlanan',
  revenue: 'Gelir ($)',
};

export default async function Dashboard() {
  if (!(await getSession())) redirect('/login');
  const stats = db.prepare(`SELECT (SELECT COUNT(*) FROM apps WHERE deleted_at IS NULL) apps,(SELECT COUNT(*) FROM ideas WHERE deleted_at IS NULL) ideas,(SELECT COUNT(*) FROM ideas WHERE deleted_at IS NULL AND status='published') published,(SELECT COALESCE(SUM(revenue),0) FROM performance_metrics) revenue`).get() as Record<string,any>;
  const apps = db.prepare(`SELECT apps.name,COUNT(ideas.id) ideas,SUM(CASE WHEN ideas.status='published' THEN 1 ELSE 0 END) published FROM apps LEFT JOIN ideas ON ideas.app_id=apps.id AND ideas.deleted_at IS NULL WHERE apps.deleted_at IS NULL GROUP BY apps.id ORDER BY ideas DESC`).all() as Record<string,any>[];
  const teams = db.prepare(`SELECT COALESCE(team,'Unassigned') team,COUNT(*) ideas,SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) approved,SUM(CASE WHEN deadline<date('now') AND status NOT IN ('published','archived','rejected') THEN 1 ELSE 0 END) overdue FROM ideas WHERE deleted_at IS NULL GROUP BY team ORDER BY ideas DESC`).all() as Record<string,any>[];
  const recent = db.prepare('select ideas.*,apps.name app_name from ideas join apps on apps.id=ideas.app_id where ideas.deleted_at is null order by ideas.updated_at desc limit 8').all() as Record<string,any>[];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="page-subtitle">Fikir üretiminin ve yayın performansının genel görünümü.</p>
      </header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(stats).map(([key, value]) => (
          <div className="card" key={key}>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{statLabels[key] ?? key}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{Number(value).toLocaleString('tr-TR')}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold">Apps</h2>
          {!apps.length && <p className="muted mt-3 text-sm">Henüz app yok.</p>}
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {apps.map((x) => (
              <li className="flex items-center justify-between gap-3 py-2.5" key={x.name}>
                <span className="min-w-0 truncate font-medium">{x.name}</span>
                <span className="muted shrink-0 text-sm tabular-nums">{x.ideas} fikir · {x.published ?? 0} yayında</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="font-semibold">Takımlar</h2>
          {!teams.length && <p className="muted mt-3 text-sm">Henüz fikir yok.</p>}
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {teams.map((x) => (
              <li className="flex items-center justify-between gap-3 py-2.5" key={x.team}>
                <span className="min-w-0 truncate font-medium">{x.team}</span>
                <span className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="muted tabular-nums">{x.ideas} fikir · {x.approved} onaylı</span>
                  {x.overdue > 0 && <span className="badge bg-red-500/10 text-red-700 dark:text-red-300">{x.overdue} gecikmiş</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card">
        <h2 className="font-semibold">Son fikirler</h2>
        {!recent.length && <p className="muted mt-3 text-sm">Henüz fikir eklenmedi.</p>}
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {recent.map((x) => (
            <li key={x.id}>
              <a className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50" href={`/ideas/${x.id}`}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{x.title}</span>
                  <span className="muted block truncate text-sm">{x.app_name}</span>
                </span>
                <StatusBadge status={x.status} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
