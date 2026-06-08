-- Add gallery_images column to articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]';

-- Recreate view so a.* re-expands to include gallery_images
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

-- Create public storage bucket for article images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read article images (they're public)
CREATE POLICY "Public read article images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

-- Only admins/editors can upload
CREATE POLICY "Admins upload article images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'article-images'
    AND auth.role() = 'authenticated'
  );

-- Only admins/editors can delete their own uploads
CREATE POLICY "Admins delete article images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'article-images'
    AND auth.uid() = owner
  );
