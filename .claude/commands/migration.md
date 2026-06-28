# /migration — Supabase Migration Uygula

Kullanıcı yeni bir migration çalıştırmak istiyor. Aşağıdaki adımları sırayla uygula:

## Bağlantı Bilgisi
```
PGPASSWORD="4879407,nhC" psql "postgresql://postgres@db.kskohdijsrurlsmxioug.supabase.co:6543/postgres?sslmode=require"
```

## Adım 1 — Mevcut migration dosyalarını listele
`supabase/migrations/` klasöründeki tüm `.sql` dosyalarını listele ve kullanıcıya göster.

## Adım 2 — Hangisini çalıştıracağını belirle
- Kullanıcı belirli bir dosya belirtmişse onu kullan.
- Belirtmemişse: klasördeki en son numaralı (en yüksek prefix) dosyayı öner.

## Adım 3 — Migration dosyasını oku ve içeriğini göster
Hangi SQL çalışacak kullanıcıya kısaca özetle (hangi tablo, hangi değişiklik).

## Adım 4 — Remote DB'ye uygula
```bash
PGPASSWORD="4879407,nhC" psql "postgresql://postgres@db.kskohdijsrurlsmxioug.supabase.co:6543/postgres?sslmode=require" -f supabase/migrations/NNN_dosya.sql
```

## Adım 5 — Doğrula
Migration'ın ne değiştirdiğine göre uygun bir doğrulama sorgusu çalıştır.

Örnekler:
- Yeni tablo eklediyse: `SELECT COUNT(*) FROM yeni_tablo;`
- Kolon eklediyse: `SELECT column_name FROM information_schema.columns WHERE table_name='tablo_adi' ORDER BY ordinal_position;`
- Index/constraint eklediyse: `SELECT indexname FROM pg_indexes WHERE tablename='tablo_adi';`

## Adım 6 — Sonucu raporla
- Başarılıysa: hangi değişikliğin uygulandığını özet olarak yaz.
- Hata varsa: hata mesajını analiz et ve nasıl düzeltileceğini öner.
