# BasExpo — Local Demo

Bu dosya proje için hızlı yerel demo talimatlarını içerir. Tek tıklamayla açmak için aşağıdaki linkleri kullanabilirsiniz (tarayıcıda localhost çalışıyor olmalı).

## Hızlı Başlatma

1. Bağımlılıkları yükle:

```bash
npm install
```

2. Ortam değişkenleri:

```bash
cp .env.example .env.local
# .env.local içindeki NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ve SUPABASE_SERVICE_ROLE_KEY değerlerini doldurun
```

3. Geliştirme sunucusunu başlat:

```bash
npm run dev
```

## Tıklanabilir Linkler

- Uygulamayı aç: [http://localhost:3000](http://localhost:3000)
- Sağlık kontrolü: [http://localhost:3000/api/healthz](http://localhost:3000/api/healthz)

## Notlar

- Proje kök README'sinde daha fazla kurulum bilgisi var: [README.md](README.md#L1-L112)
- Paket kilit dosyasında Playwright görünümü mevcut; eğer testler kuruluysa `npx playwright test` ile çalıştırabilirsiniz.

---

Herhangi bir özel bağlantı (ör. önceden doldurulmuş .env veya demo verisi) istersen, ekleyeyim.
