'use client';

import { useState } from 'react';
import { createIdea } from '@/app/actions';
import { RandomFillButton } from '@/components/random-fill-button';
import { randomIdeaFields } from '@/lib/random-fill';

const formats = [
  'TikTok', 'Instagram Reels', 'YouTube Shorts', 'UGC Ad', 'Founder-style',
  'Meme', 'Problem/Solution', 'Before/After', 'Testimonial', 'Comparison',
  'Trend Adaptation', 'App Demo', 'Storytelling', 'Challenge', 'Reaction', 'Educational',
];

const statuses = [
  'draft', 'needs_feedback', 'approved', 'needs_script', 'ready_to_shoot',
  'shooting', 'shot', 'editing', 'published', 'rejected', 'archived',
];

const ideaFields = [
  { name: 'description', label: 'Açıklama' },
  { name: 'hook', label: 'Hook' },
  { name: 'script', label: 'Senaryo' },
  { name: 'storyboard', label: 'Storyboard' },
  { name: 'visual_notes', label: 'Görsel notları' },
  { name: 'voiceover', label: 'Seslendirme' },
  { name: 'caption', label: 'Açıklama metni' },
  { name: 'cta', label: 'Aksiyon çağrısı (CTA)' },
  { name: 'hashtags', label: 'Etiketler' },
  { name: 'why_it_might_work', label: 'Neden işe yarayabilir?' },
  { name: 'risks', label: 'Riskler' },
  { name: 'production_difficulty', label: 'Prodüksiyon zorluğu' },
  { name: 'source', label: 'Kaynak' },
  { name: 'competitor_url', label: 'Rakip içerik bağlantısı' },
  { name: 'competitor_notes', label: 'Rakip içerik notları' },
];

const metaFields = [
  { name: 'tags', label: 'Tags', placeholder: 'virgülle ayır' },
  { name: 'campaign', label: 'Campaign', placeholder: 'Kampanya adı' },
  { name: 'channel', label: 'Channel', placeholder: 'TikTok, Meta...' },
  { name: 'country', label: 'Country', placeholder: 'TR, US...' },
  { name: 'language', label: 'Language', placeholder: 'tr, en...' },
];

type App = { id: number; name: string };

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:col-span-2">{children}</h3>;
}

export function IdeaCreateForm({
  apps,
  defaultAppId,
  returnTo = '/ideas',
  initiallyOpen = false,
  compact = false,
}: {
  apps: App[];
  defaultAppId?: number;
  returnTo?: string;
  initiallyOpen?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const appIds = apps.map((app) => String(app.id));
  const selectedAppId = String(defaultAppId || apps[0]?.id || '');

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{compact ? 'Bu app için yeni kart' : 'Yeni fikir'}</h2>
          <p className="muted text-sm">{compact ? 'Kaydedilen fikir doğrudan Kanban’a eklenir.' : 'Fikir listesi açık kalsın diye form kapalı başlar.'}</p>
        </div>
        <button type="button" aria-expanded={open} className={open ? 'btn-secondary' : ''} onClick={() => setOpen((value) => !value)}>
          {open ? 'Formu kapat' : '+ Yeni fikir ekle'}
        </button>
      </div>

      {open && (
        <form action={createIdea} className="grid gap-4 border-t border-zinc-200 pt-4 md:grid-cols-2 dark:border-zinc-800">
          <input type="hidden" name="return_to" value={returnTo} />
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <RandomFillButton fill={() => randomIdeaFields(appIds)} />
            <span className="muted text-sm">Tüm alanları örnek içerikle doldurur.</span>
          </div>

          <SectionHeading>Temel bilgiler</SectionHeading>
          <label>App
            <select name="app_id" defaultValue={selectedAppId}>
              {apps.map((app) => <option value={app.id} key={app.id}>{app.name}</option>)}
            </select>
          </label>
          <label>Başlık
            <input name="title" placeholder="Fikrin kısa başlığı" required />
          </label>
          <label>Format
            <select name="format">
              {formats.map((format) => <option key={format}>{format}</option>)}
            </select>
          </label>
          <label>Durum
            <select name="status">
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>

          <SectionHeading>İçerik</SectionHeading>
          {ideaFields.map((field) => (
            <label key={field.name}>{field.label}
              <textarea name={field.name} placeholder={field.label} />
            </label>
          ))}

          <SectionHeading>Planlama ve hedefleme</SectionHeading>
          <label>AI skoru (0-10)
            <input name="ai_score" type="number" min={0} max={10} placeholder="örn. 7" />
          </label>
          <label>Owner
            <input name="owner" type="email" placeholder="email@firma.com" />
          </label>
          <label>Team
            <input name="team" placeholder="Takım adı" />
          </label>
          <label>Deadline
            <input name="deadline" type="date" />
          </label>
          <label>Öncelik
            <select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
          </label>
          {metaFields.map((field) => (
            <label key={field.name}>{field.label}
              <input name={field.name} placeholder={field.placeholder} />
            </label>
          ))}
          <button className="md:col-span-2">Fikri kaydet</button>
        </form>
      )}
    </section>
  );
}
