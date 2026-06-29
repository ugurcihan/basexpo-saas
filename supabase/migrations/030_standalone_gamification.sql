-- ============================================================
-- 030: standalone QR gamification
-- exhibitors: video_url, video_points, survey_points, custom_reward
-- standalone_interactions: video/survey puan takibi
-- ============================================================

-- A. exhibitors tablosuna yeni kolonlar
ALTER TABLE public.exhibitors
  ADD COLUMN IF NOT EXISTS video_url      TEXT,
  ADD COLUMN IF NOT EXISTS video_points   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS survey_points  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_reward  TEXT;

-- B. standalone_interactions: ziyaretçi başına tek kayıt (UNIQUE)
CREATE TABLE IF NOT EXISTS public.standalone_interactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  visitor_id   uuid NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  interaction  text NOT NULL CHECK (interaction IN ('video', 'survey')),
  points       int  NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(exhibitor_id, visitor_id, interaction)
);

ALTER TABLE public.standalone_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'standalone_interactions: public read' AND tablename = 'standalone_interactions'
  ) THEN
    CREATE POLICY "standalone_interactions: public read"
      ON public.standalone_interactions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'standalone_interactions: visitor insert own' AND tablename = 'standalone_interactions'
  ) THEN
    CREATE POLICY "standalone_interactions: visitor insert own"
      ON public.standalone_interactions FOR INSERT
      WITH CHECK (visitor_id = auth.uid());
  END IF;
END $$;
