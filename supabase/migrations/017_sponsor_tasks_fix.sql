-- Migration 017: event_sponsors fix, fair_tasks, hall-maps storage

-- ── event_sponsors table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_sponsors (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  tier         int  not null default 1,
  tier_name    text not null default 'Ana Sponsor',
  created_at   timestamptz not null default now(),
  unique(event_id, exhibitor_id)
);

ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sponsors: organizer full" ON public.event_sponsors;
CREATE POLICY "sponsors: organizer full" ON public.event_sponsors
  USING (event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid()));

DROP POLICY IF EXISTS "sponsors: public read" ON public.event_sponsors;
CREATE POLICY "sponsors: public read" ON public.event_sponsors FOR SELECT USING (true);

-- ── fair_tasks table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fair_tasks (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  title      text not null,
  is_done    boolean not null default false,
  due_date   date,
  created_at timestamptz not null default now()
);

ALTER TABLE public.fair_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks: organizer full" ON public.fair_tasks;
CREATE POLICY "tasks: organizer full" ON public.fair_tasks
  USING (event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid()));

-- ── hall-maps storage bucket ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('hall-maps', 'hall-maps', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "hall-maps public read" ON storage.objects;
CREATE POLICY "hall-maps public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'hall-maps');

DROP POLICY IF EXISTS "hall-maps auth upload" ON storage.objects;
CREATE POLICY "hall-maps auth upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hall-maps' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hall-maps auth delete" ON storage.objects;
CREATE POLICY "hall-maps auth delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'hall-maps' AND auth.role() = 'authenticated');
