-- Remove duplicate exhibitors, keeping best status (approved > pending > rejected)
-- then most recent. Triggered by applyToFair inserting a second record.

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY owner_id, event_id
      ORDER BY
        CASE status WHEN 'approved' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
        created_at DESC
    ) AS rn
  FROM exhibitors
  WHERE event_id IS NOT NULL
)
DELETE FROM exhibitors WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Partial unique index: only enforces uniqueness when event_id is set.
-- Standalone QR codes (event_id = NULL) are intentionally exempt.
CREATE UNIQUE INDEX IF NOT EXISTS exhibitors_owner_event_unique
  ON exhibitors(owner_id, event_id)
  WHERE event_id IS NOT NULL;
