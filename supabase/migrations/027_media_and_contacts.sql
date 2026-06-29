-- ============================================================
-- 027: logos storage bucket + products.video_url + exhibitor_contacts
-- ============================================================

-- A. logos storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Logos: public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'logos: public read' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "logos: public read"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'logos');
  END IF;
END $$;

-- Logos: authenticated upload
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'logos: authenticated upload' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "logos: authenticated upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'logos');
  END IF;
END $$;

-- Logos: owner update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'logos: owner update' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "logos: owner update"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Logos: owner delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'logos: owner delete' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "logos: owner delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- B. products tablosuna video_url eklendi
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text;

-- C. exhibitor_contacts: çoklu yetkili kişi desteği
CREATE TABLE IF NOT EXISTS public.exhibitor_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  email        text,
  phone        text,
  job_title    text,
  contact_type text NOT NULL DEFAULT 'official'
    CHECK (contact_type IN ('official', 'booth')),
  sort_order   int  NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.exhibitor_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'exhibitor_contacts: public read' AND tablename = 'exhibitor_contacts'
  ) THEN
    CREATE POLICY "exhibitor_contacts: public read"
      ON public.exhibitor_contacts FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'exhibitor_contacts: owner manage' AND tablename = 'exhibitor_contacts'
  ) THEN
    CREATE POLICY "exhibitor_contacts: owner manage"
      ON public.exhibitor_contacts FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.exhibitors e
          WHERE e.id = exhibitor_id AND e.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.exhibitors e
          WHERE e.id = exhibitor_id AND e.owner_id = auth.uid()
        )
      );
  END IF;
END $$;
