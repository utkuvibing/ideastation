import { checkOpenCodeHealth } from '@/lib/ai';
import { db } from '@/lib/db';
import { resetWorkspaceData } from '@/app/actions';
import { requireRole } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  await requireRole('admin');
  const params = await searchParams;
  const health = await checkOpenCodeHealth();
  const baseUrl = process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:4096';
  const counts = db
    .prepare(
      `select
        (select count(*) from apps) apps,
        (select count(*) from ideas) ideas,
        (select count(*) from feedback) feedback`,
    )
    .get() as { apps: number; ideas: number; feedback: number };
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="page-subtitle">Workspace yönetimi, AI bağlantısı ve görünüm tercihleri.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <a className="btn btn-secondary" href="/settings/trash">Recycle Bin</a>
        <a className="btn btn-secondary" href="/settings/audit">Audit Log</a>
        <a className="btn btn-secondary" href="/settings/operations">Operations</a>
      </div>
      {params.reset && <div role="status" className="alert-success">Workspace sıfırlandı (apps, ideas, feedback).</div>}
      {params.error === 'confirm' && <div role="alert" className="alert-error">Sıfırlamak için kutuya RESET yaz.</div>}
      <div className="card space-y-3">
        <h2 className="font-semibold">OpenCode</h2>
        <p className="text-sm">Base URL: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">{baseUrl}</code></p>
        {health.ok ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
            Sunucu bağlı{health.version ? ` (v${health.version})` : ''}.
          </p>
        ) : (
          <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
            <p className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500" />
              Sunucuya ulaşılamıyor.
            </p>
            <p>Ayrı terminalde: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">npm run opencode:serve</code></p>
            {health.error && <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">{health.error}</pre>}
          </div>
        )}
      </div>
      <div className="card space-y-4">
        <h2 className="font-semibold">Veri</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className="badge badge-neutral tabular-nums">Apps: {counts.apps}</span>
          <span className="badge badge-neutral tabular-nums">Ideas: {counts.ideas}</span>
          <span className="badge badge-neutral tabular-nums">Feedback: {counts.feedback}</span>
        </div>
        <p className="muted text-sm">
          Formları doldurmak için Apps / Ideas / AI Brainstorm sayfalarındaki <b>Random doldur</b> butonunu kullan.
        </p>
        <form action={resetWorkspaceData} className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-red-700 dark:text-red-300">Tüm app, idea ve feedback kayıtlarını siler. Onay için RESET yaz.</p>
          <label className="max-w-xs">Onay metni
            <input name="confirm" placeholder="RESET" />
          </label>
          <button type="submit" className="btn-danger">Workspace sıfırla</button>
        </form>
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Görünüm</h2>
        <p className="muted text-sm">Açık ve koyu tema arasında geçiş yap.</p>
        <ThemeToggle variant="secondary" className="w-fit" />
      </div>
    </div>
  );
}
