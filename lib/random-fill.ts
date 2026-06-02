const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

const appNames = ['FocusFlow', 'PetSnap AI', 'BudgetBite', 'StudySprint', 'FitPulse'];
const categories = ['Productivity', 'Photo / Pets', 'Finance', 'Health', 'Education', 'Social'];

export function randomAppFields(): Record<string, string> {
  const name = `${pick(appNames)} ${Math.floor(Math.random() * 90 + 10)}`;
  return {
    name,
    category: pick(categories),
    one_liner: `${name}: mobil kullanıcılar için hızlı çözüm — demo brief.`,
    target_audience: pick(['18-24 öğrenciler', '25-34 remote worker', 'pet owner creators', 'young couples']),
    main_problem: pick([
      'Dikkat dağılıyor, hedefe odaklanamıyorlar',
      'İçerik üretmek çok zaman alıyor',
      'Haftalık bütçe kontrol edilemiyor',
    ]),
    core_features: pick([
      'Timer, streak, widget, bildirim özeti',
      'AI caption, template, trend ses eşleme',
      'Receipt scan, meal plan, savings goal',
    ]),
    unique_selling_points: pick(['Privacy-first', 'Offline mode', 'No dark patterns', '1-tap export']),
    competitors: pick(['Notion', 'CapCut', 'Headspace', 'YNAB', 'Todoist']),
    brand_tone: pick(['Calm & witty', 'Playful', 'Direct', 'Founder-authentic']),
    content_style: pick(['UGC', 'Founder POV', 'Before/after', 'App demo + hook']),
    dos: 'Gerçek UI göster, altyazı ekle, 3 sn hook, net CTA.',
    donts: 'Sahte metrik yok, uzun intro yok, trend ses lisansına dikkat.',
    winning_ads: 'https://example.com/reference-winning-ad',
    failed_ads: '45 sn konuşan kafa, hooksuz açılış',
    app_store_link: 'https://apps.apple.com/app/id000000000',
    play_store_link: 'https://play.google.com/store/apps/details?id=com.asunatech.demo',
    ai_instructions:
      'Short-form 9:16, Türkçe veya İngilizce, Title/Hook/Script/Storyboard/CTA formatında fikir üret.',
  };
}

const ideaTitles = [
  '3 sn hook: telefonu masaya koy',
  'POV: odak modu açılınca bildirimler susuyor',
  'UGC: kullanıcı “bu app beni kurtardı”',
  'Trend ses + split screen demo',
  'Founder: neden yaptık',
];

export function randomIdeaFields(appIds: string[]): Record<string, string> {
  return {
    app_id: appIds.length ? pick(appIds) : '',
    title: pick(ideaTitles),
    format: pick(['TikTok', 'Instagram Reels', 'UGC Ad', 'App Demo', 'Problem/Solution', 'Meme']),
    status: pick(['draft', 'needs_feedback', 'approved', 'ready_to_shoot']),
    description: 'Demo fikir — form random doldur ile üretildi.',
    hook: pick([
      'Stop scrolling — this changed my week.',
      'Day 3’te inandım.',
      'Sabah bunu yaparsan teşekkür edersin.',
    ]),
    script: '0-2s hook → 2-8s UI demo → 8-12s sonuç + CTA → logo',
    storyboard: '1) Hook text\n2) Screen record\n3) CTA card',
    visual_notes: '9:16, bold captions, brand accent',
    voiceover: 'Enerjik, samimi',
    caption: 'Link in bio — ücretsiz dene',
    cta: 'Download free',
    hashtags: '#shorts #ugc #app',
    why_it_might_work: 'Net pain + hızlı kanıt + native format',
    risks: 'Trend audio / telif',
    production_difficulty: pick(['low', 'medium', 'high']),
    ai_score: String(5 + Math.floor(Math.random() * 5)),
    source: 'random-fill',
    competitor_url: 'https://example.com/competitor-ad',
    competitor_notes: 'Hook güçlü, CTA geç — bizde erken CTA',
  };
}

const brainstormActions = [
  'Generate 10 Short-Form Ideas',
  'Generate UGC Ad Ideas',
  'Generate Viral Hooks',
  'Generate Problem/Solution Ads',
  'Generate App Demo Ideas',
  'Custom Brainstorm',
];

export function randomBrainstormFields(
  appIds: string[],
  modelIds: string[],
): Record<string, string> {
  return {
    app_id: appIds.length ? pick(appIds) : '',
    model: modelIds.length ? pick(modelIds) : '',
    action: pick(brainstormActions),
    prompt: pick([
      'Türkiye pazarı için 3 varyasyon üret. Hook max 8 kelime.',
      'Düşük bütçe, tek telefon çekimi. Founder tonu.',
      'Rakip reklamlarına cevap veren 5 fikir, her biri farklı format.',
      'Gen Z için meme-friendly ama brand-safe kalsın.',
    ]),
  };
}
