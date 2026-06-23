-- =============================================
-- Migration 012: KVKK, Favorites, Meeting Types
-- =============================================
-- Run this in Supabase SQL Editor

-- 1. profiles: telefon ve KVKK onay alanları
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS kvkk_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS kvkk_consent_at timestamptz;

-- 2. events: organizatör onayı gerektirme modu
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;

-- 3. event_registrations: 'pending_approval' durumu + kvkk_consent
ALTER TABLE event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_status_check;
ALTER TABLE event_registrations
  ADD CONSTRAINT event_registrations_status_check
  CHECK (status IN ('confirmed', 'waitlisted', 'pending_approval'));
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS kvkk_consent boolean DEFAULT true NOT NULL;

-- 4. favorites tablosu
CREATE TABLE IF NOT EXISTS favorites (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exhibitor_id uuid NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(visitor_id, exhibitor_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites: visitor manages own" ON favorites;
CREATE POLICY "favorites: visitor manages own" ON favorites
  USING (auth.uid() = visitor_id) WITH CHECK (auth.uid() = visitor_id);

-- 5. meetings: visitor→firm desteği için ek kolonlar
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS meeting_type text DEFAULT 'visitor_to_visitor',
  ADD COLUMN IF NOT EXISTS exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subject text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meetings_meeting_type_check'
  ) THEN
    ALTER TABLE meetings
      ADD CONSTRAINT meetings_meeting_type_check
      CHECK (meeting_type IN ('visitor_to_visitor', 'visitor_to_firm'));
  END IF;
END $$;
