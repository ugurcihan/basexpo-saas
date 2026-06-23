-- Migration 016: Events tablosuna detay alanları ekle
-- Fuar lokasyon, kategori, medya ve sosyal medya desteği

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS maps_url      text,
  ADD COLUMN IF NOT EXISTS category      text,
  ADD COLUMN IF NOT EXISTS tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS youtube_url   text,
  ADD COLUMN IF NOT EXISTS social_links  jsonb   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS banner_url    text;

-- social_links JSONB şeması: { website, instagram, twitter, linkedin, facebook }
