-- ============================================================
-- PORTAL PEDUATEL — Article Event Fields
-- Artikel dengan event_date terisi akan tampil di Kalender Kegiatan
-- ============================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS event_date      DATE,
  ADD COLUMN IF NOT EXISTS event_end_date  DATE,
  ADD COLUMN IF NOT EXISTS event_time      TIME,
  ADD COLUMN IF NOT EXISTS event_end_time  TIME,
  ADD COLUMN IF NOT EXISTS event_location  TEXT;

-- Partial index — hanya artikel yang punya event_date
CREATE INDEX IF NOT EXISTS idx_articles_event_date
  ON public.articles (event_date)
  WHERE event_date IS NOT NULL;
