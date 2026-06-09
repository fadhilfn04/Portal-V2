-- ============================================================
-- Recreate articles_with_author view so it picks up the new
-- event_* columns added by migration 20260609000001_article_events
--
-- PostgreSQL expands `a.*` at view-creation time, not at query
-- time. Running CREATE OR REPLACE re-expands it to include the
-- new columns.
-- ============================================================

-- DROP first because CREATE OR REPLACE fails when a.* expansion
-- reorders existing columns (new event_* cols inserted before category_name)
DROP VIEW IF EXISTS public.articles_with_author;

CREATE VIEW public.articles_with_author AS
SELECT
  a.*,
  c.name        AS category_name,
  c.slug        AS category_slug,
  c.color       AS category_color,
  p.full_name   AS author_name,
  p.avatar_url  AS author_avatar,
  ARRAY(
    SELECT tag FROM public.article_tags WHERE article_id = a.id
  ) AS tags
FROM public.articles a
LEFT JOIN public.categories c ON c.id = a.category_id
LEFT JOIN public.profiles p   ON p.id = a.author_id;
