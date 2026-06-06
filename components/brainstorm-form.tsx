'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { runAIBrainstormWithState, type BrainstormState } from '@/app/actions';
import { RandomFillButton } from '@/components/random-fill-button';
import { randomBrainstormFields } from '@/lib/random-fill';

const actions = [
  'Generate 10 Short-Form Ideas',
  'Generate UGC Ad Ideas',
  'Generate Viral Hooks',
  'Generate Problem/Solution Ads',
  'Generate App Demo Ideas',
  'Generate Meme Concepts',
  'Generate Trend Adaptations',
  'Generate Competitor-Inspired Concepts',
  'Generate Low-Budget Video Ideas',
  'Improve App Brief',
  'Custom Brainstorm',
];

type App = { id: number; name: string };
type Model = { id: string; label: string };
const initialState: BrainstormState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="md:col-span-2 disabled:cursor-wait disabled:opacity-60">
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          AI fikir üretiyor, lütfen bekle...
        </span>
      ) : 'Brainstorm oluştur'}
    </button>
  );
}

export function BrainstormForm({
  apps,
  models,
  defaultAppId,
}: {
  apps: App[];
  models: Model[];
  defaultAppId?: string;
}) {
  const appIds = apps.map((app) => String(app.id));
  const modelIds = models.map((model) => model.id);
  const router = useRouter();
  const [state, formAction] = useActionState(runAIBrainstormWithState, initialState);

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state.status, state.generationId]);

  return (
    <form action={formAction} className="card grid gap-3 md:grid-cols-2">
      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <RandomFillButton fill={() => randomBrainstormFields(appIds, modelIds)} />
        <span className="text-sm opacity-60">App, aksiyon ve prompt doldurur; model listeden seçilir.</span>
      </div>
      <select name="app_id" defaultValue={defaultAppId || ''}>
        <option value="">App seç</option>
        {apps.map((app) => <option value={app.id} key={app.id}>{app.name}</option>)}
      </select>
      {models.length > 0 ? (
        <select name="model" required defaultValue={modelIds[0] || ''}>
          <option value="">Model seç</option>
          {models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
        </select>
      ) : (
        <input name="model" required placeholder="provider:modelID (örn: anthropic:claude-sonnet-4-5)" />
      )}
      <select name="action" defaultValue={actions[0]}>
        {actions.map((action) => <option key={action}>{action}</option>)}
      </select>
      <textarea name="prompt" placeholder="Ek prompt / özel istek" className="min-h-32 md:col-span-2" />
      <SubmitButton />
      {state.status === 'success' && (
        <div className="space-y-3 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-700 md:col-span-2 dark:text-green-300">
          <p className="font-semibold">Tamamlandı</p>
          <p className="text-sm">{state.message}</p>
          {state.response && (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-black/5 p-3 text-sm dark:bg-white/5">
              {state.response}
            </pre>
          )}
        </div>
      )}
      {state.status === 'error' && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-700 md:col-span-2 dark:text-red-300">
          <p className="font-semibold">Brainstorm başarısız</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{state.message}</p>
        </div>
      )}
    </form>
  );
}
