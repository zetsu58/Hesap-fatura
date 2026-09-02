# Deployment

1. `npm ci && npm run build && npm test`
2. Yedek al ve doğrula.
3. Tek seferlik migration job'ında `DATABASE_URL=... npm run db:migrate` çalıştır.
4. Uygulama image'ını immutable digest ile yayınla; `/ready` başarılı olmadan trafik verme.

Rollback'ta uygulama image'ı geri alınır. Migration'lar ileri yönlüdür; veri/schema geri dönüşü test edilmiş restore veya ayrı düzeltme migration'ı ile yapılır. Gerekli secret: `DATABASE_URL`; ileride provider credential'ları secret manager üzerinden ayrı adlarla tanımlanacaktır.
