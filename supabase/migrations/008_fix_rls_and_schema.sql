-- Migration 008: Fix RLS policies + make exhibitors.event_id nullable
-- Idempotent — safe to run even if some policies already exist

-- ============================================================
-- A. exhibitors.event_id → nullable (registration flow için)
-- ============================================================
ALTER TABLE public.exhibitors
  ALTER COLUMN event_id DROP NOT NULL;

-- ============================================================
-- B. events: public read published — idempotent
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'events'
      AND policyname = 'events: public read published'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "events: public read published"
        ON public.events FOR SELECT
        USING (status IN ('published', 'active', 'ended'));
    $p$;
  END IF;
END $$;

-- ============================================================
-- C. halls: public read — idempotent
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'halls'
      AND policyname = 'halls: public read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "halls: public read"
        ON public.halls FOR SELECT
        USING (true);
    $p$;
  END IF;
END $$;

-- ============================================================
-- D. booths: public read — idempotent
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'booths'
      AND policyname = 'booths: public read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "booths: public read"
        ON public.booths FOR SELECT
        USING (true);
    $p$;
  END IF;
END $$;

-- ============================================================
-- E. exhibitors: public read — idempotent
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'exhibitors'
      AND policyname = 'exhibitors: public read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "exhibitors: public read"
        ON public.exhibitors FOR SELECT
        USING (true);
    $p$;
  END IF;
END $$;

-- ============================================================
-- F. events: organizer full access — idempotent
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'events'
      AND policyname = 'events: organizer full access'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "events: organizer full access"
        ON public.events FOR ALL
        USING (auth.uid() = organizer_id);
    $p$;
  END IF;
END $$;
