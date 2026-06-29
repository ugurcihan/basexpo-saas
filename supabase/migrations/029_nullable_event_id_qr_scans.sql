-- Bağımsız QR taramalarının kaydedilebilmesi için event_id kısıtı kaldırılıyor.
-- Standalone exhibitor'lar için event_id = NULL olacak.
ALTER TABLE public.qr_scans
  ALTER COLUMN event_id DROP NOT NULL;
