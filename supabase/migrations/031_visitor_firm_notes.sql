-- ============================================================
-- 031: visitor_firm_notes — ziyaretçi kartvizit defteri
-- ============================================================

CREATE TABLE IF NOT EXISTS public.visitor_firm_notes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id     uuid NOT NULL REFERENCES public.profiles(id)          ON DELETE CASCADE,
  exhibitor_id   uuid NOT NULL REFERENCES public.exhibitors(id)        ON DELETE CASCADE,
  contact_id     uuid             REFERENCES public.exhibitor_contacts(id) ON DELETE SET NULL,
  personal_note  text,
  status         text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'pending', 'done')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(visitor_id, exhibitor_id)
);

ALTER TABLE public.visitor_firm_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'visitor_firm_notes: visitor manage own' AND tablename = 'visitor_firm_notes'
  ) THEN
    CREATE POLICY "visitor_firm_notes: visitor manage own"
      ON public.visitor_firm_notes FOR ALL
      USING (visitor_id = auth.uid())
      WITH CHECK (visitor_id = auth.uid());
  END IF;
END $$;
