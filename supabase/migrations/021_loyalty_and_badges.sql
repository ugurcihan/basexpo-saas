-- ============================================================
-- 021_loyalty_and_badges.sql
-- Fuar bazlı sadakat puan sistemi + rozet + organizatör ödül eşikleri
-- KURAL: Her fuarın puanları o fuara özel (event_id ile scope'lu)
-- ============================================================

-- Rozet tanımları (global veya fuara özel)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,  -- null = global rozet
  name            text NOT NULL,
  icon            text NOT NULL DEFAULT '🏅',
  condition_type  text NOT NULL,  -- 'booth_visits' | 'total_points' | 'connections' | 'meetings' | 'checkin'
  condition_value int  NOT NULL DEFAULT 1,
  created_at      timestamptz DEFAULT now()
);

-- Ziyaretçi kazandığı rozetler (her fuarda ayrı kayıt)
CREATE TABLE IF NOT EXISTS visitor_badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id    uuid NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  earned_at   timestamptz DEFAULT now(),
  UNIQUE(visitor_id, badge_id, event_id)
);

-- Sadakat puan logu — fuar bazında, silinmez, izole edilir
CREATE TABLE IF NOT EXISTS loyalty_points (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  visitor_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points       int  NOT NULL CHECK (points > 0),
  reason       text NOT NULL,  -- 'checkin' | 'booth_visit' | 'meeting' | 'connection'
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

-- Bir ziyaretçi aynı fuarda aynı nedenle tekrar puan alamaz
-- (exhibitor bazlı unique: booth_visit bir exhibitor'a karşı 1 kez)
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_no_dup_booth
  ON loyalty_points(event_id, visitor_id, exhibitor_id)
  WHERE reason = 'booth_visit' AND exhibitor_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_no_dup_checkin
  ON loyalty_points(event_id, visitor_id)
  WHERE reason = 'checkin';

-- Hızlı toplam sorgusu için
CREATE INDEX IF NOT EXISTS idx_loyalty_event_visitor ON loyalty_points(event_id, visitor_id);

-- Organizatör ödül eşikleri (fuar bazında)
CREATE TABLE IF NOT EXISTS reward_tiers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  points_required     int  NOT NULL CHECK (points_required > 0),
  reward_title        text NOT NULL,
  reward_description  text,
  is_active           bool NOT NULL DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(event_id, points_required)
);

-- ─── Global başlangıç rozetleri ───────────────────────────────
INSERT INTO badge_definitions (name, icon, condition_type, condition_value)
VALUES
  ('İlk Adım',      '👣', 'checkin',       1),
  ('Networker',     '🤝', 'booth_visits',  3),
  ('Kaşif',         '🔭', 'booth_visits',  5),
  ('Süper Kaşif',   '🚀', 'booth_visits', 10),
  ('Toplantı Uzmanı', '📅', 'meetings',    1),
  ('Yüz Puan',      '💯', 'total_points', 100),
  ('Beş Yüz Puan',  '⭐', 'total_points', 500)
ON CONFLICT DO NOTHING;

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_tiers      ENABLE ROW LEVEL SECURITY;

-- badge_definitions: herkes okuyabilir
CREATE POLICY "badge_definitions: public read"
  ON badge_definitions FOR SELECT USING (true);

-- Organizatörler kendi fuarlarına rozet ekleyebilir
CREATE POLICY "badge_definitions: organizer insert"
  ON badge_definitions FOR INSERT
  WITH CHECK (
    event_id IS NULL
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "badge_definitions: organizer update"
  ON badge_definitions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "badge_definitions: organizer delete"
  ON badge_definitions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

-- visitor_badges: kendi rozetleri + ilgili organizatör görür
CREATE POLICY "visitor_badges: own read"
  ON visitor_badges FOR SELECT
  USING (
    visitor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "visitor_badges: system insert"
  ON visitor_badges FOR INSERT WITH CHECK (true);

-- loyalty_points: kendi puanları + ilgili organizatör görür
CREATE POLICY "loyalty_points: own or organizer read"
  ON loyalty_points FOR SELECT
  USING (
    visitor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "loyalty_points: system insert"
  ON loyalty_points FOR INSERT WITH CHECK (true);

-- reward_tiers: herkes okur
CREATE POLICY "reward_tiers: public read"
  ON reward_tiers FOR SELECT USING (true);

-- Organizatör kendi fuarının ödüllerini yönetir
CREATE POLICY "reward_tiers: organizer manage"
  ON reward_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );
