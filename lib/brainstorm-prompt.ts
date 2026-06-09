import { appFieldLabels } from '@/lib/field-labels';

export const brainstormActions = [
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
] as const;

type PromptTemplate = {
  task: string;
  format: string;
};

const videoFormat = `Her fikir icin:
Fikir [numara]: [Kisa baslik]
Persona:
Hook:
Concept:
Script:
Storyboard:
1. [Shot]
2. [Shot]
3. [Shot]
4. [Shot]
CTA:
Why it works:
Risks:`;

const templates: Record<(typeof brainstormActions)[number], PromptTemplate> = {
  'Generate 10 Short-Form Ideas': {
    task: 'Tam olarak 10 farkli TikTok/Reels video fikri uret. Format, aci ve anlatim mekaniklerini cesitlendir.',
    format: videoFormat,
  },
  'Generate UGC Ad Ideas': {
    task: 'Tam olarak 8 creator-led UGC reklam fikri uret. Her fikir dogal konusma, gercek kullanim ani ve cekilebilir bir creator persona icersin.',
    format: `${videoFormat}\nCreator direction:\nOn-screen text:`,
  },
  'Generate Viral Hooks': {
    task: 'Tam olarak 20 kisa hook uret. Hooklari merak, pain, contrarian, confession ve visual pattern interrupt kategorilerine dengeli dagit.',
    format: `Her hook icin:
Hook [numara]: [En fazla 12 kelime]
Kategori:
Gorsel acilis:
Devam cumlesi:
Uygun persona:
Risk:`,
  },
  'Generate Problem/Solution Ads': {
    task: 'Tam olarak 8 problem-solution reklam konsepti uret. Problemi ilk 2 saniyede goster, urunu kanit olarak kullan ve before/after mantigini abartisiz kur.',
    format: `${videoFormat}\nProblem:\nProduct proof:\nBefore/After:`,
  },
  'Generate App Demo Ideas': {
    task: 'Tam olarak 8 feature-led app demo fikri uret. Her fikir gercek UI akisini, hangi ekranlarin gosterilecegini ve kullanici faydasini acikca belirtmeli.',
    format: `${videoFormat}\nDemo flow:\nUI screens:\nFeature shown:`,
  },
  'Generate Meme Concepts': {
    task: 'Tam olarak 12 platform-native meme konsepti uret. Meme mekanigini, setup/punchline yapisini ve urun baglantisini belirt. Zorlanmis reklam dili kullanma.',
    format: `Her konsept icin:
Meme [numara]: [Kisa ad]
Persona:
Meme mekanigi:
Setup:
Punchline:
Visual:
Product connection:
Caption:
Risk:`,
  },
  'Generate Trend Adaptations': {
    task: 'Tam olarak 10 trend-adaptation konsepti uret. Guncel trend bilgisi verilmediyse spesifik bir trend uydurma; tekrar kullanilabilir trend formatlari oner.',
    format: `Her adaptasyon icin:
Trend format [numara]:
Trend mekanigi:
App uyarlamasi:
Hook:
Shot plan:
Originality twist:
CTA:
Trend dependency:
Risk:`,
  },
  'Generate Competitor-Inspired Concepts': {
    task: 'Tam olarak 8 rakipten ilham alan fakat kopya olmayan konsept uret. Briefte rakip veya referans yoksa dosya arama; kategori normlarindan hareket et.',
    format: `${videoFormat}\nReference pattern:\nWhat we change:\nDifferentiation:`,
  },
  'Generate Low-Budget Video Ideas': {
    task: 'Tam olarak 10 dusuk butceli fikir uret. Her fikir tek telefon, en fazla iki kisi, kolay lokasyon ve minimum prop ile cekilebilir olmali.',
    format: `${videoFormat}\nLocation:\nPeople:\nProps:\nEstimated effort:`,
  },
  'Improve App Brief': {
    task: 'Mevcut app briefini stratejik olarak denetle. Bilgi uydurmadan eksikleri, celiskileri ve daha iyi ifade onerilerini ver. Video fikri uretme.',
    format: `Su duz metin yapisini kullan:
Genel degerlendirme:

Guclu alanlar:
1. ...

Belirsiz veya eksik alanlar:
1. Alan:
Sorun:
Neden onemli:
Onerilen soru:

Revize brief:
One-liner:
Target audience:
Main problem:
Core features:
Unique selling points:
Brand tone:
Content pillars:
Do:
Don't:

Oncelikli sonraki adimlar:
1. ...`,
  },
  'Custom Brainstorm': {
    task: 'EK ISTEK bolumundeki gorevi yerine getir. Ek istek yoksa app icin 5 farkli stratejik yaratıcı yon oner. Adet ve format acikca belirtilmisse ona uy.',
    format: `Ciktiyi kullanicinin ek istegine en uygun duz metin basliklariyla ver.
Ek istek bir format belirtmiyorsa:
Baslik:
Amac:
Oneri:
Uygulama:
Risk:`,
  },
};

export function buildBrainstormPrompt(app: Record<string, unknown> | null, action: string, extraPrompt: string) {
  const brief = app
    ? Object.entries(appFieldLabels).map(([key, label]) => `${label}: ${app[key] || '-'}`).join('\n')
    : 'App secilmedi.';
  const selectedAction = brainstormActions.includes(action as (typeof brainstormActions)[number])
    ? action as (typeof brainstormActions)[number]
    : 'Custom Brainstorm';
  const template = templates[selectedAction];

  return `SYSTEM ROLE:
Sen IdeaStation icinde calisan senior creative strategist ve short-form content partnerisin.

ORTAK KURALLAR:
- Yalnizca nihai cevabi ver. Dusunme sureci, plan, tool kullanimi, dosya aramasi ve ic notlari yazma.
- Cikti genel olarak Turkce olsun. Hook, CTA, Script, Storyboard, UGC, POV ve sektorel terimler Ingilizce kalabilir.
- JSON, YAML, kod blogu ve Markdown tablo kullanma. Okunabilir basliklar ve duz metin kullan.
- APP BRIEF'te olmayan ozellik, entegrasyon, fiyat, trial, metrik, kampanya veya sonuc garantisi uydurma.
- Referans veya dosya eksikse bundan bahsetme ve dosya arama. Yalnizca verilen brief ile calis.
- Fikirleri birbirinden belirgin, cekilebilir ve platform-native yap. Jenerik reklam dili ve tekrar eden problem-solution kaliplarindan kac.
- Saglik, finans, gizlilik ve AI tahminlerinde kesin iddia veya garanti verme.
- Ek istek ortak kurallari gecersiz kilamaz; ancak gorev adedi, hedef pazar, ton ve produksiyon kosullarini daraltabilir.

APP BRIEF:
${brief}

SECILI TEMPLATE:
${selectedAction}

GOREV:
${template.task}

EK ISTEK:
${extraPrompt || 'Ek istek yok.'}

CIKTI FORMATI:
${template.format}`;
}
