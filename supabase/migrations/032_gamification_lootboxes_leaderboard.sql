-- ============================================================
-- 032: Loot Box Sistemi + Provably Fair + Leaderboard
-- Mevcut loyalty_points + reward_tiers tablolarının üstüne inşa edilir.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- A. LOOT ÖDÜL HAVUZU
--    Organizatör fuara fiziksel ödüller tanımlar (akıllı saat, vs.)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loot_rewards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier          text NOT NULL CHECK (tier IN ('common','rare','epic','legendary')),
  name          text NOT NULL,
  description   text,
  image_url     text,
  total_stock   int,                        -- null = sınırsız
  claimed_count int NOT NULL DEFAULT 0,
  weight        int NOT NULL DEFAULT 100,   -- göreli ağırlık (aynı tier içinde)
  is_active     bool NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loot_rewards_event_tier
  ON public.loot_rewards(event_id, tier) WHERE is_active = true;

-- ────────────────────────────────────────────────────────────
-- B. KUTU TİPLERİ
--    Her fuar için 3 kutu tipi: common / rare / epic
--    points_required: bu kutuyu kazanmak için gereken puan eşiği
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loot_box_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name             text NOT NULL,              -- "Yaygın Kutu", "Nadir Kutu"
  tier             text NOT NULL CHECK (tier IN ('common','rare','epic')),
  points_required  int  NOT NULL,
  -- Tier olasılıkları (server-side kullanılır, client bilmez)
  prob_common      int NOT NULL DEFAULT 6000,  -- 6000/10000 = %60
  prob_rare        int NOT NULL DEFAULT 2500,
  prob_epic        int NOT NULL DEFAULT 1200,
  prob_legendary   int NOT NULL DEFAULT 300,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(event_id, tier)
);

-- ────────────────────────────────────────────────────────────
-- C. KUTU ENVANTERİ (kazanılmış ama açılmamış kutular)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_loot_boxes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id      uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  box_type_id   uuid NOT NULL REFERENCES public.loot_box_types(id),
  earned_at     timestamptz DEFAULT now(),
  opened_at     timestamptz,               -- null = henüz açılmamış
  reward_id     uuid REFERENCES public.loot_rewards(id)
);

CREATE INDEX IF NOT EXISTS idx_user_boxes_user_event
  ON public.user_loot_boxes(user_id, event_id) WHERE opened_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- D. PİTY SAYAÇLARI (kullanıcı başına, fuar başına)
--    since_rare/epic/legendary: son büyük ödülden bu yana açılan kutu sayısı
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_pity_counters (
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id         uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  since_rare       int NOT NULL DEFAULT 0,
  since_epic       int NOT NULL DEFAULT 0,
  since_legendary  int NOT NULL DEFAULT 0,
  total_opens      int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, event_id)
);

-- ────────────────────────────────────────────────────────────
-- E. KUTU AÇILIŞ LOGU (Provably Fair kanıtı)
--    seed_hash: açılmadan önce açıklanan SHA-256(server_seed)
--    result_hash: SHA-256(server_seed:event_id:user_id:nonce)
--    Fuar bittikten sonra server_seed açıklanır → herkes verify edebilir
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.box_opening_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id       uuid NOT NULL REFERENCES public.user_loot_boxes(id),
  user_id      uuid NOT NULL REFERENCES public.profiles(id),
  event_id     uuid NOT NULL REFERENCES public.events(id),
  nonce        int  NOT NULL,
  seed_hash    text NOT NULL,
  result_hash  text NOT NULL,
  result_tier  text NOT NULL,
  reward_id    uuid REFERENCES public.loot_rewards(id),
  pity_applied bool NOT NULL DEFAULT false,
  opened_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_box_log_user ON public.box_opening_log(user_id, event_id);

-- ────────────────────────────────────────────────────────────
-- F. EVENT SERVER SEEDS (yalnızca service_role okuyabilir)
--    Her fuar için bir gizli tohum — fuar bitince reveal edilir.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_server_seeds (
  event_id    uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  seed        text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  seed_hash   text NOT NULL DEFAULT '',  -- SHA256(seed), client'a önceden gösterilir
  revealed_at timestamptz,               -- null = henüz açıklanmadı
  created_at  timestamptz DEFAULT now()
);

-- seed_hash'i otomatik doldur
CREATE OR REPLACE FUNCTION public.fill_seed_hash()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.seed_hash := encode(digest(NEW.seed, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_seed_hash ON public.event_server_seeds;
CREATE TRIGGER trg_fill_seed_hash
  BEFORE INSERT OR UPDATE OF seed ON public.event_server_seeds
  FOR EACH ROW EXECUTE FUNCTION public.fill_seed_hash();

-- Yeni event oluşunca otomatik seed oluştur
CREATE OR REPLACE FUNCTION public.create_event_seed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.event_server_seeds (event_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_event_seed ON public.events;
CREATE TRIGGER trg_create_event_seed
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.create_event_seed();

-- ────────────────────────────────────────────────────────────
-- G. YAŞAM BOYU PUAN (tüm fuarlar toplamı)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_lifetime_scores (
  user_id       uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points  int NOT NULL DEFAULT 0,
  total_boxes   int NOT NULL DEFAULT 0,
  country_code  text,   -- 'TR', 'DE', 'US' ...
  city          text,
  updated_at    timestamptz DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- H. LİDERLİK TABLOSU SNAPSHOT (fuar bittikten sonra)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES public.events(id),
  user_id      uuid NOT NULL REFERENCES public.profiles(id),
  rank         int  NOT NULL,
  points       int  NOT NULL,
  snapshot_at  timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lb_snapshot_event
  ON public.leaderboard_snapshots(event_id, rank);

-- ────────────────────────────────────────────────────────────
-- I. KUTU EŞİK MİLESTONE (her eşik bir kez kazanılır)
--    Aynı kutuyu iki kez vermeyi önler.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_box_milestones (
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id     uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  box_type_id  uuid NOT NULL REFERENCES public.loot_box_types(id),
  awarded_at   timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, event_id, box_type_id)
);

-- ────────────────────────────────────────────────────────────
-- J. TRIGGER: Puan girince kutu eşiklerini kontrol et
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_box_milestones()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total      int;
  v_box        record;
BEGIN
  -- Bu fuardaki toplam puan
  SELECT COALESCE(SUM(points), 0) INTO v_total
  FROM public.loyalty_points
  WHERE visitor_id = NEW.visitor_id AND event_id = NEW.event_id;

  -- Henüz verilmemiş, eşiği geçilmiş kutular
  FOR v_box IN
    SELECT lbt.*
    FROM public.loot_box_types lbt
    WHERE lbt.event_id = NEW.event_id
      AND lbt.points_required <= v_total
      AND NOT EXISTS (
        SELECT 1 FROM public.user_box_milestones ubm
        WHERE ubm.user_id = NEW.visitor_id
          AND ubm.event_id = NEW.event_id
          AND ubm.box_type_id = lbt.id
      )
  LOOP
    -- Milestone kaydet
    INSERT INTO public.user_box_milestones (user_id, event_id, box_type_id)
    VALUES (NEW.visitor_id, NEW.event_id, v_box.id);

    -- Envantere kutu ekle
    INSERT INTO public.user_loot_boxes (user_id, event_id, box_type_id)
    VALUES (NEW.visitor_id, NEW.event_id, v_box.id);
  END LOOP;

  -- Yaşam boyu skoru güncelle
  INSERT INTO public.user_lifetime_scores (user_id, total_points, updated_at)
  VALUES (NEW.visitor_id, v_total, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = user_lifetime_scores.total_points + NEW.points,
        updated_at   = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_box_milestones ON public.loyalty_points;
CREATE TRIGGER trg_check_box_milestones
  AFTER INSERT ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.check_box_milestones();

-- ────────────────────────────────────────────────────────────
-- K. CANLI LİDERLİK TABLOSU VIEW'leri
-- ────────────────────────────────────────────────────────────

-- Fuar bazlı anlık sıralama (active event)
CREATE OR REPLACE VIEW public.v_fair_leaderboard AS
SELECT
  lp.event_id,
  lp.visitor_id AS user_id,
  p.full_name,
  p.avatar_url,
  SUM(lp.points) AS points,
  RANK() OVER (PARTITION BY lp.event_id ORDER BY SUM(lp.points) DESC) AS rank
FROM public.loyalty_points lp
JOIN public.profiles p ON p.id = lp.visitor_id
GROUP BY lp.event_id, lp.visitor_id, p.full_name, p.avatar_url;

-- Türkiye geneli (country_code = 'TR')
CREATE OR REPLACE VIEW public.v_turkey_leaderboard AS
SELECT
  uls.user_id,
  p.full_name,
  p.avatar_url,
  uls.city,
  uls.total_points AS points,
  RANK() OVER (ORDER BY uls.total_points DESC) AS rank
FROM public.user_lifetime_scores uls
JOIN public.profiles p ON p.id = uls.user_id
WHERE uls.country_code = 'TR'
ORDER BY uls.total_points DESC;

-- Dünya geneli
CREATE OR REPLACE VIEW public.v_world_leaderboard AS
SELECT
  uls.user_id,
  p.full_name,
  p.avatar_url,
  uls.country_code,
  uls.city,
  uls.total_points AS points,
  RANK() OVER (ORDER BY uls.total_points DESC) AS rank
FROM public.user_lifetime_scores uls
JOIN public.profiles p ON p.id = uls.user_id
ORDER BY uls.total_points DESC;

-- ────────────────────────────────────────────────────────────
-- L. RLS POLİTİKALARI
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.loot_rewards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_box_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loot_boxes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pity_counters    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.box_opening_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_server_seeds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lifetime_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_box_milestones   ENABLE ROW LEVEL SECURITY;

-- loot_rewards: herkes okur; organizatör kendi fuarını yönetir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loot_rewards: public read' AND tablename = 'loot_rewards') THEN
    CREATE POLICY "loot_rewards: public read" ON public.loot_rewards FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loot_rewards: organizer manage' AND tablename = 'loot_rewards') THEN
    CREATE POLICY "loot_rewards: organizer manage" ON public.loot_rewards FOR ALL
      USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
END $$;

-- loot_box_types: herkes okur; organizatör yönetir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loot_box_types: public read' AND tablename = 'loot_box_types') THEN
    CREATE POLICY "loot_box_types: public read" ON public.loot_box_types FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loot_box_types: organizer manage' AND tablename = 'loot_box_types') THEN
    CREATE POLICY "loot_box_types: organizer manage" ON public.loot_box_types FOR ALL
      USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
END $$;

-- user_loot_boxes: kendi envanteri + kendi organizatörü
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_loot_boxes: own read' AND tablename = 'user_loot_boxes') THEN
    CREATE POLICY "user_loot_boxes: own read" ON public.user_loot_boxes FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_loot_boxes: system write' AND tablename = 'user_loot_boxes') THEN
    CREATE POLICY "user_loot_boxes: system write" ON public.user_loot_boxes FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- user_pity_counters: sadece kendi, service_role yazar
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_pity_counters: own read' AND tablename = 'user_pity_counters') THEN
    CREATE POLICY "user_pity_counters: own read" ON public.user_pity_counters FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_pity_counters: system write' AND tablename = 'user_pity_counters') THEN
    CREATE POLICY "user_pity_counters: system write" ON public.user_pity_counters FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- box_opening_log: kendi log'u görür; verify amaçlı
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'box_opening_log: own read' AND tablename = 'box_opening_log') THEN
    CREATE POLICY "box_opening_log: own read" ON public.box_opening_log FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'box_opening_log: system write' AND tablename = 'box_opening_log') THEN
    CREATE POLICY "box_opening_log: system write" ON public.box_opening_log FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- event_server_seeds: HİÇKİMSE okuyamaz (sadece service_role)
-- Fuar bittikten sonra revealed_at doldurulunca herkes okuyabilir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_server_seeds: revealed read' AND tablename = 'event_server_seeds') THEN
    CREATE POLICY "event_server_seeds: revealed read" ON public.event_server_seeds FOR SELECT
      USING (revealed_at IS NOT NULL);
  END IF;
END $$;

-- user_lifetime_scores: herkes okur (leaderboard için)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_lifetime_scores: public read' AND tablename = 'user_lifetime_scores') THEN
    CREATE POLICY "user_lifetime_scores: public read" ON public.user_lifetime_scores FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_lifetime_scores: system write' AND tablename = 'user_lifetime_scores') THEN
    CREATE POLICY "user_lifetime_scores: system write" ON public.user_lifetime_scores FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- leaderboard_snapshots: herkes okur
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leaderboard_snapshots: public read' AND tablename = 'leaderboard_snapshots') THEN
    CREATE POLICY "leaderboard_snapshots: public read" ON public.leaderboard_snapshots FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leaderboard_snapshots: system write' AND tablename = 'leaderboard_snapshots') THEN
    CREATE POLICY "leaderboard_snapshots: system write" ON public.leaderboard_snapshots FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- user_box_milestones: sistem yazar, kullanıcı okur
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_box_milestones: own read' AND tablename = 'user_box_milestones') THEN
    CREATE POLICY "user_box_milestones: own read" ON public.user_box_milestones FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_box_milestones: system write' AND tablename = 'user_box_milestones') THEN
    CREATE POLICY "user_box_milestones: system write" ON public.user_box_milestones FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- M. VARSAYILAN KUTU TİPLERİ SEED DATA (mevcut aktif fuarlar için)
--    Yeni fuarlar için organizatör panelinden eklenecek.
--    Bu sadece referans olarak boş kalıyor — organizatör dolduracak.
-- ────────────────────────────────────────────────────────────

-- Tier olasılık doğrulama
ALTER TABLE public.loot_box_types
  ADD CONSTRAINT check_prob_total
  CHECK (prob_common + prob_rare + prob_epic + prob_legendary = 10000);
