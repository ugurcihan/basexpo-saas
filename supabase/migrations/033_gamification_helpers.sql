-- ============================================================
-- 033: Gamification yardımcı fonksiyonlar
-- ============================================================

-- claimed_count artıran güvenli RPC (race condition yok)
CREATE OR REPLACE FUNCTION public.increment_claimed_count(reward_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.loot_rewards
  SET claimed_count = claimed_count + 1
  WHERE id = reward_id;
$$;

-- Fuar bitince snapshot al + server seed aç (organizatör çağırır)
CREATE OR REPLACE FUNCTION public.finalize_fair_leaderboard(p_event_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Leaderboard snapshot kaydet
  INSERT INTO public.leaderboard_snapshots (event_id, user_id, rank, points)
  SELECT
    p_event_id,
    visitor_id,
    RANK() OVER (ORDER BY SUM(points) DESC),
    SUM(points)
  FROM public.loyalty_points
  WHERE event_id = p_event_id
  GROUP BY visitor_id
  ON CONFLICT (event_id, user_id) DO UPDATE
    SET rank = EXCLUDED.rank, points = EXCLUDED.points, snapshot_at = now();

  -- Server seed'i açıkla (artık herkes verify edebilir)
  UPDATE public.event_server_seeds
  SET revealed_at = now()
  WHERE event_id = p_event_id;
END;
$$;

-- Kullanıcı ülke/şehir güncelle (kayıt/login'de çağrılır)
CREATE OR REPLACE FUNCTION public.upsert_lifetime_location(
  p_user_id     uuid,
  p_country     text,
  p_city        text
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.user_lifetime_scores (user_id, country_code, city)
  VALUES (p_user_id, p_country, p_city)
  ON CONFLICT (user_id) DO UPDATE
    SET country_code = EXCLUDED.country_code,
        city         = EXCLUDED.city,
        updated_at   = now();
$$;
