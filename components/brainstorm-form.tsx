'use client';

import { FormEvent, useState } from 'react';
import { RandomFillButton } from '@/components/random-fill-button';
import { randomBrainstormFields } from '@/lib/random-fill';
import { brainstormActions } from '@/lib/brainstorm-prompt';

type App = { id: number; name: string };
type Model = { id: string; label: string };

export function BrainstormForm({ apps, models, defaultAppId }: { apps: App[]; models: Model[]; defaultAppId?: string }) {
  const appIds = apps.map((app) => String(app.id));
  const modelIds = models.map((model) => model.id);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/ai-jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          appId: form.get('app_id'),
          model: form.get('model'),
          action: form.get('action'),
          prompt: form.get('prompt'),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'AI isi baslatilamadi.');
      setMessage('AI fikir uretimi arka planda basladi. Diger sayfalara gecebilirsiniz.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI isi baslatilamadi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 md:grid-cols-2">
      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <RandomFillButton fill={() => randomBrainstormFields(appIds, modelIds)} />
        <span className="text-sm opacity-60">App, aksiyon ve prompt doldurur; model listeden secilir.</span>
      </div>
      <select name="app_id" required defaultValue={defaultAppId || ''}>
        <option value="">App sec</option>
        {apps.map((app) => <option value={app.id} key={app.id}>{app.name}</option>)}
      </select>
      {models.length > 0 ? (
        <select name="model" required defaultValue={modelIds[0] || ''}>
          <option value="">Model sec</option>
          {models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
        </select>
      ) : (
        <input name="model" required placeholder="provider:modelID" />
      )}
      <select name="action" defaultValue={brainstormActions[0]}>
        {brainstormActions.map((action) => <option key={action}>{action}</option>)}
      </select>
      <textarea name="prompt" placeholder="Ek prompt / ozel istek" className="min-h-32 md:col-span-2" />
      <button disabled={pending} className="md:col-span-2 disabled:cursor-wait disabled:opacity-60">
        {pending ? 'Baslatiliyor...' : 'Brainstorm olustur'}
      </button>
      {message && <p role="status" className="md:col-span-2 text-sm">{message}</p>}
    </form>
  );
}
