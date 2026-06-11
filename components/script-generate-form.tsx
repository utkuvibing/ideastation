'use client';

import { FormEvent, useState } from 'react';

type Model = { id: string; label: string };

export function ScriptGenerateForm({
  parentGenerationId,
  sourceModel,
  models,
}: {
  parentGenerationId: number;
  sourceModel: string;
  models: Model[];
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const hasSourceModel = models.some((model) => model.id === sourceModel);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    setFailed(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/ai-jobs/scripts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          parentGenerationId,
          model: form.get('model') || sourceModel,
          ideaNumbers: form.get('idea_numbers') || '',
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Script işi başlatılamadı.');
      setMessage('Detaylı script üretimi arka planda başladı. Tamamlanınca bildirim alacaksın.');
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Script işi başlatılamadı.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-violet-500/25 bg-violet-500/5 p-4">
      <div>
        <h3 className="text-sm font-semibold">Detaylı Script Üret</h3>
        <p className="muted text-sm">Bu fikirleri maksimum 12 saniyelik prodüksiyon scriptlerine dönüştürür; her script kopyala-yapıştır hazır Seedance 2.0 prompt&apos;u içerir.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Fikir numaraları
          <input name="idea_numbers" placeholder="Boş = tümü (örn. 1, 3, 7)" />
        </label>
        <label>Model
          {models.length > 0 ? (
            <select name="model" defaultValue={hasSourceModel ? sourceModel : models[0]?.id}>
              {!hasSourceModel && sourceModel && <option value={sourceModel}>{sourceModel} (kaynak)</option>}
              {models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
            </select>
          ) : (
            <input name="model" defaultValue={sourceModel} placeholder="provider:modelID" />
          )}
        </label>
      </div>
      <button disabled={pending} className="disabled:cursor-wait">
        {pending && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
        {pending ? 'Başlatılıyor...' : 'Detaylı Script Üret'}
      </button>
      {message && <p role="status" className={failed ? 'alert-error' : 'alert-success'}>{message}</p>}
    </form>
  );
}
