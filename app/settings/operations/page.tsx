import Link from 'next/link';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { checkOpenCodeHealth } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export default async function Operations() {
  await requireRole('admin');
  const started = Date.now();
  const ai = await checkOpenCodeHealth();
  db.prepare('insert into uptime_checks(service,ok,latency_ms,detail) values (?,?,?,?)').run('opencode', ai.ok ? 1 : 0, Date.now() - started, ai.error || ai.version || null);
  const errors = db.prepare('select * from error_log order by id desc limit 100').all() as Record<string, any>[];
  const checks = db.prepare('select * from uptime_checks order by id desc limit 50').all() as Record<string, any>[];
  return (
    <div className="space-y-6">
      <header>
        <Link href="/settings" className="muted text-sm hover:text-zinc-900 dark:hover:text-zinc-100">← Settings</Link>
        <h1 className="mt-1 text-2xl font-bold">Operations</h1>
        <p className="page-subtitle">Servis sağlığı, uptime kontrolleri ve hata kayıtları.</p>
      </header>
      <div className="card flex items-center gap-2.5">
        <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${ai.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="font-medium">OpenCode</span>
        <span className={`badge ${ai.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>{ai.ok ? 'OK' : 'DOWN'}</span>
      </div>
      <section className="card">
        <h2 className="font-semibold">Uptime checks</h2>
        {!checks.length && <p className="muted mt-3 text-sm">Henüz uptime kontrolü yok.</p>}
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {checks.map(x=>(
            <li className="flex flex-wrap items-center gap-2 py-2 text-sm" key={x.id}>
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${x.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="muted">{x.created_at}</span>
              <span className="font-medium">{x.service}</span>
              <span className="muted ml-auto tabular-nums">{x.latency_ms}ms</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2 className="font-semibold">Errors</h2>
        {!errors.length && <p className="muted mt-3 text-sm">Hata kaydı yok.</p>}
        <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {errors.map(x=>(
            <details className="py-2" key={x.id}>
              <summary className="cursor-pointer rounded text-sm transition-colors hover:text-red-600 dark:hover:text-red-300">
                <span className="muted">{x.created_at}</span> · <b>{x.source}</b>: {x.message}
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">{x.stack}</pre>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
