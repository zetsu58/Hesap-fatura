# Mimari

Sistem, Fastify API ve PostgreSQL etrafında modüler monolith olarak evrilecektir. Domain modülleri yalnız kendi repository arayüzleri üzerinden veri erişir; bütün tenant verisi sorguları doğrulanmış `tenant_id` taşır. PostgreSQL composite foreign key'leri uygulama hatalarına karşı ikinci güvenlik sınırıdır.

Migration'lar immutable, artan sürümlü ve SHA-256 kontrollüdür. Her dosya transaction içinde uygulanır; session advisory lock eşzamanlı deployment'ları serileştirir.
