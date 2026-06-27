-- Add approval status to exhibitors
-- Existing rows default to 'approved' for backwards compatibility
-- New applications via applyToFair() insert as 'pending'

ALTER TABLE exhibitors
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));
