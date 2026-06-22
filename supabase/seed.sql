-- ============================================================
-- BasExpo — Test Seed Data (Genişletilmiş)
-- Çalıştır: Supabase Dashboard → SQL Editor → Bu dosyayı yapıştır
-- ============================================================
-- Şifreler: 123456
-- otest@test.com  → organizatör
-- ftest@test.com  → katılımcı firma (TechVision A.Ş.)
-- f2test@test.com → katılımcı firma (InnovateTech A.Ş.)
-- f3test@test.com → katılımcı firma (GreenEnergy Ltd.)
-- f4test@test.com → katılımcı firma (MedTech Çözümleri)
-- f5test@test.com → katılımcı firma (SmartCity Systems)
-- ztest@test.com  → ziyaretçi 1
-- z2test@test.com → ziyaretçi 2
-- ============================================================

-- Sabit UUID'ler
-- Organizer  : 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- Exhibitor1 : 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  (ftest)
-- Exhibitor2 : 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  (f2test — bb22)
-- Exhibitor3 : 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  (f3test — bb33)
-- Exhibitor4 : 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  (f4test — bb44)
-- Exhibitor5 : 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  (f5test — bb55)
-- Visitor1   : 'cccccccc-cccc-cccc-cccc-cccccccccccc'  (ztest)
-- Visitor2   : 'cccccccc-cccc-cccc-cccc-cccccccccc22'  (z2test)

-- ─── 1. Auth users ────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  is_sso_user, deleted_at
)
VALUES
-- Organizer
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'otest@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"organizer"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Exhibitor 1 — TechVision
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'ftest@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"exhibitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Exhibitor 2 — InnovateTech
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'f2test@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"exhibitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Exhibitor 3 — GreenEnergy
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'f3test@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"exhibitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Exhibitor 4 — MedTech
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'f4test@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"exhibitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Exhibitor 5 — SmartCity
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb55',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'f5test@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"exhibitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Visitor 1
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'ztest@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"visitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
),
-- Visitor 2
(
  'cccccccc-cccc-cccc-cccc-cccccccccc22',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'z2test@test.com', crypt('123456', gen_salt('bf', 10)), now(),
  '{"role":"visitor"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', '', false, null
)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Auth identities ───────────────────────────────────────
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
)
VALUES
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'otest@test.com',   'email', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"otest@test.com"}'::jsonb,   now(), now(), now()),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ftest@test.com',   'email', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"ftest@test.com"}'::jsonb,   now(), now(), now()),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', 'f2test@test.com',  'email', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22","email":"f2test@test.com"}'::jsonb,  now(), now(), now()),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33', 'f3test@test.com',  'email', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33","email":"f3test@test.com"}'::jsonb,  now(), now(), now()),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44', 'f4test@test.com',  'email', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44","email":"f4test@test.com"}'::jsonb,  now(), now(), now()),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb55', 'f5test@test.com',  'email', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb55","email":"f5test@test.com"}'::jsonb,  now(), now(), now()),
(gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ztest@test.com',   'email', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","email":"ztest@test.com"}'::jsonb,   now(), now(), now()),
(gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'z2test@test.com',  'email', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccc22","email":"z2test@test.com"}'::jsonb,  now(), now(), now())
ON CONFLICT DO NOTHING;

-- ─── 3. Profiles ─────────────────────────────────────────────
INSERT INTO public.profiles (id, role, full_name, email, interests)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'organizer', 'Organizatör Test',      'otest@test.com',  '{}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'exhibitor', 'TechVision Yöneticisi', 'ftest@test.com',  '{}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', 'exhibitor', 'InnovateTech Yöneticisi','f2test@test.com', '{}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33', 'exhibitor', 'GreenEnergy Yöneticisi', 'f3test@test.com', '{}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44', 'exhibitor', 'MedTech Yöneticisi',    'f4test@test.com', '{}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb55', 'exhibitor', 'SmartCity Yöneticisi',  'f5test@test.com', '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'visitor',   'Ziyaretçi Test',         'ztest@test.com',  ARRAY['yapay-zeka','robotik','endüstri-4.0','enerji','medikal']),
  ('cccccccc-cccc-cccc-cccc-cccccccccc22', 'visitor',   'Demo Ziyaretçi 2',       'z2test@test.com', ARRAY['yazılım','bulut','medikal','biyoteknoloji'])
ON CONFLICT (id) DO UPDATE SET
  role      = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  email     = EXCLUDED.email,
  interests = EXCLUDED.interests;

-- ─── 4. Demo Event ────────────────────────────────────────────
INSERT INTO public.events (id, organizer_id, name, description, start_date, end_date, location, status, capacity, gallery_urls)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'BasExpo Demo 2025',
  'Türkiye''nin en büyük teknoloji ve endüstri fuarı. Yapay zeka, robotik, enerji ve medikal sektörlerden 200+ firma bir araya geliyor. Networking, ürün lansmanları ve sektör panelleriyle dolu 4 günlük etkinlik.',
  '2025-09-15', '2025-09-18',
  'İstanbul Kongre ve Sergi Sarayı',
  'published',
  5000,
  ARRAY[
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  description  = EXCLUDED.description,
  capacity     = EXCLUDED.capacity,
  gallery_urls = EXCLUDED.gallery_urls;

-- ─── 5. Halls ─────────────────────────────────────────────────
INSERT INTO public.halls (id, event_id, name, floor)
VALUES
  ('eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'A Salonu — Teknoloji', 1),
  ('eeeeeeee-0002-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'B Salonu — Endüstri',  2)
ON CONFLICT (id) DO NOTHING;

-- ─── 6. Booths ────────────────────────────────────────────────
INSERT INTO public.booths (id, hall_id, code)
VALUES
  ('ffff0001-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'A01'),
  ('ffff0002-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'A02'),
  ('ffff0003-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'A03'),
  ('ffff0004-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'A04'),
  ('ffff0005-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'A05'),
  ('ffff0006-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0002-eeee-eeee-eeeeeeeeeeee', 'B01'),
  ('ffff0007-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0002-eeee-eeee-eeeeeeeeeeee', 'B02'),
  ('ffff0008-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-0002-eeee-eeee-eeeeeeeeeeee', 'B03')
ON CONFLICT (id) DO NOTHING;

-- ─── 7. Exhibitors (5 firma) ─────────────────────────────────
INSERT INTO public.exhibitors (id, event_id, owner_id, company_name, description, tags, qr_token)
VALUES
(
  '11111111-2222-3333-4444-555555555555',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'TechVision A.Ş.',
  'Yapay zeka destekli endüstriyel otomasyon ve robotik çözümleri. Üretim hatlarını akıllı sensörler ve makine öğrenmesiyle optimize ediyoruz.',
  ARRAY['yapay-zeka','robotik','endüstri-4.0','otomasyon','sensör'],
  'demo-qr-techvision-2025'
),
(
  '22222222-2222-3333-4444-555555555555',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22',
  'InnovateTech A.Ş.',
  'Kurumsal yazılım, bulut altyapısı ve siber güvenlik çözümleri sunan teknoloji şirketi. 500+ enterprise müşteri.',
  ARRAY['yazılım','bulut','siber-güvenlik','kurumsal','saas'],
  'demo-qr-innovatetech-2025'
),
(
  '33333333-2222-3333-4444-555555555555',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33',
  'GreenEnergy Ltd.',
  'Yenilenebilir enerji sistemleri ve güneş paneli entegrasyon çözümleri. Net-zero hedeflerinize ulaşmanızı sağlıyoruz.',
  ARRAY['yenilenebilir','güneş','enerji-depolama','net-zero','çevre'],
  'demo-qr-greenenergy-2025'
),
(
  '44444444-2222-3333-4444-555555555555',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44',
  'MedTech Çözümleri',
  'Dijital sağlık, biyoteknoloji ve ilaç sektörü için yenilikçi teknoloji çözümleri geliştiriyoruz.',
  ARRAY['medikal','biyoteknoloji','ilaç','dijital-sağlık','ai-tıp'],
  'demo-qr-medtech-2025'
),
(
  '55555555-2222-3333-4444-555555555555',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb55',
  'SmartCity Systems',
  'Akıllı şehir altyapısı, IoT sensör ağları ve kentsel veri analitiği platformları.',
  ARRAY['akıllı-şehir','iot','altyapı','kentsel','veri'],
  'demo-qr-smartcity-2025'
)
ON CONFLICT (id) DO NOTHING;

-- ─── 8. Booth Atamaları ───────────────────────────────────────
UPDATE public.booths SET exhibitor_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  WHERE id = 'ffff0001-ffff-ffff-ffff-ffffffffffff';

UPDATE public.booths SET exhibitor_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22'
  WHERE id = 'ffff0006-ffff-ffff-ffff-ffffffffffff';

UPDATE public.booths SET exhibitor_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33'
  WHERE id = 'ffff0007-ffff-ffff-ffff-ffffffffffff';

UPDATE public.booths SET exhibitor_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44'
  WHERE id = 'ffff0003-ffff-ffff-ffff-ffffffffffff';

UPDATE public.booths SET exhibitor_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb55'
  WHERE id = 'ffff0004-ffff-ffff-ffff-ffffffffffff';

-- ─── 9. Products ──────────────────────────────────────────────
-- TechVision
INSERT INTO public.products (id, exhibitor_id, name, description) VALUES
  ('prod0001-0000-0000-0000-000000000000', '11111111-2222-3333-4444-555555555555', 'SmartLine Üretim Optimizatörü', 'ML tabanlı üretim hattı analitiği. Arıza tahminleme ve OEE artışı.'),
  ('prod0002-0000-0000-0000-000000000000', '11111111-2222-3333-4444-555555555555', 'RoboArm Pro 7-Eksen', 'Endüstriyel 7-eksenli kolaboratif robot. ISO 10218 sertifikalı.'),
  ('prod0003-0000-0000-0000-000000000000', '11111111-2222-3333-4444-555555555555', 'VisionSense Kalite Kontrolü', 'Kamera + AI ile %99.8 hata tespiti. Gerçek zamanlı montaj doğrulama.')
ON CONFLICT (id) DO NOTHING;

-- InnovateTech
INSERT INTO public.products (id, exhibitor_id, name, description) VALUES
  ('prod0004-0000-0000-0000-000000000000', '22222222-2222-3333-4444-555555555555', 'CloudShield Siber Güvenlik', 'Zero-trust mimarisinde bulut güvenlik platformu. SOC 2 Type II sertifikalı.'),
  ('prod0005-0000-0000-0000-000000000000', '22222222-2222-3333-4444-555555555555', 'InnoSuite ERP', 'Yapay zeka destekli kurumsal kaynak planlama sistemi. 50+ modül.')
ON CONFLICT (id) DO NOTHING;

-- GreenEnergy
INSERT INTO public.products (id, exhibitor_id, name, description) VALUES
  ('prod0006-0000-0000-0000-000000000000', '33333333-2222-3333-4444-555555555555', 'SolarMax 600W Panel', 'Monokristal güneş paneli, %22.4 verimlilik, 25 yıl garanti.'),
  ('prod0007-0000-0000-0000-000000000000', '33333333-2222-3333-4444-555555555555', 'EnerStore 100kWh Batarya', 'Endüstriyel enerji depolama sistemi. Lityum demir fosfat teknolojisi.')
ON CONFLICT (id) DO NOTHING;

-- MedTech
INSERT INTO public.products (id, exhibitor_id, name, description) VALUES
  ('prod0008-0000-0000-0000-000000000000', '44444444-2222-3333-4444-555555555555', 'DiagnostiAI Görüntüleme', 'Radyoloji görüntülerinde yapay zeka ile erken teşhis sistemi.'),
  ('prod0009-0000-0000-0000-000000000000', '44444444-2222-3333-4444-555555555555', 'PharmTrack İlaç Takip', 'Blockchain tabanlı ilaç tedarik zinciri izleme ve doğrulama platformu.')
ON CONFLICT (id) DO NOTHING;

-- SmartCity
INSERT INTO public.products (id, exhibitor_id, name, description) VALUES
  ('prod0010-0000-0000-0000-000000000000', '55555555-2222-3333-4444-555555555555', 'CityPulse IoT Ağı', '5G destekli şehir sensör ağı yönetim platformu. 10.000+ cihaz kapasitesi.'),
  ('prod0011-0000-0000-0000-000000000000', '55555555-2222-3333-4444-555555555555', 'TrafficAI Trafik Yönetimi', 'Adaptif trafik sinyalizasyon sistemi. %40 akış iyileştirmesi.')
ON CONFLICT (id) DO NOTHING;

-- ─── 10. Leads (QR Scans) ────────────────────────────────────
INSERT INTO public.leads (exhibitor_id, visitor_id, source, score) VALUES
  ('11111111-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'qr', 85),
  ('22222222-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'qr', 70),
  ('44444444-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'qr', 60),
  ('11111111-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'qr', 75),
  ('33333333-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'qr', 50)
ON CONFLICT (exhibitor_id, visitor_id) DO NOTHING;

-- ─── 11. Event Registrations ─────────────────────────────────
INSERT INTO public.event_registrations (event_id, visitor_id, status, ticket_code) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'confirmed', 'DEMO2025TX'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'confirmed', 'DEMO2025V2')
ON CONFLICT (event_id, visitor_id) DO NOTHING;

-- ─── 12. Sponsors (Piramit) ──────────────────────────────────
INSERT INTO public.event_sponsors (event_id, exhibitor_id, tier, tier_name) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-2222-3333-4444-555555555555', 1, 'Platin Sponsor'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-3333-4444-555555555555', 2, 'Altın Sponsor'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-2222-3333-4444-555555555555', 3, 'Gümüş Sponsor')
ON CONFLICT (event_id, exhibitor_id) DO NOTHING;

-- ─── 13. QR Scans (Isı Haritası Demo Verisi) ─────────────────
-- A01 standı — TechVision (en yoğun: 7 tarama)
INSERT INTO public.qr_scans (exhibitor_id, booth_id, visitor_id, event_id, scanned_at) VALUES
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '3 hours'),
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '2 hours 30 minutes'),
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '2 hours'),
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '1 hour 45 minutes'),
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '1 hour'),
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '30 minutes'),
  ('11111111-2222-3333-4444-555555555555', 'ffff0001-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '10 minutes');

-- B01 standı — InnovateTech (orta yoğunluk: 4 tarama)
INSERT INTO public.qr_scans (exhibitor_id, booth_id, visitor_id, event_id, scanned_at) VALUES
  ('22222222-2222-3333-4444-555555555555', 'ffff0006-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '4 hours'),
  ('22222222-2222-3333-4444-555555555555', 'ffff0006-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '3 hours 20 minutes'),
  ('22222222-2222-3333-4444-555555555555', 'ffff0006-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '2 hours 10 minutes'),
  ('22222222-2222-3333-4444-555555555555', 'ffff0006-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '45 minutes');

-- A03 standı — MedTech (düşük: 2 tarama)
INSERT INTO public.qr_scans (exhibitor_id, booth_id, visitor_id, event_id, scanned_at) VALUES
  ('44444444-2222-3333-4444-555555555555', 'ffff0003-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '5 hours'),
  ('44444444-2222-3333-4444-555555555555', 'ffff0003-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '1 hour 30 minutes');

-- B02 standı — GreenEnergy (orta: 3 tarama)
INSERT INTO public.qr_scans (exhibitor_id, booth_id, visitor_id, event_id, scanned_at) VALUES
  ('33333333-2222-3333-4444-555555555555', 'ffff0007-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccc22', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '3 hours 40 minutes'),
  ('33333333-2222-3333-4444-555555555555', 'ffff0007-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '2 hours 50 minutes'),
  ('33333333-2222-3333-4444-555555555555', 'ffff0007-ffff-ffff-ffff-ffffffffffff', null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '55 minutes');

-- ─── 14. Demo Bildirimler ────────────────────────────────────
INSERT INTO public.notifications (recipient_id, sender_id, event_id, type, title, body) VALUES
  -- Tüm firmalara
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'announcement',
   'A Salonunda CEO Konuşması — Saat 15:00',
   'Bugün saat 15:00''da TechVision standında (A01) CEO Ahmet Yılmaz tarafından Endüstri 4.0 ve Yapay Zeka konuşması yapılacaktır. Katılımınızı bekliyoruz!'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'announcement',
   'A Salonunda CEO Konuşması — Saat 15:00',
   'Bugün saat 15:00''da TechVision standında (A01) CEO Ahmet Yılmaz tarafından Endüstri 4.0 ve Yapay Zeka konuşması yapılacaktır. Katılımınızı bekliyoruz!'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'reminder',
   'Yarın Fuar Sona Eriyor — Stand Toparlama Saatleri',
   'Yarın 18:00''den itibaren stand toplama işlemlerine başlayabilirsiniz. Lütfen güvenlik görevlisiyle iletişime geçin.'),
  -- Ziyaretçilere
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'announcement',
   'Altın QR Çekilişi Başladı! 🏅',
   'A01 standındaki Altın QR kodunu tarayın ve iPhone 16 kazanma şansı yakalayın! Çekiliş fuar kapanışında yapılacak.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc22', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'announcement',
   'Altın QR Çekilişi Başladı! 🏅',
   'A01 standındaki Altın QR kodunu tarayın ve iPhone 16 kazanma şansı yakalayın! Çekiliş fuar kapanışında yapılacak.')
ON CONFLICT DO NOTHING;

-- ─── 15. Demo Altın QR ───────────────────────────────────────
INSERT INTO public.golden_qr_codes (id, event_id, organizer_id, booth_id, token, label, prize_description, is_active, scan_limit)
VALUES (
  'gggggggg-gggg-gggg-gggg-gggggggggggg',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'ffff0001-ffff-ffff-ffff-ffffffffffff',
  'altinqr-demo-a01-basexpo2025',
  'A01 Standı — iPhone 16 Çekilişi',
  'Bu Altın QR''ı tarayan her ziyaretçi çekilişe katılır. Kazanan fuar kapanışında açıklanacak!',
  true,
  1000
)
ON CONFLICT (id) DO NOTHING;

-- ─── ÖZET ─────────────────────────────────────────────────────
-- Başarıyla yüklendi:
-- ✓ 5 firma (TechVision, InnovateTech, GreenEnergy, MedTech, SmartCity)
-- ✓ 2 ziyaretçi (ztest, z2test)
-- ✓ 1 fuar: BasExpo Demo 2025 (yayında, 5000 kişilik)
-- ✓ 2 salon (A Teknoloji, B Endüstri) + 8 stand
-- ✓ 5 firma booth ataması
-- ✓ 11 ürün
-- ✓ 5 lead kaydı
-- ✓ 3 sponsor (Platin, Altın, Gümüş)
-- ✓ 16 QR scan (heatmap demo verisi)
-- ✓ 5 bildirim
-- ✓ 1 Altın QR kodu
-- ✓ 2 ziyaretçi kaydı (bilet)
--
-- Test URL'leri:
-- /scan/demo-qr-techvision-2025      → TechVision
-- /scan/demo-qr-innovatetech-2025    → InnovateTech
-- /golden-scan/altinqr-demo-a01-basexpo2025 → Altın QR
-- ─────────────────────────────────────────────────────────────
