-- ============================================================
-- Article Approval Tracking
-- Adds audit trail for who approved articles and when
-- ============================================================

-- Add columns for tracking approval metadata
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for approval analytics
CREATE INDEX IF NOT EXISTS idx_articles_approved_by ON public.articles(approved_by) WHERE approved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_approved_at ON public.articles(approved_at) WHERE approved_at IS NOT NULL;

-- Recreate view to include new columns
DROP VIEW IF EXISTS public.articles_with_author;
CREATE VIEW public.articles_with_author AS
SELECT
  a.*,
  c.name          AS category_name,
  c.slug          AS category_slug,
  c.color         AS category_color,
  p.full_name     AS author_name,
  p.avatar_url    AS author_avatar,
  approver.full_name AS approver_name,
  ARRAY(
    SELECT tag FROM public.article_tags WHERE article_id = a.id
  ) AS tags
FROM public.articles a
LEFT JOIN public.categories c ON c.id = a.category_id
LEFT JOIN public.profiles p   ON p.id = a.author_id
LEFT JOIN public.profiles approver ON approver.id = a.approved_by;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.approved_at IS 'Timestamp when article was approved by super_admin';
COMMENT ON COLUMN public.articles.approved_by IS 'UUID of super_admin who approved this article';
