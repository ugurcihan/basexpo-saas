-- ============================================================
-- BasExpo FAZ 3 — 5 Test Firması Seed
-- Supabase SQL Editor'da çalıştırın.
-- Şifre: Test1234!
-- ============================================================
-- NOT: auth.users'a Supabase yönetim paneli üzerinden erişildiği için
-- bu script auth_users tablosuna INSERT yapar.
-- Supabase Studio > Authentication > Users menüsünden manuel de eklenebilir.
-- ============================================================

DO $$
DECLARE
  -- Organizatör event'i (otest@test.com'un fuarı)
  v_event_id    uuid;

  -- Yeni user IDs
  v_turkcell_id   uuid := gen_random_uuid();
  v_arcelik_id    uuid := gen_random_uuid();
  v_logo_id       uuid := gen_random_uuid();
  v_aselsan_id    uuid := gen_random_uuid();
  v_vestel_id     uuid := gen_random_uuid();

  -- Exhibitor IDs
  v_t_ex  uuid := gen_random_uuid();
  v_a_ex  uuid := gen_random_uuid();
  v_l_ex  uuid := gen_random_uuid();
  v_as_ex uuid := gen_random_uuid();
  v_v_ex  uuid := gen_random_uuid();

  -- Visitor (ztest@test.com) ID
  v_visitor_id uuid;

  -- Booth IDs (ilk uygun boş standlar)
  v_booth_1 uuid;
  v_booth_2 uuid;
  v_booth_3 uuid;
  v_booth_4 uuid;
  v_booth_5 uuid;

BEGIN
  -- En son aktif/yayınlanan fuarı bul (otest@test.com'un fuarı)
  SELECT e.id INTO v_event_id
  FROM public.events e
  JOIN public.profiles p ON p.id = e.organizer_id
  WHERE p.email = 'otest@test.com'
  ORDER BY e.created_at DESC
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'otest@test.com kullanıcısının fuarı bulunamadı. Önce otest@test.com ile giriş yapıp fuar oluşturun.';
  END IF;

  -- Ziyaretçi ID
  SELECT id INTO v_visitor_id
  FROM public.profiles
  WHERE email = 'ztest@test.com'
  LIMIT 1;

  -- Boş booth'lar (exhibitor_id = NULL)
  SELECT id INTO v_booth_1 FROM public.booths
  WHERE exhibitor_id IS NULL
  AND hall_id IN (SELECT id FROM public.halls WHERE event_id = v_event_id)
  LIMIT 1 OFFSET 0;

  SELECT id INTO v_booth_2 FROM public.booths
  WHERE exhibitor_id IS NULL
  AND hall_id IN (SELECT id FROM public.halls WHERE event_id = v_event_id)
  LIMIT 1 OFFSET 1;

  SELECT id INTO v_booth_3 FROM public.booths
  WHERE exhibitor_id IS NULL
  AND hall_id IN (SELECT id FROM public.halls WHERE event_id = v_event_id)
  LIMIT 1 OFFSET 2;

  SELECT id INTO v_booth_4 FROM public.booths
  WHERE exhibitor_id IS NULL
  AND hall_id IN (SELECT id FROM public.halls WHERE event_id = v_event_id)
  LIMIT 1 OFFSET 3;

  SELECT id INTO v_booth_5 FROM public.booths
  WHERE exhibitor_id IS NULL
  AND hall_id IN (SELECT id FROM public.halls WHERE event_id = v_event_id)
  LIMIT 1 OFFSET 4;

  -- ── 1. TURKCELL ──────────────────────────────────────────
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_turkcell_id,
    'turkcell@test.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Turkcell Kurumsal"}',
    now(), now()
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (v_turkcell_id, 'turkcell@test.com', 'Turkcell Kurumsal', 'exhibitor', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.exhibitors (
    id, owner_id, company_name, description, tags, event_id,
    qr_token, website, phone, industry, company_size, created_at
  ) VALUES (
    v_t_ex, v_turkcell_id,
    'Turkcell',
    '5G, IoT ve siber güvenlik çözümleriyle Türkiye''nin dijital dönüşümüne liderlik eden teknoloji şirketi.',
    ARRAY['5G','IoT','Siber Güvenlik','Bulut','Telekomünikasyon'],
    v_event_id,
    encode(gen_random_bytes(16), 'hex'),
    'https://www.turkcell.com.tr',
    '+90 212 313 1000',
    'Telekomünikasyon',
    '10000+',
    now()
  ) ON CONFLICT DO NOTHING;

  IF v_booth_1 IS NOT NULL THEN
    UPDATE public.booths SET exhibitor_id = v_turkcell_id WHERE id = v_booth_1;
  END IF;

  INSERT INTO public.products (id, exhibitor_id, name, description, created_at) VALUES
    (gen_random_uuid(), v_t_ex, '5G Kurumsal Çözümler', 'Yüksek hızlı 5G altyapısı ile kurumsal iletişim', now()),
    (gen_random_uuid(), v_t_ex, 'BiP Kurumsal Mesajlaşma', 'Güvenli kurumsal mesajlaşma platformu', now()),
    (gen_random_uuid(), v_t_ex, 'IoT Platformu', 'Nesnelerin interneti yönetim ve analiz platformu', now());

  -- ── 2. ARÇELİK ───────────────────────────────────────────
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_arcelik_id,
    'arcelik@test.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Arçelik A.Ş."}',
    now(), now()
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (v_arcelik_id, 'arcelik@test.com', 'Arçelik A.Ş.', 'exhibitor', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.exhibitors (
    id, owner_id, company_name, description, tags, event_id,
    qr_token, website, phone, industry, company_size, created_at
  ) VALUES (
    v_a_ex, v_arcelik_id,
    'Arçelik',
    'Akıllı ev teknolojileri ve enerji tasarruflu beyaz eşya çözümleriyle geleceğin evini inşa ediyoruz.',
    ARRAY['Akıllı Ev','Enerji Tasarrufu','AI','Beyaz Eşya','Sürdürülebilirlik'],
    v_event_id,
    encode(gen_random_bytes(16), 'hex'),
    'https://www.arcelik.com.tr',
    '+90 212 314 3434',
    'Beyaz Eşya & Teknoloji',
    '10000+',
    now()
  ) ON CONFLICT DO NOTHING;

  IF v_booth_2 IS NOT NULL THEN
    UPDATE public.booths SET exhibitor_id = v_arcelik_id WHERE id = v_booth_2;
  END IF;

  INSERT INTO public.products (id, exhibitor_id, name, description, created_at) VALUES
    (gen_random_uuid(), v_a_ex, 'Çevre Dostu Çamaşır Makinesi', 'A+++ enerji sınıfı, yapay zeka ile program seçimi', now()),
    (gen_random_uuid(), v_a_ex, 'Akıllı Buzdolabı', 'HomeWhiz ile uzaktan kontrol, enerji optimizasyonu', now());

  -- ── 3. LOGO YAZILIM ──────────────────────────────────────
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_logo_id,
    'logo@test.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Logo Yazılım A.Ş."}',
    now(), now()
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (v_logo_id, 'logo@test.com', 'Logo Yazılım A.Ş.', 'exhibitor', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.exhibitors (
    id, owner_id, company_name, description, tags, event_id,
    qr_token, website, phone, industry, company_size, created_at
  ) VALUES (
    v_l_ex, v_logo_id,
    'Logo Yazılım',
    'KOBİ''lerden büyük işletmelere ERP, CRM ve bulut tabanlı iş yönetimi çözümleri.',
    ARRAY['ERP','CRM','Bulut Yazılım','KOBİ','İş Yönetimi'],
    v_event_id,
    encode(gen_random_bytes(16), 'hex'),
    'https://www.logo.com.tr',
    '+90 262 677 7000',
    'Kurumsal Yazılım',
    '1000-5000',
    now()
  ) ON CONFLICT DO NOTHING;

  IF v_booth_3 IS NOT NULL THEN
    UPDATE public.booths SET exhibitor_id = v_logo_id WHERE id = v_booth_3;
  END IF;

  INSERT INTO public.products (id, exhibitor_id, name, description, created_at) VALUES
    (gen_random_uuid(), v_l_ex, 'Logo Tiger3', 'KOBİ''ler için kapsamlı ERP çözümü', now()),
    (gen_random_uuid(), v_l_ex, 'Logo CRM', 'Müşteri ilişkileri yönetimi ve satış otomasyonu', now()),
    (gen_random_uuid(), v_l_ex, 'Logo Cloud HR', 'Bulut tabanlı insan kaynakları yönetimi', now());

  -- ── 4. ASELSAN ───────────────────────────────────────────
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_aselsan_id,
    'aselsan@test.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Aselsan A.Ş."}',
    now(), now()
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (v_aselsan_id, 'aselsan@test.com', 'Aselsan A.Ş.', 'exhibitor', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.exhibitors (
    id, owner_id, company_name, description, tags, event_id,
    qr_token, website, phone, industry, company_size, created_at
  ) VALUES (
    v_as_ex, v_aselsan_id,
    'Aselsan',
    'Savunma, haberleşme ve elektronik sistemler alanında dünya standartlarında çözümler üreten Türk savunma sanayii devi.',
    ARRAY['Savunma','Elektronik','Radar','Haberleşme','IDEF'],
    v_event_id,
    encode(gen_random_bytes(16), 'hex'),
    'https://www.aselsan.com.tr',
    '+90 312 592 1000',
    'Savunma & Teknoloji',
    '5000-10000',
    now()
  ) ON CONFLICT DO NOTHING;

  IF v_booth_4 IS NOT NULL THEN
    UPDATE public.booths SET exhibitor_id = v_aselsan_id WHERE id = v_booth_4;
  END IF;

  INSERT INTO public.products (id, exhibitor_id, name, description, created_at) VALUES
    (gen_random_uuid(), v_as_ex, 'HAVELSAN Askeri Radar', 'Hava savunma sistemleri için gelişmiş radar teknolojisi', now()),
    (gen_random_uuid(), v_as_ex, 'Güvenli Haberleşme Sistemi', 'Şifreli ve kesintisiz askeri haberleşme altyapısı', now());

  -- ── 5. VESTEL ────────────────────────────────────────────
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_vestel_id,
    'vestel@test.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vestel Elektronik A.Ş."}',
    now(), now()
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (v_vestel_id, 'vestel@test.com', 'Vestel Elektronik A.Ş.', 'exhibitor', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.exhibitors (
    id, owner_id, company_name, description, tags, event_id,
    qr_token, website, phone, industry, company_size, created_at
  ) VALUES (
    v_v_ex, v_vestel_id,
    'Vestel',
    'Tüketici elektroniği, EV şarj istasyonları ve akıllı ev ekosistemiyle Türkiye''nin teknoloji lideri.',
    ARRAY['TV','Akıllı Ev','Şarj İstasyonu','EV','Tüketici Elektroniği'],
    v_event_id,
    encode(gen_random_bytes(16), 'hex'),
    'https://www.vestel.com.tr',
    '+90 212 204 8000',
    'Tüketici Elektroniği',
    '10000+',
    now()
  ) ON CONFLICT DO NOTHING;

  IF v_booth_5 IS NOT NULL THEN
    UPDATE public.booths SET exhibitor_id = v_vestel_id WHERE id = v_booth_5;
  END IF;

  INSERT INTO public.products (id, exhibitor_id, name, description, created_at) VALUES
    (gen_random_uuid(), v_v_ex, 'Vestel 8K QLED TV', '85 inç, Yapay Zeka destekli görüntü işleme', now()),
    (gen_random_uuid(), v_v_ex, 'EV Şarj İstasyonu', '22kW AC hızlı şarj, akıllı enerji yönetimi', now()),
    (gen_random_uuid(), v_v_ex, 'Venus Akıllı Ekran', 'Kurumsal dijital tabela ve interaktif ekran', now());

  -- ── LEAD & QR DATA (ztest@test.com ziyaretçisinden) ─────
  IF v_visitor_id IS NOT NULL THEN
    -- Leadler (Turkcell + Arçelik)
    INSERT INTO public.leads (id, exhibitor_id, visitor_id, source, score, notes, created_at)
    VALUES
      (gen_random_uuid(), v_t_ex, v_visitor_id, 'qr', 85, '5G çözümleri hakkında bilgi istedi', now() - interval '2 days'),
      (gen_random_uuid(), v_a_ex, v_visitor_id, 'qr', 72, 'Akıllı ev sistemleri demo talebi', now() - interval '1 day'),
      (gen_random_uuid(), v_l_ex, v_visitor_id, 'manual', 60, 'ERP entegrasyonu görüşmek istiyor', now() - interval '3 hours'),
      (gen_random_uuid(), v_v_ex, v_visitor_id, 'qr', 68, 'EV şarj istasyonu fiyat talebi', now() - interval '5 hours')
    ON CONFLICT DO NOTHING;

    -- QR Scan logu (ısı haritası verisi)
    INSERT INTO public.qr_scans (id, exhibitor_id, visitor_id, event_id, created_at)
    VALUES
      (gen_random_uuid(), v_t_ex, v_visitor_id, v_event_id, now() - interval '2 days'),
      (gen_random_uuid(), v_t_ex, v_visitor_id, v_event_id, now() - interval '1 day 5 hours'),
      (gen_random_uuid(), v_a_ex, v_visitor_id, v_event_id, now() - interval '1 day'),
      (gen_random_uuid(), v_l_ex, v_visitor_id, v_event_id, now() - interval '6 hours'),
      (gen_random_uuid(), v_v_ex, v_visitor_id, v_event_id, now() - interval '4 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Seed tamamlandı! Event ID: %, 5 firma eklendi.', v_event_id;
END $$;
