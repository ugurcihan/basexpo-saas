# BasExpo — Claude Code Kılavuzu

## Proje Nedir?

BasExpo, **fuar organizatörlerine ücretsiz** sunulan, **katılımcı firmaların** aylık ücret ödediği bir B2B2C fuar yönetim SaaS platformudur.

**Gelir modeli:**
- Organizatör: Ücretsiz — ön kayıt datası, AI raporu ve ısı haritası karşılığında platform kullanır
- Firma (Exhibitor): 13.000 TL/ay abonelik + stant aktivasyon ücreti (Stripe)
- Sponsor katmanları: Platin / Altın / Gümüş / Bronz

**Değer önerileri:**
- Organizatör → Ön kayıt datası (stant satış argümanı), fuar sonrası AI raporu, canlı ısı haritası, fuardaki ziyaretçilere hedefli bildirim
- Firma → KVKK'lı lead toplama, markalı QR sayfa, ürün vitrini, AI ROI raporu, kişiselleştirilmiş marka sayfası
- Ziyaretçi → Kişiselleştirilmiş AI eşleşme, rozet/sadakat puanı, ücretli fuarlara ücretsiz bilet, networking

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.2.9 (App Router, Server Components) |
| Dil | TypeScript 5 |
| UI | Tailwind CSS 3 + Shadcn/ui + Framer Motion 11 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI text-embedding-3-small (1536 dim, pgvector) |
| Ödeme | Stripe (TRY, booth activation fee) |
| QR | qrcode.react — hydration-safe `QRDisplay` componenti kullan |

---

## Klasör Yapısı

```
src/
├── app/
│   ├── (auth)/                    # /login, /register
│   ├── (visitor)/visitor/         # Ziyaretçi paneli (/visitor/**)
│   ├── (exhibitor)/exhibitor/     # Firma paneli (/exhibitor/**)
│   ├── (organizer)/organizer/     # Organizatör paneli (/organizer/**)
│   ├── scan/[token]/              # Public: firma QR → lead oluşturur
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
| badge_definitions | Rozet tanımları | name, icon, condition_type, condition_value |
| visitor_badges | Kazanılan rozetler | visitor_id, badge_id, earned_at |
| loyalty_points | Sadakat puanı logu | visitor_id, event_id, points, reason |

**RLS Kuralı:** Her tablo RLS aktif olmalı. Policy adı şablonu: `"tablename: açıklama"`  
Yeni tablo eklenince mutlaka RLS politikaları yazılmalı.

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
010_badges_and_loyalty.sql       ← rozet + sadakat sistemi
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

### Framer Motion Kuralları
- `containerVariants.hidden: {}` — **ASLA `opacity: 0` koyma** (sayfayı karanlık yapar)
- `itemVariants.hidden: { y: 16 }` — sadece y offset, opacity kaldırıldı
- `whileInView` + `viewport={{ once: true }}` — hero dışı bölümler için

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
```

---

## Dosya Değiştirme Rehberi

| Ne eklemek istiyorsun? | Nereye bak? |
|------------------------|-------------|
| Yeni organizatör sayfası | `src/app/(organizer)/organizer/[yeni]/` |
| Yeni firma özelliği | `src/app/(exhibitor)/exhibitor/[yeni]/` + `src/features/exhibitors/actions.ts` |
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

### Faz A — Kritik (Gelire Direkt Etki)
1. **Firma marka sayfası özelleştirme** — brand_color, banner_url, sosyal medya linkleri, intro_video_url → migration 009
2. **KVKK onay sistemi** — kayıt ve lead formlarına zorunlu checkbox, `kvkk_consent` alanı
3. **Fiziksel check-in QR** — `fair_checkins` tablosu, `/scan/checkin/[eventId]`, bildirim filtresi

### Faz B — Önemli
4. **Rozet & sadakat puan sistemi** — badge_definitions, visitor_badges, loyalty_points → migration 010
5. **Post-fuar AI PDF raporu** — organizatör + firma için ayrı, `@react-pdf/renderer`
6. **Ön kayıt talep analizi** — `/organizer/events/[eventId]/demand`, günlük kayıt grafiği

### Faz C — Büyüme
7. Recharts ile analytics grafik iyileştirmeleri
8. Sponsor katmanları görsel sistemi (landing'de logo sıralaması)
9. PWA manifest (offline + mobil install desteği)
