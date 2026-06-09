# Changelog

Bu projedeki önemli değişiklikler bu dosyada belgelenir.

## [Unreleased]

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
