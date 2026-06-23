-- ============================================================
-- Migration 014: Hall floor plan maps + booth coordinates
-- ============================================================

-- Halls: add map image columns
ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS map_url     text,
  ADD COLUMN IF NOT EXISTS map_width   integer,
  ADD COLUMN IF NOT EXISTS map_height  integer;

-- Booths: add x/y position (percentage of map image size, 0-100)
ALTER TABLE public.booths
  ADD COLUMN IF NOT EXISTS x_pct      numeric(6,3),
  ADD COLUMN IF NOT EXISTS y_pct      numeric(6,3),
  ADD COLUMN IF NOT EXISTS width_pct  numeric(6,3) DEFAULT 3,
  ADD COLUMN IF NOT EXISTS height_pct numeric(6,3) DEFAULT 3;

-- ============================================================
-- Storage bucket for hall floor plan images
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hall-maps',
  'hall-maps',
  true,
  10485760,   -- 10 MB limit
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'hall-maps: public read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "hall-maps: public read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'hall-maps')
    $p$;
  END IF;
END $$;

-- Authenticated users can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'hall-maps: authenticated upload'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "hall-maps: authenticated upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'hall-maps')
    $p$;
  END IF;
END $$;

-- Authenticated users can update (replace)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'hall-maps: authenticated update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "hall-maps: authenticated update"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'hall-maps')
    $p$;
  END IF;
END $$;

-- Authenticated users can delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'hall-maps: authenticated delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "hall-maps: authenticated delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'hall-maps')
    $p$;
  END IF;
END $$;
