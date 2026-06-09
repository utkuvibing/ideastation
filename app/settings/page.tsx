import { checkOpenCodeHealth } from '@/lib/ai';
import { db } from '@/lib/db';
import { resetWorkspaceData } from '@/app/actions';
import { requireRole } from '@/lib/auth';

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
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="flex flex-wrap gap-2"><a className="btn" href="/settings/trash">Recycle Bin</a><a className="btn" href="/settings/audit">Audit Log</a><a className="btn" href="/settings/operations">Operations</a></div>
      {params.reset && <div className="card border-green-500/40 text-green-700 dark:text-green-300">Workspace sıfırlandı (apps, ideas, feedback).</div>}
      {params.error === 'confirm' && <div className="card border-red-500/40 text-red-600 dark:text-red-300">Sıfırlamak için kutuya RESET yaz.</div>}
      <div className="card space-y-2">
        <h2 className="font-bold">OpenCode</h2>
        <p>Base URL: <code>{baseUrl}</code></p>
        {health.ok ? (
          <p className="text-green-600 dark:text-green-400">Sunucu bağlı{health.version ? ` (v${health.version})` : ''}.</p>
        ) : (
          <div className="text-red-600 dark:text-red-300 space-y-2">
            <p>Sunucuya ulaşılamıyor.</p>
            <p>Ayrı terminalde: <code>npm run opencode:serve</code></p>
            {health.error && <pre className="text-sm whitespace-pre-wrap opacity-90">{health.error}</pre>}
          </div>
        )}
      </div>
      <div className="card space-y-4">
        <h2 className="font-bold">Veri</h2>
        <p className="text-sm opacity-70">
          Apps: {counts.apps} · Ideas: {counts.ideas} · Feedback: {counts.feedback}
        </p>
        <p className="text-sm opacity-70">
          Formları doldurmak için Apps / Ideas / AI Brainstorm sayfalarındaki <b>Random doldur</b> butonunu kullan.
        </p>
        <form action={resetWorkspaceData} className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <p className="text-sm text-red-600 dark:text-red-300">Tüm app, idea ve feedback kayıtlarını siler. Onay için RESET yaz.</p>
          <input name="confirm" placeholder="RESET" className="w-full max-w-xs" />
          <button type="submit" className="border-red-500/50 text-red-600 dark:text-red-300">
            Workspace sıfırla
          </button>
        </form>
      </div>
      <div className="card"><h2 className="font-bold">Theme</h2><p>Dark/light toggle sonraki polish adımında eklenecek.</p></div>
    </div>
  );
}
