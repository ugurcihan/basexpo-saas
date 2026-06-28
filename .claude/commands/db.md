# /db — Veritabanı Durumu Sorgula

Kullanıcı DB'yi sorgulamak istiyor. Argümanı analiz et:

## Bağlantı
```
PGPASSWORD="4879407,nhC" psql "postgresql://postgres@db.kskohdijsrurlsmxioug.supabase.co:6543/postgres?sslmode=require"
```

## Kullanım örnekleri

### /db tables
Tüm tabloları ve satır sayılarını listele:
```sql
SELECT schemaname, tablename,
       (xpath('/row/cnt/text()', query_to_xml(
         format('SELECT COUNT(*) AS cnt FROM %I.%I', schemaname, tablename), 
         false, true, '')))[1]::text::int AS rows
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### /db <tablo_adi>
O tablonun kolonlarını ve son 5 kaydını göster:
```sql
-- Kolonlar
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '<tablo_adi>'
ORDER BY ordinal_position;

-- Son 5 kayıt
SELECT * FROM <tablo_adi> ORDER BY created_at DESC LIMIT 5;
```

### /db schema <tablo_adi>
`\d <tablo_adi>` çalıştır — kolonlar, tipler, constraint ve index'leri gösterir.

### /db migrations
Hangi migration'ların dosyada olduğunu listele, hangilerinin uygulanıp uygulanmadığını
supabase_migrations tablosuyla karşılaştır (eğer tablo varsa).

## Argüman yoksa
En temel özeti sun: tablo listesi + toplam kayıt sayıları.
