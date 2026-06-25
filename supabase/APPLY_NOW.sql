-- ============================================================
-- APPLY_NOW.sql
-- Migration 021 + 022 — tek seferde Supabase SQL Editor'dan çalıştır
-- Dashboard → SQL Editor → New Query → yapıştır → RUN
-- ============================================================

-- ── Migration 021: Sadakat Puan Sistemi + Rozetler + Ödül Eşikleri ──

CREATE TABLE IF NOT EXISTS badge_definitions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,
  name            text NOT NULL,
  icon            text NOT NULL DEFAULT '🏅',
  condition_type  text NOT NULL,
  condition_value int  NOT NULL DEFAULT 1,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visitor_badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id    uuid NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  earned_at   timestamptz DEFAULT now(),
  UNIQUE(visitor_id, badge_id, event_id)
);

CREATE TABLE IF NOT EXISTS loyalty_points (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  visitor_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points       int  NOT NULL CHECK (points > 0),
  reason       text NOT NULL,
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_no_dup_booth
  ON loyalty_points(event_id, visitor_id, exhibitor_id)
  WHERE reason = 'booth_visit' AND exhibitor_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_no_dup_checkin
  ON loyalty_points(event_id, visitor_id)
  WHERE reason = 'checkin';

CREATE INDEX IF NOT EXISTS idx_loyalty_event_visitor
  ON loyalty_points(event_id, visitor_id);

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

-- ── Migration 022: İlk X Kazanan sistemi ──────────────────────

ALTER TABLE reward_tiers
  ADD COLUMN IF NOT EXISTS max_winners int CHECK (max_winners IS NULL OR max_winners > 0);

CREATE TABLE IF NOT EXISTS reward_winners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id     uuid NOT NULL REFERENCES reward_tiers(id) ON DELETE CASCADE,
  visitor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank        int  NOT NULL CHECK (rank > 0),
  claimed_at  timestamptz DEFAULT now(),
  UNIQUE(tier_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_winners_tier ON reward_winners(tier_id);

-- ── Başlangıç Rozetleri ────────────────────────────────────────

INSERT INTO badge_definitions (name, icon, condition_type, condition_value)
VALUES
  ('İlk Adım',         '👣', 'checkin',       1),
  ('Networker',        '🤝', 'booth_visits',  3),
  ('Kaşif',            '🔭', 'booth_visits',  5),
  ('Süper Kaşif',      '🚀', 'booth_visits', 10),
  ('Toplantı Uzmanı',  '📅', 'meetings',      1),
  ('Yüz Puan',         '💯', 'total_points', 100),
  ('Beş Yüz Puan',     '⭐', 'total_points', 500)
ON CONFLICT DO NOTHING;

-- ── RLS Politikaları ──────────────────────────────────────────

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_tiers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_winners    ENABLE ROW LEVEL SECURITY;

-- badge_definitions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badge_definitions' AND policyname = 'badge_definitions: public read') THEN
    CREATE POLICY "badge_definitions: public read" ON badge_definitions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badge_definitions' AND policyname = 'badge_definitions: organizer insert') THEN
    CREATE POLICY "badge_definitions: organizer insert" ON badge_definitions FOR INSERT
      WITH CHECK (event_id IS NULL OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badge_definitions' AND policyname = 'badge_definitions: organizer update') THEN
    CREATE POLICY "badge_definitions: organizer update" ON badge_definitions FOR UPDATE
      USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badge_definitions' AND policyname = 'badge_definitions: organizer delete') THEN
    CREATE POLICY "badge_definitions: organizer delete" ON badge_definitions FOR DELETE
      USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
END $$;

-- visitor_badges
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_badges' AND policyname = 'visitor_badges: own read') THEN
    CREATE POLICY "visitor_badges: own read" ON visitor_badges FOR SELECT
      USING (visitor_id = auth.uid() OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_badges' AND policyname = 'visitor_badges: system insert') THEN
    CREATE POLICY "visitor_badges: system insert" ON visitor_badges FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- loyalty_points
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_points' AND policyname = 'loyalty_points: own or organizer read') THEN
    CREATE POLICY "loyalty_points: own or organizer read" ON loyalty_points FOR SELECT
      USING (visitor_id = auth.uid() OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_points' AND policyname = 'loyalty_points: system insert') THEN
    CREATE POLICY "loyalty_points: system insert" ON loyalty_points FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- reward_tiers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reward_tiers' AND policyname = 'reward_tiers: public read') THEN
    CREATE POLICY "reward_tiers: public read" ON reward_tiers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reward_tiers' AND policyname = 'reward_tiers: organizer manage') THEN
    CREATE POLICY "reward_tiers: organizer manage" ON reward_tiers FOR ALL
      USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
  END IF;
END $$;

-- reward_winners
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reward_winners' AND policyname = 'reward_winners: own or organizer read') THEN
    CREATE POLICY "reward_winners: own or organizer read" ON reward_winners FOR SELECT
      USING (
        visitor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM reward_tiers rt
          JOIN events e ON e.id = rt.event_id
          WHERE rt.id = tier_id AND e.organizer_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reward_winners' AND policyname = 'reward_winners: system insert') THEN
    CREATE POLICY "reward_winners: system insert" ON reward_winners FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── Doğrulama ─────────────────────────────────────────────────
SELECT
  'badge_definitions' as tablo, COUNT(*) as satir FROM badge_definitions
UNION ALL SELECT 'visitor_badges',   COUNT(*) FROM visitor_badges
UNION ALL SELECT 'loyalty_points',   COUNT(*) FROM loyalty_points
UNION ALL SELECT 'reward_tiers',     COUNT(*) FROM reward_tiers
UNION ALL SELECT 'reward_winners',   COUNT(*) FROM reward_winners;
