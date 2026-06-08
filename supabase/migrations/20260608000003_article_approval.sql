-- Add pending_review to article status
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_status_check;
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));

-- Store rejection reason when pusat rejects an article
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Recreate view so a.* picks up the new column
DROP VIEW IF EXISTS public.articles_with_author;
CREATE VIEW public.articles_with_author AS
SELECT
  a.*,
  c.name          AS category_name,
  c.slug          AS category_slug,
  c.color         AS category_color,
  p.full_name     AS author_name,
  p.avatar_url    AS author_avatar,
  ARRAY(
    SELECT tag FROM public.article_tags WHERE article_id = a.id
  ) AS tags
FROM public.articles a
LEFT JOIN public.categories c ON c.id = a.category_id
LEFT JOIN public.profiles p   ON p.id = a.author_id;
