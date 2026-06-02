'use client';

import { createIdea } from '@/app/actions';
import { RandomFillButton } from '@/components/random-fill-button';
import { randomIdeaFields } from '@/lib/random-fill';

const formats = [
  'TikTok',
  'Instagram Reels',
  'YouTube Shorts',
  'UGC Ad',
  'Founder-style',
  'Meme',
  'Problem/Solution',
  'Before/After',
  'Testimonial',
  'Comparison',
  'Trend Adaptation',
  'App Demo',
  'Storytelling',
  'Challenge',
  'Reaction',
  'Educational',
];

const statuses = [
  'draft',
  'needs_feedback',
  'approved',
  'needs_script',
  'ready_to_shoot',
  'shooting',
  'shot',
  'editing',
  'published',
  'rejected',
  'archived',
];

const ideaFields = [
  'description',
  'hook',
  'script',
  'storyboard',
  'visual_notes',
  'voiceover',
  'caption',
  'cta',
  'hashtags',
  'why_it_might_work',
  'risks',
  'production_difficulty',
  'source',
  'competitor_url',
  'competitor_notes',
];

type App = { id: number; name: string };

export function IdeaCreateForm({ apps }: { apps: App[] }) {
  const appIds = apps.map((a) => String(a.id));
  return (
    <form action={createIdea} className="card grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2 flex flex-wrap items-center gap-2">
        <RandomFillButton fill={() => randomIdeaFields(appIds)} />
        <span className="text-sm opacity-60">Tüm idea alanlarını doldurur.</span>
      </div>
      <select name="app_id" defaultValue={appIds[0] || ''}>
        {apps.map((a) => (
          <option value={a.id} key={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input name="title" placeholder="Title" required />
      <select name="format">
        {formats.map((f) => (
          <option key={f}>
            {f}
          </option>
        ))}
      </select>
      <select name="status">
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {ideaFields.map((f) => (
        <textarea key={f} name={f} placeholder={f} />
      ))}
      <input name="ai_score" type="number" min={0} max={10} placeholder="AI Score" />
      <button className="md:col-span-2">Idea Ekle</button>
    </form>
  );
}
