# IdeaStation

IdeaStation, mobil uygulamalar için reklam ve kısa video fikirlerini ekip içinde
oluşturmak, AI ile geliştirmek ve Kanban üzerinden takip etmek için hazırlanmış
bir fikir planlama aracıdır.

## Özellikler

- Uygulama ve kampanya brief'leri oluşturma
- Hook, senaryo, storyboard ve prodüksiyon notları içeren fikir kartları
- App bazlı Kanban, arama, filtreleme ve sürükle-bırak durum yönetimi
- OpenCode üzerinden AI Brainstorm
- AI işlemleri için yüklenme, başarı ve hata bildirimleri
- Fikir başına skor ve geri bildirim
- App ve fikir silme
- İmzalı oturum ve ortam değişkeni tabanlı kullanıcı yönetimi
- SQLite yedekleme ve yapılandırma kontrolü

## Teknolojiler

- Next.js App Router ve Server Actions
- React ve Tailwind CSS
- SQLite (`better-sqlite3`)
- OpenCode HTTP API
- TypeScript

## Kurulum

Gereksinimler:

- Node.js 20 veya üzeri
- npm
- AI özellikleri için [OpenCode CLI](https://opencode.ai/)

```bash
git clone https://github.com/utkuvibing/ideastation.git
cd ideastation
npm install
copy .env.example .env
```

`.env` dosyasındaki kullanıcı, oturum ve OpenCode şifrelerini gerçek ve güçlü
değerlerle değiştirin.

```dotenv
COMPANY_NAME="YourCompany"
SESSION_SECRET="en-az-32-karakter-rastgele-bir-deger"
IDEASTATION_USERS="admin@example.com:guclu-bir-sifre"
DATABASE_PATH="./data/app.db"
BACKUP_DIR="./backups"
OPENCODE_BASE_URL="http://127.0.0.1:4096"
OPENCODE_SERVER_PASSWORD="opencode-icin-guclu-bir-sifre"
```

## Çalıştırma

Normal kullanım için:

```bash
npm run dev
```

Bu komut:

1. Kullanılan `3000` ve `4096` portlarını temizler.
2. Production build oluşturur.
3. Next.js ve OpenCode sunucusunu aynı terminalde başlatır.

Uygulama: [http://localhost:3000](http://localhost:3000)

Kod geliştirirken hot reload için:

```bash
npm run dev:code
```

## Kontrol ve Yedekleme

Yapılandırma, TypeScript ve production build kontrolü:

```bash
npm run check
```

SQLite yedeği:

```bash
npm run backup
```

Yedekler varsayılan olarak `backups/` dizinine yazılır.

## Sayfalar

| Rota | Açıklama |
| --- | --- |
| `/` | Genel durum ve son fikirler |
| `/apps` | App brief oluşturma ve yönetme |
| `/ideas` | Fikir oluşturma, inceleme ve geri bildirim |
| `/kanban` | App bazlı üretim ve yayın süreci |
| `/ai-brainstorm` | OpenCode ile fikir üretme ve geçmiş |
| `/settings` | OpenCode durumu ve çalışma alanı ayarları |

## Proje Yapısı

```text
app/          Sayfalar ve Server Actions
components/   Formlar ve etkileşimli arayüz bileşenleri
lib/          Veritabanı, AI, auth ve ortak tanımlar
scripts/      Yapılandırma, port temizleme ve yedekleme araçları
proxy.ts      Rota ve oturum koruması
data/         SQLite veritabanı, Git dışında tutulur
backups/      Yerel yedekler, Git dışında tutulur
```

## Operasyon Notları

- `.env`, `data/` ve `backups/` repoya gönderilmez.
- Uygulamayı şirket VPN'i veya HTTPS sağlayan bir iç ağ geçidi arkasında yayınlayın.
- SQLite dosyasını uygulama sunucusunun yerel kalıcı diskinde tutun.
- `backups/` dizinini düzenli olarak ayrı bir kalıcı depoya kopyalayın.
- AI çıktıları geçmişe kaydedilir ancak otomatik olarak fikir kartına dönüştürülmez.
