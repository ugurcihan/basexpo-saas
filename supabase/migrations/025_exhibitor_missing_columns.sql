-- Add missing contact/location columns to exhibitors
-- These were referenced in code but never migrated to production

ALTER TABLE exhibitors
  ADD COLUMN IF NOT EXISTS website       text,
  ADD COLUMN IF NOT EXISTS phone         text,
  ADD COLUMN IF NOT EXISTS city          text,
  ADD COLUMN IF NOT EXISTS contact_email text;
