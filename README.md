# HesapFatura

Türkiye'deki işletmeler için banka tahsilatlarını cari hareketler ve e-Belge süreçleriyle eşleştiren otomasyon platformu.

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
