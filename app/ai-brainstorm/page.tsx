import { db } from '@/lib/db';
import { listOpenCodeModels } from '@/lib/ai';
import { BrainstormForm } from '@/components/brainstorm-form';
import { ScriptGenerateForm } from '@/components/script-generate-form';
import { createIdeaFromGeneration } from '@/app/actions';
import { scriptGenerationAction } from '@/lib/brainstorm-prompt';
import type { AIGenerationRow } from '@/lib/ai-jobs';

export const dynamic = 'force-dynamic';

type AIBrainstormGeneration = AIGenerationRow & { app_name?: string | null };

const generationStatusBadge: Record<string, string> = {
  failed: 'bg-red-500/10 text-red-700 dark:text-red-300',
  queued: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  running: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

function GenerationBody({ generation }: { generation: AIBrainstormGeneration }) {
  switch (generation.status) {
    case 'failed':
      return (
        <div role="alert" className="alert-error">
          <h3 className="font-semibold">AI fikir üretimi başarısız</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm">{generation.error_message || 'Bilinmeyen bir hata oluştu.'}</p>
        </div>
      );
    case 'queued':
    case 'running':
      return (
        <p className="alert-warning flex items-center gap-2.5">
          <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          AI fikir üretimi arka planda devam ediyor.
        </p>
      );
    case 'completed':
      return <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed dark:bg-zinc-950">{generation.response}</pre>;
    default: {
      const exhaustive: never = generation.status;
      return exhaustive;
    }
  }
}

export default async function AIBrainstorm({
  searchParams,
}: {
  searchParams: Promise<{ generation?: string; error?: string; app_id?: string }>;
}) {
  const params = await searchParams;
  const apps: { id: number; name: string }[] = db.prepare('select id, name from apps order by name').all() as {
    id: number;
    name: string;
  }[];
  const gens = db
    .prepare(
      'select ai_generations.*, apps.name app_name from ai_generations left join apps on apps.id=ai_generations.app_id where apps.deleted_at is null order by ai_generations.id desc limit 20',
    )
    .all() as AIBrainstormGeneration[];
  let models: { id: string; label: string }[] = [];
  let modelError = '';
  try {
    models = await listOpenCodeModels();
  } catch (e: unknown) {
    modelError = e instanceof Error ? e.message : 'Model listesi alınamadı';
  }
  const selected = params.generation
    ? (gens.find((g) => String(g.id) === String(params.generation)) ||
        (db.prepare('select * from ai_generations where id=?').get(params.generation) as AIBrainstormGeneration | undefined))
    : null;
  const derivedScripts = selected
    ? db.prepare('select id,status,model,created_at from ai_generations where parent_generation_id=? order by id desc').all(selected.id) as Pick<AIGenerationRow, 'id' | 'status' | 'model' | 'created_at'>[]
    : [];
  const canGenerateScripts = Boolean(
    selected &&
    selected.status === 'completed' &&
    selected.action !== 'Improve App Brief' &&
    selected.action !== scriptGenerationAction,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">AI Brainstorm</h1>
        <p className="page-subtitle">App brief&apos;ini kullanarak AI ile yeni içerik fikirleri üret.</p>
      </header>
      {modelError && (
        <div role="alert" className="alert-error space-y-2">
          <p className="font-semibold">OpenCode bağlantı hatası</p>
          <pre className="whitespace-pre-wrap text-sm">{modelError}</pre>
        </div>
      )}
      {params.error && (
        <div role="alert" className="alert-error">Model seçmelisin.</div>
      )}
      {!apps.length ? (
        <div className="card py-10 text-center">
          <h2 className="font-semibold">Önce bir app brief&apos;i gerekli</h2>
          <p className="muted mt-1 text-sm">Apps sayfasında brief oluştur (Random doldur → App Ekle).</p>
          <a href="/apps" className="btn mt-4 inline-flex">Apps sayfasına git</a>
        </div>
      ) : (
        <BrainstormForm apps={apps} models={models} defaultAppId={params.app_id} />
      )}
      {selected && (
        <section className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Sonuç: {selected.action}</h2>
            <span className="badge badge-neutral">{selected.model}</span>
          </div>
          {selected.parent_generation_id && (
            <p className="text-sm">
              <a className="font-medium text-violet-600 hover:underline dark:text-violet-300" href={`/ai-brainstorm?generation=${selected.parent_generation_id}`}>
                ← Kaynak fikirler: #{selected.parent_generation_id}
              </a>
            </p>
          )}
          <GenerationBody generation={selected} />
          <p className="muted text-sm">Süre: {selected.duration_ms ?? '-'} ms · Tahmini maliyet: ${selected.estimated_cost_usd ?? 0}{Boolean(selected.sensitive_data_warning) && ' · Hassas veri uyarısı'}</p>
          {selected.status === 'completed' && <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <a className="btn btn-secondary" href={`/api/generations/${selected.id}/docx`}>DOCX indir</a>
            <form action={createIdeaFromGeneration} className="flex min-w-0 flex-1 gap-2">
              <input type="hidden" name="generation_id" value={selected.id}/>
              <input name="title" aria-label="Taslak fikir başlığı" required defaultValue={selected.action} className="min-w-0 flex-1"/>
              <button className="shrink-0">Taslak fikre dönüştür</button>
            </form>
          </div>}
          {canGenerateScripts && (
            <ScriptGenerateForm parentGenerationId={selected.id} sourceModel={selected.model} models={models} />
          )}
          {derivedScripts.length > 0 && (
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <h3 className="text-sm font-semibold">Üretilen scriptler</h3>
              <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
                {derivedScripts.map((script) => (
                  <li key={script.id}>
                    <a href={`/ai-brainstorm?generation=${script.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <span className="min-w-0 truncate">Script #{script.id} <span className="muted">· {script.model} · {script.created_at}</span></span>
                      <span className={`badge ${generationStatusBadge[script.status] ?? 'badge-neutral'}`}>{script.status}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      <section className="card">
        <h2 className="font-semibold">AI geçmişi</h2>
        {!gens.length && <p className="muted mt-3 text-sm">Henüz AI üretimi yok.</p>}
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {gens.map((g) => (
            <li key={g.id}>
              <a href={`/ai-brainstorm?generation=${g.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{g.action}</span>
                    {g.parent_generation_id && <span className="badge bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">Script · #{g.parent_generation_id}</span>}
                  </span>
                  <span className="muted block truncate text-sm">{g.model} · {g.app_name || 'No app'}</span>
                </span>
                <span className={`badge ${generationStatusBadge[g.status || 'completed'] ?? 'badge-neutral'}`}>{g.status || 'completed'}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
