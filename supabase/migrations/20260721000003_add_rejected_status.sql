-- ============================================================
-- Add 'rejected' status to article workflow
-- Provides better visibility for rejected articles
-- ============================================================

-- Add rejected to the status check constraint
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_status_check;
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'archived', 'rejected'));

-- Add comment for documentation
COMMENT ON TEXT CONSTRAINT articles_status_check ON public.articles IS 'Valid article statuses: draft, pending_review, published, archived, rejected';
