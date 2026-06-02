'use client';

import { runAIBrainstorm } from '@/app/actions';
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

export function BrainstormForm({
  apps,
  models,
  defaultAppId,
}: {
  apps: App[];
  models: Model[];
  defaultAppId?: string;
}) {
  const appIds = apps.map((a) => String(a.id));
  const modelIds = models.map((m) => m.id);

  return (
    <form action={runAIBrainstorm} className="card grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2 flex flex-wrap items-center gap-2">
        <RandomFillButton fill={() => randomBrainstormFields(appIds, modelIds)} />
        <span className="text-sm opacity-60">App, action ve prompt doldurur; model listeden seçilir.</span>
      </div>
      <select name="app_id" defaultValue={defaultAppId || ''}>
        <option value="">App seç</option>
        {apps.map((a) => (
          <option value={a.id} key={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {models.length > 0 ? (
        <select name="model" required defaultValue={modelIds[0] || ''}>
          <option value="">Model seç</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      ) : (
        <input name="model" required placeholder="provider:modelID (örn: anthropic:claude-sonnet-4-5)" />
      )}
      <select name="action" defaultValue={actions[0]}>
        {actions.map((a) => (
          <option key={a}>
            {a}
          </option>
        ))}
      </select>
      <textarea name="prompt" placeholder="Ek prompt / özel istek" className="md:col-span-2 min-h-32" />
      <button className="md:col-span-2">Generate</button>
    </form>
  );
}
