-- Halls map kolonları (migration 014 production'a uygulanmamıştı)
ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS map_url    text,
  ADD COLUMN IF NOT EXISTS map_width  integer,
  ADD COLUMN IF NOT EXISTS map_height integer;

-- Booths pozisyon kolonları (migration 014 production'a uygulanmamıştı)
ALTER TABLE public.booths
  ADD COLUMN IF NOT EXISTS x_pct      numeric(6,3),
  ADD COLUMN IF NOT EXISTS y_pct      numeric(6,3),
  ADD COLUMN IF NOT EXISTS width_pct  numeric(6,3) NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS height_pct numeric(6,3) NOT NULL DEFAULT 3;

-- Sponsor piramit layout kolonları (drag/resize/logo desteği)
ALTER TABLE public.event_sponsors
  ADD COLUMN IF NOT EXISTS width_pct       numeric(5,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS height_px       integer      NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS sort_order      integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_logo_url text;

-- Sponsor logo storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('sponsor-logos', 'sponsor-logos', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "sponsor-logos public read" ON storage.objects;
CREATE POLICY "sponsor-logos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'sponsor-logos');

DROP POLICY IF EXISTS "sponsor-logos auth upload" ON storage.objects;
CREATE POLICY "sponsor-logos auth upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sponsor-logos auth delete" ON storage.objects;
CREATE POLICY "sponsor-logos auth delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated');
