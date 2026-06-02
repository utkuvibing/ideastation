# IdeaStation

AsunaTech içinde mobil app projeleri için reklam ve short-form video fikirlerini tek yerde toplayan şirket içi fikir planlama aracı. Ekip app brief’leri tanımlar, video fikirleri (hook, script, storyboard vb.) üretir, Kanban ile durum takibi yapar ve birbirine feedback verir.

## Tech stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | [Next.js](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| UI | React, [Tailwind CSS](https://tailwindcss.com/) |
| Veritabanı | [SQLite](https://www.sqlite.org/) (`better-sqlite3`, dosya: `./data/app.db`) |
| AI | [OpenCode](https://opencode.ai/) HTTP API (`opencode serve`, varsayılan `127.0.0.1:4096`) |
| Auth | Cookie tabanlı oturum (`user_name`), `middleware.ts` ile route koruması |
| Dil | TypeScript |

`package.json` içinde `docx`, `pdfkit`, `zod` gibi bağımlılıklar var; şu an aktif kullanılmıyor (ileride export/validasyon için).

## Nasıl çalışır?

### Veri modeli

SQLite şeması (`lib/db.ts`):

- **apps** — App brief (hedef kitle, problem, marka tonu, AI talimatları vb.)
- **ideas** — Video fikirleri (`app_id` ile bağlı; hook, script, storyboard, status…)
- **feedback** — Idea başına ekip geri bildirimi (skorlar + yorum)
- **ai_generations** — OpenCode ile yapılan brainstorm geçmişi
- **users** — Giriş yapan kullanıcı kayıtları
- **comments**, **images**, **settings** — Şema hazır; UI henüz yok

### İstek akışı

1. Kullanıcı `/login` ile giriş yapar → `user_name` cookie set edilir.
2. `middleware.ts` login hariç tüm sayfaları cookie olmadan `/login`’e yönlendirir.
3. Sayfalar Server Component olarak DB’den okur (`lib/db.ts`).
4. Form gönderimleri **Server Actions** (`app/actions.ts`) ile SQLite’a yazar ve `redirect` eder.

### Sayfalar ve akış

| Rota | Amaç |
|------|------|
| `/` | Dashboard (app / idea / feedback sayıları) |
| `/apps` | App brief oluşturma; **Random doldur** formu doldurur |
| `/apps/[id]` | App detay + o app’e bağlı idealar |
| `/ideas` | Idea oluşturma (tüm creative alanlar) |
| `/ideas/[id]` | Idea detay + feedback formu |
| `/kanban` | Ideaları `status` sütunlarında görüntüleme; dropdown ile statü güncelleme |
| `/ai-brainstorm` | Seçilen app brief + OpenCode model ile fikir üretimi |
| `/settings` | OpenCode bağlantı durumu, workspace sıfırlama (`RESET`) |

**Tipik workflow**

1. **Apps** → Random doldur (isteğe bağlı) → **App Ekle** → otomatik `/ai-brainstorm?app_id=…`
2. **AI Brainstorm** → app + model + action → **Generate** → sonuç `ai_generations` tablosuna yazılır
3. **Ideas** → manuel fikir kartı oluşturma (AI çıktısı otomatik idea’ya dönüşmez; kopyala-yapıştır veya elle gir)
4. **Kanban** / idea detay → statü ve feedback

### OpenCode entegrasyonu

- `lib/ai.ts` yerel sunucuya HTTP isteği atar: `/config/providers`, `/session`, `/session/{id}/message`
- `OPENCODE_SERVER_PASSWORD` tanımlıysa HTTP Basic Auth (`opencode` kullanıcı adı)
- Provider API anahtarları OpenCode’un kendi config’inde; `.env` içindeki `OPENCODE_API_KEY` bu uygulama tarafından kullanılmaz

### Random doldur

Form üzerindeki **Random doldur** butonu (client component) alanları örnek metinle doldurur; **kaydetmez**. Kayıt için ilgili submit butonuna basılır.

## Kurulum

### Gereksinimler

- Node.js 20+ (LTS önerilir; `better-sqlite3` native modül — Node sürümü ile uyumlu olmalı)
- npm
- [OpenCode CLI](https://opencode.ai/) (`opencode` komutu PATH’te)

### 1. Projeyi al ve bağımlılıkları kur

```bash
git clone <repo-url>
cd "Short Video Idea Creator"
npm install
```

Native modül hatası alırsan (Node sürüm uyumsuzluğu):

```bash
npm rebuild better-sqlite3
```

### 2. Ortam değişkenleri

```bash
cp .env.example .env
```

`.env` örneği:

```env
COMPANY_NAME="AsunaTech"
DATABASE_PATH="./data/app.db"
UPLOAD_DIR="./uploads"
MAX_IMAGE_SIZE_MB="3"

OPENCODE_BASE_URL="http://127.0.0.1:4096"
OPENCODE_SERVER_USERNAME="opencode"
OPENCODE_SERVER_PASSWORD="güçlü-rastgele-şifre"
```

`OPENCODE_SERVER_PASSWORD` boş bırakılırsa sunucu şifresiz çalışır (sadece yerel geliştirme için).

### 3. İki terminalde çalıştır

**Terminal 1 — OpenCode API**

```bash
npm run opencode:serve
```

`.env` dosyasındaki şifreyi `dotenv-cli` ile yükler. Port **4096** sabittir; `opencode serve` (portsuz) rastgele port açar, uygulama bunu beklemez.

**Terminal 2 — Next.js**

```bash
npm run dev
```

Tarayıcı: [http://localhost:3000](http://localhost:3000)

### 4. Giriş

Test kullanıcıları (`app/actions.ts` içinde sabit):

| Email | Şifre |
|-------|--------|
| `admin@miniteamflow.local` | `password` |
| `admin2@miniteamflow.local` | `password` |
| `employee@miniteamflow.local` | `password` |
| `employee2@miniteamflow.local` | `password` |

### 5. Üretim build (isteğe bağlı)

```bash
npm run build
npm run start
```

## Proje yapısı

```
app/
  actions.ts          # Server Actions (CRUD, AI, reset)
  page.tsx            # Dashboard
  apps/               # App listesi + form
  ideas/              # Idea listesi + detay
  kanban/             # Statü kolonları
  ai-brainstorm/      # OpenCode brainstorm
  settings/           # Health + workspace reset
  login/
components/           # Client formlar (Random doldur)
lib/
  db.ts               # SQLite şema + bağlantı
  ai.ts               # OpenCode HTTP client
  random-fill.ts      # Örnek form verileri
middleware.ts         # Auth redirect
data/app.db           # SQLite dosyası (runtime)
```

## Sıfırlama

**Settings** → onay kutusuna `RESET` yaz → **Workspace sıfırla**  
`apps`, `ideas`, `feedback`, `ai_generations` ve ilgili tablolar temizlenir.

## Bilinen sınırlar

- AI brainstorm çıktısı otomatik **idea** kaydı oluşturmaz
- App / idea düzenleme ve silme UI yok (sadece oluşturma)
- Kanban sürükle-bırak yok (dropdown ile statü)
- Görsel upload, yorumlar (`comments`) ve tema toggle henüz yok
- Login kullanıcıları kod içinde; `.env` `COMPANY_PASSWORD` bağlı değil
