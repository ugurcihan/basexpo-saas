-- ============================================================
-- Migration 015: Fair gate check-in/out + wayfinding support
-- ============================================================

-- ── fair_checkins table (yeni) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.fair_checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  visitor_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_in_at   timestamptz NOT NULL DEFAULT now(),
  checked_out_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
  -- No UNIQUE constraint: visitor can enter/exit multiple times
);

ALTER TABLE public.fair_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins: organizer read"
  ON public.fair_checkins FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "checkins: authenticated insert"
  ON public.fair_checkins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "checkins: authenticated update"
  ON public.fair_checkins FOR UPDATE
  TO authenticated
  USING (true);

CREATE INDEX idx_fair_checkins_event   ON public.fair_checkins(event_id);
CREATE INDEX idx_fair_checkins_visitor ON public.fair_checkins(visitor_id);

-- ── halls: wayfinding koordinatları ──────────────────────
ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS entrance_x numeric(6,3),
  ADD COLUMN IF NOT EXISTS entrance_y numeric(6,3),
  ADD COLUMN IF NOT EXISTS exit_x     numeric(6,3),
  ADD COLUMN IF NOT EXISTS exit_y     numeric(6,3);

-- ── Storage: SVG format desteği ──────────────────────────
UPDATE storage.buckets
SET allowed_mime_types = array_append(
  COALESCE(allowed_mime_types, '{}'),
  'image/svg+xml'
)
WHERE id = 'hall-maps'
  AND NOT ('image/svg+xml' = ANY(COALESCE(allowed_mime_types, '{}')));
