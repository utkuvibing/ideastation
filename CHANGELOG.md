# Changelog

Bu projedeki önemli değişiklikler bu dosyada belgelenir.

## [Unreleased]

## [1.2.0] - 2026-06-13

### Added

- Ideas sayfasına istemci tarafında çalışan arama, durum filtresi ve sıralama kontrolleri eklendi.
- Ideas listesine sonuç sayacı ve arama/filtre eşleşmediğinde gösterilen özel boş durum eklendi.

### Changed

- Dashboard, ürün ana sayfası gibi çalışacak şekilde hero alanı, hızlı aksiyonlar ve daha belirgin metrik kartlarıyla yeniden düzenlendi.
- Fikir kartları; başlık, app/format bilgisi, durum rozeti ve hook önizlemesi daha kolay taranacak şekilde iyileştirildi.
- Global kart, buton, form, mobil üst bar, yan menü ve tema geçişi stilleri daha rafine SaaS görünümü için güncellendi.
- Mobil görünümde üst navigasyon ve tema/çıkış kontrolleri daha kompakt hale getirildi.

### Verified

- `npm run typecheck`, `npm run build` ve `npm run test` başarılı çalıştırıldı.
- Yerel test verisiyle `/`, `/ideas`, `/kanban` ve `/apps` sayfaları masaüstü ve mobil görünümde görsel olarak kontrol edildi.

## [1.1.0] - 2026-06-11

### Added

- İki aşamalı AI pipeline: tamamlanan fikir üretimlerinden "Detaylı Script Üret" ile prodüksiyon scripti üretme
- Maksimum 12 saniyelik, timecode, VO/diyalog, on-screen text, kamera ve ses/müzik içeren script formatı
- Her script için kopyala-yapıştır hazır, İngilizce, timeline formatında Seedance 2.0 video prompt'u
- Fikir numarası filtresi ve model seçimi ile script üretim formu
- `ai_generations` tablosuna `parent_generation_id` kolonu ve kaynak üretim ile script arasında iki yönlü bağlantı
- `/api/ai-jobs/scripts` endpoint'i ve `Generate Production Scripts` aksiyonu
- Koyu/açık tema desteği (`next-themes`) ve tema değiştirme düğmesi
- Durum rozetleri, boş/yükleniyor durumları ve ikonlu yan menü navigasyonu

### Changed

- Tüm sayfalar ortak bir tasarım sistemiyle (buton, kart, rozet, uyarı, form stilleri) modern SaaS arayüzüne dönüştürüldü
- AI Brainstorm prompt'ları Seedance 2.0 (AI video) üretimine göre optimize edildi: tek aksiyon + tek kamera hareketi, 12 saniye hedefi, AI üretiminde tutarlı persona tarifleri
- UGC, App Demo ve Low-Budget şablonları gerçek çekim yerine AI video üretimi varsayımıyla güncellendi

### Fixed

- Reasoning modellerinin (qwen, minimax vb.) düşünme sürecinin AI çıktısının başına sızması engellendi; yalnızca nihai metin part'ları kaydediliyor
- App düzenleme formunda zorunlu `name` alanının render edilmemesi düzeltildi

## [1.0.0] - 2026-06-09

### Added

- `viewer`, `reviewer`, `editor` ve `admin` rollerine dayalı RBAC
- Trusted-header kurumsal SSO ve scrypt parola desteği
- Sunucu tarafı mutation yetkilendirmesi ve Zod doğrulaması
- Sürümlü SQLite migration altyapısı
- Audit log, revision history, soft delete ve recycle bin
- Owner, team, deadline, priority, tag ve kampanya boyutları
- Yorum, mention, bildirim ve Slack/Teams webhook desteği
- Kontrollü fikir onay ve üretim workflow'u
- Performans metrikleri, app/ekip raporları ve kreatif kütüphane
- Benzer fikir tespiti
- CSV, PDF ve AI Brainstorm DOCX export
- Action bazlı Türkçe AI Brainstorm system prompt'ları
- AI timeout, retry, maliyet tahmini ve hassas veri uyarısı
- Merkezi hata kaydı, uptime görünümü ve health endpoint
- Bütünlük kontrollü backup, retention ve güvenli restore
- Dockerfile, Docker Compose, Caddy HTTPS ve production runbook
- Mobil navigasyon ve temel erişilebilirlik iyileştirmeleri
- Prompt, workflow, mention ve hassas veri testleri

### Changed

- App ve fikir silme işlemleri kalıcı silme yerine soft delete kullanıyor.
- AI action'ları tek genel şablon yerine görev bazlı çıktı formatları kullanıyor.
- Geliştirme ve production başlatma komutları ayrıştırıldı.

### Security

- Production ortamında düz metin yerel parola engellendi.
- Admin işlemleri rol kontrolü ile sınırlandırıldı.
- Restore işlemi öncesinde otomatik güvenlik kopyası eklenerek veri kaybı riski azaltıldı.
