-- ============================================================
-- Enhanced Row Level Security Policies for Articles
-- Ensures pending_review and other non-published statuses are properly protected
-- ============================================================

-- Drop existing policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Published articles are public" ON public.articles;
DROP POLICY IF EXISTS "Admins see all articles" ON public.articles;
DROP POLICY IF EXISTS "Editors manage articles" ON public.articles;

-- Recreate SELECT policies with enhanced security
CREATE POLICY "Published articles are public" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins and editors see all non-public articles" ON public.articles
  FOR SELECT USING (
    status IN ('draft', 'pending_review', 'archived') AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- Comprehensive policy for admins and editors to manage all articles
CREATE POLICY "Editors and admins manage articles" ON public.articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- Ensure article_tags RLS follows article status
DROP POLICY IF EXISTS "Tags on public articles are public" ON public.article_tags;
DROP POLICY IF EXISTS "Admins manage tags" ON public.article_tags;

CREATE POLICY "Tags on published articles are public" ON public.article_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE id = article_id AND status = 'published'
    )
  );

CREATE POLICY "Admins and editors manage tags" ON public.article_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- Add helpful comments
COMMENT ON POLICY "Published articles are public" ON public.articles IS 'Only published articles can be accessed by unauthenticated users';
COMMENT ON POLICY "Admins and editors see all non-public articles" ON public.articles IS 'Draft, pending_review, and archived articles visible only to authorized users';
