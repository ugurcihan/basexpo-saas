-- Migration 013: Lead Conversions + Profile Enrichment
-- Run in Supabase SQL Editor

-- 1. Profile enrichment (visitor quality scoring)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS company_name_v text,
  ADD COLUMN IF NOT EXISTS company_size text CHECK (company_size IN ('1-10','11-50','51-200','201-1000','1000+')),
  ADD COLUMN IF NOT EXISTS industry text;

-- 2. Lead conversion funnel tracking (required for KOSGEB ROI report)
CREATE TABLE IF NOT EXISTS lead_conversions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibitor_id    uuid NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
  visitor_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES events(id) ON DELETE SET NULL,
  deal_status     text NOT NULL DEFAULT 'lead'
    CHECK (deal_status IN ('lead','contacted','meeting_held','proposal_sent','won','lost')),
  deal_value_tl   numeric(12,2),
  cost_basis_tl   numeric(12,2),
  notes           text,
  contacted_at    timestamptz,
  meeting_held_at timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(exhibitor_id, visitor_id, event_id)
);

ALTER TABLE lead_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_conversions: exhibitor manages own"
  ON lead_conversions
  FOR ALL
  USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE owner_id = auth.uid())
  );

-- 3. Events: budget tracking for ROI calculation
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS budget_tl numeric(12,2),
  ADD COLUMN IF NOT EXISTS cover_url text;

-- 4. Leads table: quick status shortcut columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deal_status text DEFAULT 'lead'
    CHECK (deal_status IN ('lead','contacted','meeting_held','proposal_sent','won','lost')),
  ADD COLUMN IF NOT EXISTS deal_value_tl numeric(12,2);

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_lead_conversions_exhibitor ON lead_conversions(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_event ON lead_conversions(event_id);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_status ON lead_conversions(deal_status);
