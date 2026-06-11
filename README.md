# IdeaStation

IdeaStation, mobil uygulamalar için reklam ve short-form video fikirlerini ekip içinde
oluşturmak, AI ile geliştirmek, onaylamak, üretime taşımak ve performansını ölçmek için
hazırlanmış şirket içi yaratıcı operasyon platformudur.

## Özellikler

- App ve kampanya brief yönetimi
- Action bazlı Türkçe AI Brainstorm şablonları
- UGC, viral hook, app demo, meme, trend ve low-budget fikir üretimi
- Fikirlerden maksimum 12 saniyelik detaylı prodüksiyon scripti üretimi (timecode, VO, kamera, ses)
- Her script için kopyala-yapıştır hazır Seedance 2.0 video prompt'u
- AI çıktısını taslak fikir kartına dönüştürme ve DOCX indirme
- App bazlı Kanban ve kontrollü onay akışı
- Owner, team, deadline, priority, tag, ülke, dil ve kanal alanları
- Yorum, mention, uygulama içi bildirim ve Slack/Teams webhook desteği
- Fikir ve brief revision geçmişi
- Soft delete, recycle bin ve audit log
- Yayınlanan kreatifler için performans metrikleri
- App, ekip ve kampanya bazlı raporlar
- Kazanan hook, format ve CTA kreatif kütüphanesi
- Benzer ve mükerrer fikir tespiti
- CSV, PDF ve DOCX export
- Koyu/açık tema ve modern, responsive arayüz
- RBAC, kurumsal proxy SSO ve hash'li yerel hesap desteği
- Migration, otomatik backup/restore ve health endpoint
- Docker Compose ve Caddy HTTPS dağıtım dosyaları

## Roller

| Rol | Yetki |
| --- | --- |
| `viewer` | İçerikleri, raporları ve export'ları görüntüler |
| `reviewer` | Feedback verir, fikir onaylar veya reddeder |
| `editor` | App, fikir, yorum, AI generation ve metrik yönetir |
| `admin` | Silme, restore, audit ve operasyon yönetimi yapar |

## Teknolojiler

- Next.js App Router ve Server Actions
- React, TypeScript ve Tailwind CSS
- SQLite (`better-sqlite3`)
- OpenCode HTTP API
- Zod
- Docker Compose ve Caddy

## Kurulum

Gereksinimler:

- Node.js 20 veya üzeri
- npm
- AI özellikleri için [OpenCode CLI](https://opencode.ai/)

```bash
git clone https://github.com/utkuvibing/ideastation.git
cd ideastation
npm install
```

Yerel kullanıcı formatı:

```env
AUTH_MODE=local
SESSION_SECRET=<en-az-32-karakter-rastgele-değer>
IDEASTATION_USERS=admin@example.com:admin:scrypt$...
DATABASE_PATH=./data/app.db
```

Parola hash'i oluşturmak için:

```bash
node scripts/hash-password.mjs "uzun-ve-rastgele-parola"
```

Kurumsal SSO kurulumu ve production ayarları için
[ops/PRODUCTION.md](ops/PRODUCTION.md) dosyasını kullanın.

## Çalıştırma

Migration ve geliştirme sunucuları:

```bash
npm run dev
```

Yalnızca Next.js geliştirme sunucusu:

```bash
npm run dev:app
```

Production:

```bash
npm run build
npm run start
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000)
adresinde çalışır. OpenCode sunucusu `127.0.0.1:4096` adresinde başlatılır.

## Kontrol ve Veri Operasyonları

Tam release kontrolü:

```bash
npm run check
```

Bu komut config kontrolü, migration, test, TypeScript ve production build çalıştırır.

```bash
npm run backup
npm run restore -- backups/ideastation-<timestamp>.db
npm run migrate
```

Health endpoint:

```text
/api/health
```

## Sayfalar

| Rota | Açıklama |
| --- | --- |
| `/` | App ve ekip bazlı dashboard |
| `/apps` | App brief yönetimi |
| `/ideas` | Fikir oluşturma, düzenleme ve export |
| `/kanban` | Üretim ve onay akışı |
| `/ai-brainstorm` | Action bazlı AI üretimi, detaylı script üretimi ve DOCX export |
| `/reports` | Kampanya ve performans raporları |
| `/library` | Kazanan kreatif kütüphanesi |
| `/notifications` | Atama, mention ve durum bildirimleri |
| `/settings` | Sistem ayarları |
| `/settings/trash` | Recycle bin |
| `/settings/audit` | Audit log |
| `/settings/operations` | Uptime ve hata kayıtları |

## Proje Yapısı

```text
app/          Sayfalar, API rotaları ve Server Actions
components/   Formlar ve etkileşimli UI bileşenleri
lib/          Auth, AI, validation, workflow ve veri servisleri
scripts/      Migration, config, backup ve restore araçları
ops/          Production runbook ve reverse proxy ayarları
tests/        Otomatik Node testleri
data/         SQLite veritabanı, Git dışında tutulur
backups/      Yerel yedekler, Git dışında tutulur
```

## Güvenlik ve Operasyon

- `.env`, `.env.production`, `data/` ve `backups/` repoya gönderilmez.
- Trusted-header SSO kullanılırken uygulama portu doğrudan internete açılmaz.
- Production yerel hesaplarında düz metin parola kabul edilmez.
- Backup dosyaları ayrı ve şifreli bir depoya kopyalanmalıdır.
- AI çıktıları doğrulanmadan yayınlanmamalıdır.
- Sağlık, finans ve performans iddialarında kesin sonuç garantisi verilmemelidir.

Değişiklik geçmişi için [CHANGELOG.md](CHANGELOG.md) dosyasına bakın.
