-- ============================================================
-- Migration 007: QR Isı Haritası, Bildirimler, Altın QR
-- ============================================================

-- 1. QR tarama kaydı (booth bazlı ısı haritası için)
CREATE TABLE IF NOT EXISTS public.qr_scans (
  id           uuid primary key default gen_random_uuid(),
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  booth_id     uuid references public.booths(id) on delete set null,
  visitor_id   uuid references public.profiles(id) on delete set null,
  event_id     uuid not null references public.events(id) on delete cascade,
  scanned_at   timestamptz not null default now()
);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scans: organizer read" ON public.qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "scans: exhibitor read" ON public.qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors ex
      WHERE ex.id = exhibitor_id AND ex.owner_id = auth.uid()
    )
  );

CREATE POLICY "scans: anyone insert" ON public.qr_scans
  FOR INSERT WITH CHECK (true);

-- 2. Bildirimler
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  sender_id     uuid references public.profiles(id) on delete set null,
  event_id      uuid references public.events(id) on delete cascade,
  type          text not null default 'announcement'
                check (type in ('announcement', 'reminder', 'alert', 'golden_qr')),
  title         text not null,
  body          text,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif: recipient all" ON public.notifications
  FOR ALL USING (auth.uid() = recipient_id);

CREATE POLICY "notif: organizer insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Altın QR kodları
CREATE TABLE IF NOT EXISTS public.golden_qr_codes (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  organizer_id      uuid not null references public.profiles(id) on delete cascade,
  booth_id          uuid references public.booths(id) on delete set null,
  token             text not null unique default encode(gen_random_bytes(16), 'hex'),
  label             text not null,
  prize_description text,
  is_active         boolean not null default true,
  scan_limit        int,
  created_at        timestamptz not null default now()
);

ALTER TABLE public.golden_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "golden_qr: organizer full" ON public.golden_qr_codes
  FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "golden_qr: public read active" ON public.golden_qr_codes
  FOR SELECT USING (is_active = true);

-- 4. Altın QR taramaları
CREATE TABLE IF NOT EXISTS public.golden_qr_scans (
  id             uuid primary key default gen_random_uuid(),
  golden_qr_id   uuid not null references public.golden_qr_codes(id) on delete cascade,
  visitor_id     uuid not null references public.profiles(id) on delete cascade,
  scanned_at     timestamptz not null default now(),
  unique(golden_qr_id, visitor_id)
);

ALTER TABLE public.golden_qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gq_scans: organizer read" ON public.golden_qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.golden_qr_codes g
      WHERE g.id = golden_qr_id AND g.organizer_id = auth.uid()
    )
  );

CREATE POLICY "gq_scans: visitor own" ON public.golden_qr_scans
  FOR ALL USING (auth.uid() = visitor_id);

CREATE POLICY "gq_scans: anyone insert" ON public.golden_qr_scans
  FOR INSERT WITH CHECK (true);

-- 5. Events tablosuna galeri URL'leri kolonu
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS gallery_urls text[] not null default '{}';

-- 6. Index'ler (performans)
CREATE INDEX IF NOT EXISTS qr_scans_event_idx ON public.qr_scans (event_id);
CREATE INDEX IF NOT EXISTS qr_scans_booth_idx ON public.qr_scans (booth_id);
CREATE INDEX IF NOT EXISTS qr_scans_scanned_at_idx ON public.qr_scans (scanned_at);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS golden_qr_token_idx ON public.golden_qr_codes (token);
