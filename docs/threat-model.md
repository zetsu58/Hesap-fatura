# Tehdit modeli

| Tehdit | Kontrol | Kalan iş |
|---|---|---|
| Tenant veri sızıntısı / IDOR | Composite FK'ler; bütün repository sorgularında zorunlu tenant bağlamı ilkesi | RLS değerlendirmesi ve endpoint testleri |
| Sahte banka webhook'u | Provider sözleşmesinde timestamp, nonce ve imza doğrulaması zorunlu olacaktır | Provider adaptörü uygulanmadı |
| Çift fatura gönderimi | Transactional outbox ve benzersiz idempotency anahtarı tasarım şartıdır | Gönderim modülü uygulanmadı |
| Yetkisiz fatura onayı | Tenant RBAC ve kritik işlemde yeniden doğrulama şartıdır | Auth modülü uygulanmadı |
| Provider credential sızıntısı | Log redaction; yalnız secret manager referansı saklama ilkesi | KMS/secret manager seçilmeli |
| Audit manipülasyonu | Actor tenant üyeliği DB foreign key'i; uygulamada update/delete sunulmaması | Ayrı append-only DB rolü |
| CSV formül enjeksiyonu | Dışa aktarımda `=`, `+`, `-`, `@` öneklerini escape etme şartı | Import/export modülü uygulanmadı |
| Kişisel veri sızıntısı | Log redaction, minimum veri, TLS ve erişim audit'i | Saklama/imha politikası onayı |

Güven sınırları istemci/API, API/PostgreSQL ve API/provider arasındadır. Production varsayılanı kapalı entegrasyondur.
