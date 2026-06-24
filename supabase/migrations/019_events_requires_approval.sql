-- Kapı QR sayfası için eksik kolon (events tablosunda hiç eklenmemişti)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
