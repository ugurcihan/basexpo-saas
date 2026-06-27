# BasExpo — Claude Code Kılavuzu

## Proje Nedir?

BasExpo, **fuar organizatörlerine ücretsiz** sunulan, **katılımcı firmaların** aylık ücret ödediği bir B2B2C fuar yönetim SaaS platformudur.

**Gelir modeli:**
- Organizatör: Ücretsiz — ön kayıt datası, AI raporu ve ısı haritası karşılığında platform kullanır
- Firma (Exhibitor): 13.000 TL/ay abonelik + stant aktivasyon ücreti (Stripe)
- Sponsor katmanları: Platin / Altın / Gümüş / Bronz

**Değer önerileri:**
- Organizatör → Ön kayıt datası (stant satış argümanı), fuar sonrası AI raporu, canlı ısı haritası, fuardaki ziyaretçilere hedefli bildirim, ödül yönetimi
- Firma → KVKK'lı lead toplama, markalı QR sayfa, ürün vitrini, AI ROI raporu, kişiselleştirilmiş marka sayfası
- Ziyaretçi → Kişiselleştirilmiş AI eşleşme, rozet/sadakat puanı, ödül kazanma, ücretli fuarlara ücretsiz bilet, networking

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.2.9 (App Router, Server Components, Turbopack) |
| Dil | TypeScript 5 |
| UI | Tailwind CSS 3 + Shadcn/ui + Framer Motion 11 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI text-embedding-3-small (1536 dim, pgvector) |
| Ödeme | Stripe (TRY, booth activation fee) |
| QR | qrcode.react — hydration-safe `QRDisplay` componenti kullan. Yaka kartı için `QRCodeCanvas` + `toDataURL()` + `<img>` yaklaşımı (html2canvas uyumu) |
| PDF | html2canvas (scale: 3, useCORS: true) → jsPDF, 352×232px DOM = 88×58mm A4 |

---

## Klasör Yapısı

```
src/
├── app/
│   ├── (auth)/                    # /login, /register
│   ├── (visitor)/visitor/         # Ziyaretçi paneli (/visitor/**)
│   │   ├── page.tsx               # Dashboard
│   │   ├── loyalty/               # Puanlarım (/visitor/loyalty)
│   │   ├── upcoming-fairs/        # Yaklaşan fuarlar
│   │   ├── tickets/               # Biletlerim
│   │   ├── recommendations/       # AI Önerileri
│   │   ├── favorites/             # Favorilerim
│   │   ├── connections/           # Bağlantılarım
│   │   ├── meetings/              # Toplantılarım
│   │   └── settings/              # Ayarlar
│   ├── (exhibitor)/exhibitor/     # Firma paneli (/exhibitor/**)
│   ├── (organizer)/organizer/     # Organizatör paneli (/organizer/**)
│   │   └── events/[eventId]/      # Fuar detay (EventDetailClient.tsx)
│   ├── scan/[token]/              # Public: firma QR → lead oluşturur
│   ├── scan/booth/[token]/        # Public: stant QR → checkInToBoothScan (+20 puan)
│   ├── golden-scan/[token]/       # Public: çekiliş QR → golden_qr_scans
│   └── api/
│       ├── stripe/checkout/       # POST: Stripe session oluştur
│       ├── stripe/webhook/        # POST: ödeme tamamlandı hook
│       └── healthz/               # GET: health check
├── components/
│   ├── landing/                   # Hero, Features, HowItWorks, UserRoles, CTA, Footer
│   ├── dashboard/                 # DashboardShell (rol bazlı nav wrapper)
│   └── ui/                        # Shadcn/ui bileşenleri
├── features/                      # Server Actions — tüm DB işlemleri buradan
│   ├── ai/actions.ts              # OpenAI embedding + match_exhibitors()
│   ├── events/                    # actions, hallActions, goldenQRActions, registrationActions
│   ├── exhibitors/actions.ts      # Firma profil + ürün CRUD
│   ├── leads/actions.ts           # Lead yakalama + skorlama
│   ├── connections/actions.ts     # P2P bağlantı istekleri
│   ├── loyalty/
│   │   ├── actions.ts             # earnPoints, getMyLoyaltyStats, getEventLeaderboard, rozet+ödül kontrolü
│   │   └── organizerActions.ts    # upsertRewardTier, deleteRewardTier, getEventRewardTiers, getEventLoyaltySummary
│   └── notifications/notificationActions.ts
└── lib/
    ├── supabase.ts                # Browser client (createSupabaseBrowserClient)
    ├── supabase-server.ts         # Server client (createSupabaseServerClient + getProfile)
    ├── openai.ts                  # Embedding wrapper
    └── stripe.ts                  # Stripe init
```

---

## Veritabanı Şeması

### Enum Türleri
```sql
user_role:         organizer | exhibitor | visitor | admin
event_status:      draft | published | active | ended
lead_source:       qr | manual
connection_status: pending | accepted | rejected
meeting_status:    pending | accepted | declined
```

### Tablolar

| Tablo | Açıklama | Kritik Kolon |
|-------|----------|--------------|
| profiles | Kullanıcı profilleri (auth trigger ile otomatik) | role, embedding(1536), interests[] |
| events | Fuar tanımları | organizer_id, status, capacity, gallery_urls[] |
| halls | Fuar salonları | event_id, floor |
| booths | Stant alanları | hall_id, code, exhibitor_id (nullable) |
| exhibitors | Firma profilleri | owner_id, qr_token (unique), embedding(1536), event_id (nullable) |
| products | Firma ürünleri | exhibitor_id, name, image_url |
| leads | Lead kayıtları | exhibitor_id, visitor_id, source, score |
| connections | P2P bağlantılar | from_user, to_user, status |
| match_scores | AI eşleşme | visitor_id, exhibitor_id, score |
| meetings | Toplantılar | from_user, to_user, proposed_at, status |
| event_registrations | Fuar kayıtları | event_id, visitor_id, ticket_code, kvkk_consent |
| event_sponsors | Sponsor katmanları | event_id, exhibitor_id, tier (1-4) |
| qr_scans | QR tarama logu (ısı haritası) | exhibitor_id, booth_id, visitor_id, event_id |
| notifications | Bildirimler | recipient_id, type, is_read |
| golden_qr_codes | Çekiliş QR kodları | token (unique hex), is_active, scan_limit |
| golden_qr_scans | Çekiliş katılım | golden_qr_id, visitor_id (unique birlikte) |
| fair_checkins | Fiziksel fuar girişi | event_id, visitor_id, checked_in_at |
| badge_definitions | Rozet tanımları | name, icon, condition_type, condition_value, event_id (null=global) |
| visitor_badges | Kazanılan rozetler | visitor_id, badge_id, event_id, earned_at |
| loyalty_points | Sadakat puanı logu | visitor_id, event_id, points, reason, exhibitor_id |
| reward_tiers | Ödül eşikleri | event_id, points_required, reward_title, max_winners (null=sınırsız) |
| reward_winners | Ödül kazananları | tier_id, visitor_id, rank, claimed_at |

**RLS Kuralı:** Her tablo RLS aktif olmalı. Policy adı şablonu: `"tablename: açıklama"`
Yeni tablo eklenince mutlaka RLS politikaları yazılmalı.

> **⚠️ Public sayfa + RLS:** `/scan/booth/[token]` gibi auth gerektirmeyen sayfalarda booth verisi okurken
> `createSupabaseAdminClient()` (service role) kullanılmalı — anon key ile RLS yüzünden `null` döner → 404.

### loyalty_points reason değerleri
```
checkin       → +50 puan (fuara fiziksel giriş — unique per event+visitor)
booth_visit   → +20 puan (stant QR tarama — unique per event+visitor+exhibitor)
meeting       → +30 puan (toplantı kabulü)
connection    → +20 puan (bağlantı)
```

### Rozet Koşulları (badge_definitions.condition_type)
```
checkin       → kaç kez check-in (genellikle 1)
booth_visits  → kaç stant ziyareti
meetings      → kaç toplantı
total_points  → toplam puan eşiği
```

### Migrasyon Sırası
```
001_initial_schema.sql
002_phase4_rls.sql
003_phase5_vector.sql
004_phase6_meetings.sql
005_phase7_payments.sql
006_sponsors_and_registrations.sql
007_heatmap_notifications_golden_qr.sql
008_fix_rls_and_schema.sql       ← capacity kolonu + event_registrations tablosu
009_brand_and_checkin.sql        ← firma marka alanları + fair_checkins + KVKK
010_badges_and_loyalty.sql       ← rozet + sadakat sistemi (eski, yerini 021 aldı)
011_push_subscriptions.sql
012_kvkk_favorites_meetings_v2.sql
013_lead_conversions_and_profiles.sql
014_hall_maps.sql
015_checkin_gate_wayfinding.sql
016_event_details.sql
017_sponsor_tasks_fix.sql
018_map_columns_sponsor_layout.sql
019_events_requires_approval.sql
020_organizer_profile_follows.sql
021_loyalty_and_badges.sql       ← badge_definitions + visitor_badges + loyalty_points (RLS dahil)
022_reward_winners.sql           ← reward_tiers.max_winners + reward_winners tablosu
023_digital_card_and_surveys.sql ← exhibitors: contact_name, job_title, linkedin_url + exhibitor_surveys, survey_questions, survey_responses
```

---

## Çevre Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Publishable key (sb_publishable_...)
SUPABASE_SERVICE_ROLE_KEY=       # Secret key (sb_secret_...)
OPENAI_API_KEY=                  # AI embedding için
STRIPE_SECRET_KEY=               # Stripe ödeme
STRIPE_WEBHOOK_SECRET=           # Webhook doğrulama
```

Remote Supabase: ref = `kskohdijsrurlsmxioug`, region = ap-southeast-2

**DB Doğrudan Bağlantı:**
- Port 5432 → **KAPALI** (firewall)
- Port 6543 → **AÇIK** (pooler üzerinden çalışıyor)
```bash
PGPASSWORD="..." psql "postgresql://postgres@db.kskohdijsrurlsmxioug.supabase.co:6543/postgres?sslmode=require"
```

---

## Kodlama Kuralları

### Sayfa (page.tsx) Şablonu
```tsx
// Server Component — her zaman async
import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";

export default async function XxxPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("...").select("...");

  return <XxxClient profile={profile} data={data ?? []} />;
}
```

### Server Action Şablonu
```ts
"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getProfile } from "@/lib/supabase-server";

export async function doSomething(input: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Oturum açmanız gerekiyor." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("...").insert({ ... });
  if (error) return { error: "İşlem başarısız." };

  revalidatePath("/ilgili-rota");
  return { success: true };
}
```

### Framer Motion Kuralları — KRİTİK

```tsx
// ✅ DOĞRU
<motion.div initial={{ y: 16 }} animate={{ y: 0 }}>

// ❌ YASAK — initial'da opacity: 0 (sayfa siyah görünür)
<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

// ❌ YASAK — animate'de opacity: 1 (gereksiz, Turbopack ile sorun çıkarır)
<motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
```

- `initial={{ y: 16 }}` — sadece y offset, opacity asla ekleme
- `animate={{ y: 0 }}` — sadece y sıfırla, opacity asla ekleme
- `whileInView` + `viewport={{ once: true }}` — hero dışı bölümler için

### Turbopack + "use server" Uyarısı — KRİTİK

`"use server"` direktifi olan dosyalarda **`export type { ... }`** kullanma.
Turbopack bu re-export'u server action olarak kaydeder, interface'ler runtime değeri olmadığı için `ReferenceError` verir.

```ts
// ❌ YANLIŞ — "use server" dosyasında type re-export
"use server";
import type { RewardTier } from "./actions";
export type { RewardTier };  // Turbopack bunu server action olarak görür → ReferenceError

// ✅ DOĞRU — tipleri doğrudan tanımlı olduğu dosyadan import et
import type { RewardTier } from "@/features/loyalty/actions";
```

### QR Render Kuralı (Hydration-Safe)
```tsx
// window.location.origin sadece client mount sonrası okunur
function QRDisplay({ token, size }: { token: string; size: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(`${window.location.origin}/scan/${token}`);
  }, [token]);
  if (!url) return <div style={{ width: size, height: size }} className="bg-white/10 rounded animate-pulse" />;
  return <QRCodeSVG value={url} size={size} level="M" fgColor="#1a1a2e" />;
}
```

### UI Tasarım Dili
- Zemin: `bg-brand-dark`
- Glass efekt: `glass` veya `glass-strong`
- Başlık: `font-display` (Outfit font)
- Marka renkleri: `brand-indigo`, `brand-cyan`, `brand-violet`, `brand-gold`
- Border: `border-white/8`
- Gradient buton: `<Button variant="gradient">`
- Hata rengi: `text-red-400`, `bg-red-500/10`, `border-red-500/20`

---

## Test Hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Organizatör | otest@test.com | Test1234! |
| Firma | ftest@test.com | Test1234! |
| Ziyaretçi | ztest@test.com | Test1234! |

---

## Geliştirme Ortamı

```bash
cd "bsexp2"
npm run dev        # localhost:3000
npm run build      # Production build
npm run lint       # ESLint kontrolü
npx tsc --noEmit   # TypeScript kontrol
```

---

## Dosya Değiştirme Rehberi

| Ne eklemek istiyorsun? | Nereye bak? |
|------------------------|-------------|
| Yeni organizatör sayfası | `src/app/(organizer)/organizer/[yeni]/` |
| Yeni firma özelliği | `src/app/(exhibitor)/exhibitor/[yeni]/` + `src/features/exhibitors/actions.ts` |
| Sadakat/ödül işlemi | `src/features/loyalty/actions.ts` veya `organizerActions.ts` |
| Yeni DB tablosu | `supabase/migrations/00N_açıklama.sql` (RLS ekle!) |
| Yeni server action | `src/features/[alan]/actions.ts` |
| Landing sayfası bölümü | `src/components/landing/` |
| Yeni UI bileşeni | `src/components/ui/` (Shadcn standardında) |

---

## Kapsam Dışı — Yapılmayacaklar

| ❌ Özellik | Neden Hayır |
|-----------|-------------|
| Native iOS/Android app | Responsive web + PWA yeterli, 3x geliştirme maliyeti |
| Çoklu para birimi | Sadece Türkiye pazarı, TRY yeterli |
| Google / GitHub OAuth | Email+şifre flow çalışıyor |
| Çoklu dil (i18n) | Sadece Türkçe |
| Canlı video streaming | YouTube/Vimeo embed link yeterli, %0 altyapı maliyeti |
| Gerçek zamanlı in-app chat | Meeting scheduling + bağlantı sistemi yeterli |
| Blockchain / NFT rozet | SVG rozet yeterli, gereksiz karmaşıklık |
| E-posta marketing (Mailchimp vb.) | Supabase notifications yeterli |

---

## Yol Haritası (Öncelik Sırasıyla)

### Tamamlananlar ✅
- Firma marka sayfası özelleştirme (brand_color, banner_url, sosyal medya)
- KVKK onay sistemi (kayıt + lead formlarında `kvkk_consent`)
- Fiziksel check-in QR (`fair_checkins`, kapı tarayıcı)
- Rozet & sadakat puan sistemi (migration 021)
- Ödül eşiği + "İlk X kazanan" sistemi (migration 022)
- Yaka Kartı Tasarımcısı — 9 şablon (modern, kurumsal, minimal, canlı, koyu, Geometrik I/II, Kırmızı I/II)
  - Sürükle-bırak metin + QR + logo konumlandırma
  - Logo boyutu + QR boyutu slider (30–90px)
  - Kapı geçiş QR otomatik (fuara özel URL, html2canvas ile PDF'e geçiyor)
  - WYSIWYG: önizleme = PDF çıktısı
- Stant QR tarama fix: `getBoothByQrToken` admin client kullanıyor (RLS bypass — public veri)
- Dashboard güncelleme: QR Taramaları stat, bekleyen onay banner'ı, Katılım İstekleri hızlı erişim

### Faz C — Büyüme
1. **Post-fuar AI PDF raporu** — organizatör + firma için ayrı, `@react-pdf/renderer`
2. **Ön kayıt talep analizi** — `/organizer/events/[eventId]/demand`, günlük kayıt grafiği
3. Recharts ile analytics grafik iyileştirmeleri
4. Sponsor katmanları görsel sistemi (landing'de logo sıralaması)
5. PWA manifest (offline + mobil install desteği)
