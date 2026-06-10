import { db } from '@/lib/db';
import { listOpenCodeModels } from '@/lib/ai';
import { BrainstormForm } from '@/components/brainstorm-form';
import { createIdeaFromGeneration } from '@/app/actions';
import type { AIGenerationRow } from '@/lib/ai-jobs';

export const dynamic = 'force-dynamic';

type AIBrainstormGeneration = AIGenerationRow & { app_name?: string | null };

function GenerationBody({ generation }: { generation: AIBrainstormGeneration }) {
  switch (generation.status) {
    case 'failed':
      return (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-700 dark:text-red-300">
          <h3 className="font-bold">AI fikir üretimi başarısız</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm">{generation.error_message || 'Bilinmeyen bir hata oluştu.'}</p>
        </div>
      );
    case 'queued':
    case 'running':
      return <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">AI fikir üretimi arka planda devam ediyor.</p>;
    case 'completed':
      return <pre className="whitespace-pre-wrap text-sm">{generation.response}</pre>;
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Brainstorm</h1>
      {modelError && (
        <div className="card border-red-500/40 text-red-600 dark:text-red-300 space-y-2">
          <p className="font-semibold">OpenCode bağlantı hatası</p>
          <pre className="whitespace-pre-wrap text-sm">{modelError}</pre>
        </div>
      )}
      {params.error && (
        <div className="card border-red-500/40 text-red-600 dark:text-red-300">Model seçmelisin.</div>
      )}
      {!apps.length ? (
        <p className="card text-sm opacity-70">
          Önce <a href="/apps" className="underline">Apps</a> sayfasında brief oluştur (Random doldur → App Ekle).
        </p>
      ) : (
        <BrainstormForm apps={apps} models={models} defaultAppId={params.app_id} />
      )}
      {selected && (
        <section className="card space-y-3">
          <h2 className="font-bold">
            Sonuç: {selected.action} / {selected.model}
          </h2>
          <GenerationBody generation={selected} />
          <p className="text-sm opacity-60">Sure: {selected.duration_ms ?? '-'} ms / Tahmini maliyet: ${selected.estimated_cost_usd ?? 0}{Boolean(selected.sensitive_data_warning) && ' / Hassas veri uyarisi'}</p>
          {selected.status === 'completed' && <div className="flex flex-wrap gap-2">
            <a className="btn" href={`/api/generations/${selected.id}/docx`}>DOCX indir</a>
            <form action={createIdeaFromGeneration} className="flex min-w-0 flex-1 gap-2"><input type="hidden" name="generation_id" value={selected.id}/><input name="title" required defaultValue={selected.action} className="min-w-0 flex-1"/><button>Taslak fikre donustur</button></form>
          </div>}
        </section>
      )}
      <section className="card">
        <h2 className="font-bold mb-3">AI History</h2>
        {gens.map((g) => (
          <a href={`/ai-brainstorm?generation=${g.id}`} className="block border-t py-2" key={g.id}>
            <b>{g.action}</b>{' '}
            <span className="opacity-60">
              / {g.model} / {g.app_name || 'No app'} / {g.status || 'completed'}
            </span>
          </a>
        ))}
      </section>
    </div>
  );
}
