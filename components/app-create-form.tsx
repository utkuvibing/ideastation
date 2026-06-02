'use client';

import { createApp } from '@/app/actions';
import { RandomFillButton } from '@/components/random-fill-button';
import { randomAppFields } from '@/lib/random-fill';

export function AppCreateForm() {
  return (
    <form action={createApp} className="card grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2 flex flex-wrap items-center gap-2">
        <RandomFillButton fill={randomAppFields} />
        <span className="text-sm opacity-60">Alanları doldurur; kaydetmek için App Ekle.</span>
      </div>
      <input name="name" placeholder="App Name" required />
      <input name="category" placeholder="Category" />
      <textarea name="one_liner" placeholder="One-liner" />
      <textarea name="target_audience" placeholder="Target Audience" />
      <textarea name="main_problem" placeholder="Main User Problem" />
      <textarea name="core_features" placeholder="Core Features" />
      <textarea name="unique_selling_points" placeholder="Unique Selling Points" />
      <textarea name="competitors" placeholder="Competitors" />
      <textarea name="brand_tone" placeholder="Brand Tone" />
      <textarea name="content_style" placeholder="Content Style" />
      <textarea name="dos" placeholder="Do's" />
      <textarea name="donts" placeholder="Don'ts" />
      <textarea name="winning_ads" placeholder="Winning Ad Examples" />
      <textarea name="failed_ads" placeholder="Failed Ad Examples" />
      <input name="app_store_link" placeholder="App Store Link" />
      <input name="play_store_link" placeholder="Play Store Link" />
      <textarea name="ai_instructions" placeholder="Extra AI Instructions" className="md:col-span-2" />
      <button className="md:col-span-2">App Ekle → AI Brainstorm</button>
    </form>
  );
}
