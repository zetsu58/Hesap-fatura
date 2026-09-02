# HesapFatura

Türkiye'deki işletmeler için banka tahsilatlarını cari hareketler ve e-Belge süreçleriyle eşleştiren otomasyon platformu.

## Durum

Bu dal production temelinin ilk güvenlik artımını içerir; tam e-Belge ürünü değildir. Gerçek GİB/özel entegratör gönderimi kapalıdır. Güncel tamamlanan parçalar:

- PostgreSQL tarafından zorlanan tenant kapsamlı ilişkiler
- Advisory lock, checksum ve replay korumalı migration runner
- `/health`, veritabanı kontrollü `/ready`, correlation ID ve ortak hata zarfı
- Güvenli CORS varsayılanı, loglarda credential maskeleme ve graceful shutdown
- Unit ve PostgreSQL integration test temeli

## Lokal geliştirme

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run db:migrate
npm test
npm run dev
```

Migration komutunun ikinci çalışması `0 applied` ile başarılı olur. PostgreSQL integration testlerini çalıştırmak için `TEST_DATABASE_URL` tanımlayın.

## V1 hedefleri

- Çok işletmeli (multi-tenant) SaaS altyapısı
- Banka hareketi içe aktarma / sağlayıcı adaptörleri
- Cari ve müşteri eşleştirme motoru
- İşlem sınıflandırma ve belge karar motoru
- e-Fatura / e-Arşiv taslak üretimi
- UBL-TR doğrulama katmanı
- Kuyumcu ve kıymetli maden işlem modeli
- Değiştirilebilir e-Belge gateway/adaptör yapısı
- Yetkilendirme ve değiştirilemez audit log

## Temel prensip

Bir banka para girişi tek başına satış faturası anlamına gelmez. Sistem önce hareketi satış, mevcut fatura tahsilatı, avans/kapora, hesaplar arası transfer, iade veya inceleme gerektiren işlem olarak sınıflandırır. Fatura yalnızca uygun ticari olay doğrulandıktan sonra taslak veya onaylı belge haline gelir.

## Planlanan mimari

```text
Bankalar / Ödeme Kanalları
          |
          v
Transaction Ingestion
          |
          v
Matching + Classification Engine
          |
          v
Document Decision Engine
          |
          v
Invoice / E-Document Engine
          |
          v
UBL-TR Validation
          |
          v
E-Document Gateway
   |               |
Private Adapter   Future GIB Direct Adapter
```

> GİB'e doğrudan production gönderimi, gerekli resmi yetkilendirme/test süreçleri tamamlanmadan etkinleştirilmeyecektir.
