# BasExpo — AI Destekli Fuar İşletim Sistemi

BasExpo, fuarların tüm operasyonunu — ziyaretçi girişinden lead toplamaya, AI eşleştirmeden ROI analizine — tek platformda yöneten bir Expo OS'tir.

**Çekirdek değer döngüsü:** Ziyaretçi gelir → AI doğru firmaları önerir → QR ile lead oluşur → firma ROI görür.

---

## Tech Stack

| Katman | Seçim | Neden |
|--------|-------|-------|
| Web Frontend | Next.js 16 (App Router) + TypeScript | SSR, hızlı, React bilgisi mobilde taşınır |
| UI | Tailwind CSS + shadcn/ui + Framer Motion | Hızlı, tutarlı, animasyonlu |
| Backend / DB | Supabase (Postgres + Auth + Storage + Realtime) | Auth, DB, dosya, realtime tek yerde |
| AI Matchmaking | OpenAI/Anthropic embeddings + pgvector | Vektör benzerliği ile eşleştirme |
| State | TanStack Query + Zustand | Sade, ölçeklenebilir |
| Ödeme (Faz 7) | Stripe | Abonelik ve tek seferlik ödeme |

---

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Supabase projesi oluştur

1. [supabase.com](https://supabase.com) → New project
2. Project URL ve anon key'i kopyala
3. `.env.example` → `.env.local` olarak kopyala ve doldurun:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Tarayıcıda: `http://localhost:3000`

### 4. Build doğrulama

```bash
npm run build
```

---

## Faz Planı

| Faz | İçerik | Durum |
|-----|--------|-------|
| **0** | Next.js kurulum + animasyonlu landing | ✅ Tamamlandı |
| **1** | Auth + roller + Supabase şema + RLS | ⏳ Bekliyor |
| **2** | Organizatör: fuar/salon/stand CRUD | ⏳ Bekliyor |
| **3** | Firma: profil + ürün + QR kod | ⏳ Bekliyor |
| **4** | Ziyaretçi: QR badge + lead capture (MVP çekirdeği) | ⏳ Bekliyor |
| **5** | AI Matchmaking v1 (pgvector + embeddings) | ⏳ Bekliyor |
| **6** | Networking + toplantı planlama | ⏳ Bekliyor |
| **7** | Analitik + Stripe ödemeler | ⏳ Bekliyor |

Her faz kullanıcı onayı alındıktan sonra başlar.

---

## Klasör Yapısı

```
src/
├── app/
│   ├── layout.tsx              # root layout (fontlar, metadata)
│   ├── page.tsx                # landing sayfası
│   └── api/
│       └── healthz/route.ts   # sağlık kontrolü
├── components/
│   ├── landing/                # landing bileşenleri
│   └── ui/                     # shadcn/ui bileşenleri
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── utils.ts                # cn() yardımcısı
└── types/
    └── index.ts                # paylaşılan TypeScript tipleri
```

---

## Sağlık Kontrolü

```bash
curl http://localhost:3000/api/healthz
# {"status":"ok","ts":"2025-...","version":"0.1.0","phase":"0"}
```

---

## Lisans

MIT
