-- ============================================================
-- 022_reward_winners.sql
-- "İlk X kazanan" ödül sistemi
-- reward_tiers'e max_winners eklenir, reward_winners tablosu oluşturulur
-- ============================================================

-- Kontenjan sınırı (null = sınırsız, N = ilk N kişi)
ALTER TABLE reward_tiers
  ADD COLUMN IF NOT EXISTS max_winners int CHECK (max_winners IS NULL OR max_winners > 0);

-- Kazanan kayıtları (tier bazında, ziyaretçi başına 1 satır)
CREATE TABLE IF NOT EXISTS reward_winners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id     uuid NOT NULL REFERENCES reward_tiers(id) ON DELETE CASCADE,
  visitor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank        int  NOT NULL CHECK (rank > 0),  -- 1 = ilk kazanan
  claimed_at  timestamptz DEFAULT now(),
  UNIQUE(tier_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_winners_tier ON reward_winners(tier_id);

ALTER TABLE reward_winners ENABLE ROW LEVEL SECURITY;

-- Ziyaretçi kendi kazanımlarını görür; organizatör kendi fuarlarındakileri görür
CREATE POLICY "reward_winners: own or organizer read"
  ON reward_winners FOR SELECT
  USING (
    visitor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM reward_tiers rt
      JOIN events e ON e.id = rt.event_id
      WHERE rt.id = tier_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "reward_winners: system insert"
  ON reward_winners FOR INSERT WITH CHECK (true);
