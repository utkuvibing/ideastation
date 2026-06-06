# IdeaStation

Mobil uygulama projeleri için reklam ve short-form video fikirlerini toplayan, ekip içi kullanıma yönelik bir fikir planlama aracı. App brief tanımlama, hook/script/storyboard notları, Kanban ile durum takibi ve fikir başına feedback.

## Tech stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | [Next.js](https://nextjs.org/) (App Router, Server Actions) |
| UI | React, [Tailwind CSS](https://tailwindcss.com/) |
| Veritabanı | SQLite (`better-sqlite3`) |
| AI (opsiyonel) | [OpenCode](https://opencode.ai/) HTTP API |
| Dil | TypeScript |

## Nasıl çalışır?

- **apps** — Ürün / kampanya brief alanları  
- **ideas** — Video fikir kartları (format, hook, script, storyboard, status…)  
- **feedback** — Idea üzerine skor ve yorum  
- **ai_generations** — AI brainstorm geçmişi (OpenCode açıksa)

Akış: giriş → app brief → (isteğe bağlı) AI brainstorm → idea kaydı → Kanban / feedback.

| Rota | Açıklama |
|------|----------|
| `/apps` | Brief oluşturma |
| `/ideas` | Fikir oluşturma |
| `/kanban` | Statü kolonları |
| `/ai-brainstorm` | OpenCode ile üretim |
| `/settings` | OpenCode durumu, veri sıfırlama |

**Random doldur** formları örnek metinle doldurur; kaydetmez.

## Kurulum

**Gereksinimler:** Node.js 20+, npm. AI için [OpenCode CLI](https://opencode.ai/).

```bash
git clone <repo-url>
cd ideastation
npm install
cp .env.example .env
# .env dosyasını düzenle (repo dışında tutulur)
```

Yerel geliştirme için tek komut:

```bash
npm run dev
```

Bu komut production build alır, ardından Next.js ve OpenCode sunucusunu aynı
terminalde başlatır. Next.js geliştirme göstergesi bu modda görünmez. Kod
geliştirirken hot reload için `npm run dev:code` kullanılabilir.

Uygulama: [http://localhost:3000](http://localhost:3000)

OpenCode portu `.env` içindeki `OPENCODE_BASE_URL` ile tanımlanır (`opencode:serve` script’i varsayılan olarak 4096 kullanır).

**Giriş:** Kimlik doğrulama geliştirme aşamasındadır; kullanıcıları `app/actions.ts` içinde veya ileride env tabanlı yapılandırmayla tanımlayın. **Gerçek şifre veya API anahtarlarını repoya veya README’ye yazmayın.**

```bash
npm run build
npm run start
```

`better-sqlite3` native modül hatasında: `npm rebuild better-sqlite3`

## Proje yapısı (özet)

```
app/          # Sayfalar ve Server Actions
components/   # Client formlar (random doldur)
lib/          # db, ai, random-fill
middleware.ts # Route koruması
data/         # SQLite (gitignore)
```

## Notlar

- `.env` ve `data/` commit edilmemelidir.  
- Üretimde auth, HTTPS ve OpenCode erişimini kendi ortamınıza göre sıkılaştırın.  
- AI çıktısı otomatik idea kaydına dönüşmez; upload, yorumlar ve tam CRUD henüz sınırlı.

## In-house operasyon

`.env` içinde `SESSION_SECRET` için en az 32 karakterlik rastgele bir değer ve
`IDEASTATION_USERS` için virgülle ayrılmış `email:password` kayıtları tanımlayın.

```bash
npm ci
npm run check
npm run start
```

Uygulamayı şirket VPN'i veya HTTPS sağlayan bir iç ağ geçidi arkasında yayınlayın.
SQLite dosyasını uygulama sunucusunun yerel kalıcı diskinde tutun, paylaşımlı ağ
diskinde çalıştırmayın.

```bash
npm run backup
```

Bu komut tutarlı bir SQLite yedeğini `BACKUP_DIR` dizinine yazar. Bu dizini ayrı
bir kalıcı depoya periyodik olarak kopyalayın. Geri yüklemeden önce uygulamayı
durdurun ve mevcut veritabanının ayrıca yedeğini alın.
