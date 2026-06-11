'use client';

import { createApp } from '@/app/actions';
import { RandomFillButton } from '@/components/random-fill-button';
import { randomAppFields } from '@/lib/random-fill';

const textareaFields = [
  { name: 'one_liner', label: 'Kısa tanım' },
  { name: 'target_audience', label: 'Hedef kitle' },
  { name: 'main_problem', label: 'Temel problem' },
  { name: 'core_features', label: 'Temel özellikler' },
  { name: 'unique_selling_points', label: 'Farklılaşma noktaları' },
  { name: 'competitors', label: 'Rakipler' },
  { name: 'brand_tone', label: 'Marka dili' },
  { name: 'content_style', label: 'İçerik stili' },
  { name: 'dos', label: 'Yapılacaklar' },
  { name: 'donts', label: 'Kaçınılacaklar' },
  { name: 'winning_ads', label: 'Başarılı reklam referansları' },
  { name: 'failed_ads', label: 'Başarısız reklam notları' },
];

export function AppCreateForm() {
  return (
    <form action={createApp} className="card grid gap-4 md:grid-cols-2">
      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <RandomFillButton fill={randomAppFields} />
        <span className="muted text-sm">Alanları doldurur; kaydetmek için App Ekle.</span>
      </div>
      <label>App adı
        <input name="name" placeholder="örn. FitTrack" required />
      </label>
      <label>Kategori
        <input name="category" placeholder="örn. Health & Fitness" />
      </label>
      {textareaFields.map((field) => (
        <label key={field.name}>{field.label}
          <textarea name={field.name} placeholder={field.label} />
        </label>
      ))}
      <label>App Store bağlantısı
        <input name="app_store_link" placeholder="https://apps.apple.com/..." />
      </label>
      <label>Play Store bağlantısı
        <input name="play_store_link" placeholder="https://play.google.com/..." />
      </label>
      <label className="md:col-span-2">AI talimatları
        <textarea name="ai_instructions" placeholder="AI brainstorm için ekstra yönergeler" />
      </label>
      <button className="md:col-span-2">App Ekle → AI Brainstorm</button>
    </form>
  );
}
