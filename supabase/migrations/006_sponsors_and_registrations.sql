-- ============================================================
-- BasExpo — Faz 8: Sponsor Piramidi + Ziyaretçi Kayıtları
-- ============================================================

-- ─── capacity kolonu ─────────────────────────────────────────
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity int;

-- ─── Ziyaretçi fuar kayıtları ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  visitor_id   uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'confirmed'
               check (status in ('confirmed', 'waitlisted')),
  ticket_code  text,
  created_at   timestamptz not null default now(),
  unique(event_id, visitor_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reg: visitor own"
  ON public.event_registrations FOR ALL
  USING (auth.uid() = visitor_id)
  WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "reg: organizer read"
  ON public.event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND e.organizer_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_event_reg_event   ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_visitor ON public.event_registrations(visitor_id);

-- ─── Sponsor piramidi ────────────────────────────────────────
-- tier: 1=Platin (Ana Sponsor), 2=Altın, 3=Gümüş, 4=Bronz
-- Tier sayısı arttıkça görsel alan küçülür (ters piramit)

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

CREATE POLICY "sponsors: organizer full"
  ON public.event_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_sponsors.event_id
        AND e.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_sponsors.event_id
        AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "sponsors: public read"
  ON public.event_sponsors FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_sponsors_event     ON public.event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_exhibitor ON public.event_sponsors(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier      ON public.event_sponsors(event_id, tier);
