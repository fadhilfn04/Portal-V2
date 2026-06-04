-- ============================================================
-- PORTAL PEDUATEL - Complete Database Schema
-- Supabase / PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram for full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- accent-insensitive search

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  role         TEXT NOT NULL DEFAULT 'viewer'
                 CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  color        TEXT NOT NULL DEFAULT '#1a3c6e',
  icon         TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ARTICLES
-- ============================================================
CREATE TABLE public.articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  excerpt         TEXT,
  content         TEXT NOT NULL DEFAULT '',
  content_html    TEXT NOT NULL DEFAULT '',
  cover_image     TEXT,
  cover_image_alt TEXT,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  view_count      INTEGER NOT NULL DEFAULT 0,
  like_count      INTEGER NOT NULL DEFAULT 0,
  comment_count   INTEGER NOT NULL DEFAULT 0,
  reading_time    INTEGER NOT NULL DEFAULT 1,  -- minutes
  meta_title      TEXT,
  meta_description TEXT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- full-text search vector
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('indonesian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('indonesian', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('indonesian', coalesce(content, '')), 'C')
  ) STORED
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ARTICLE TAGS (many-to-many via simple join)
-- ============================================================
CREATE TABLE public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (article_id, tag)
);
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  content     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_address  INET,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ARTICLE LIKES (IP + fingerprint dedup)
-- ============================================================
CREATE TABLE public.article_likes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id        UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  ip_address        INET NOT NULL,
  device_fingerprint TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, ip_address)
);
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ARTICLE VIEWS (analytics)
-- ============================================================
CREATE TABLE public.article_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  ip_address  INET,
  session_id  TEXT,
  referrer    TEXT,
  user_agent  TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WHATSAPP SUBSCRIBERS
-- ============================================================
CREATE TABLE public.whatsapp_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number    TEXT NOT NULL UNIQUE,
  name            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source          TEXT DEFAULT 'website'
);
ALTER TABLE public.whatsapp_subscribers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BROADCAST QUEUE / LOGS
-- ============================================================
CREATE TABLE public.broadcast_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  message          TEXT NOT NULL,
  message_template TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'queued'
                     CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
  recipient_count  INTEGER NOT NULL DEFAULT 0,
  sent_count       INTEGER NOT NULL DEFAULT 0,
  failed_count     INTEGER NOT NULL DEFAULT 0,
  gateway          TEXT DEFAULT 'manual',   -- 'waha', 'whapi', 'meta', 'manual'
  gateway_response JSONB,
  error_message    TEXT,
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,    -- 'create', 'update', 'delete', 'publish', 'broadcast'
  resource_type TEXT NOT NULL,    -- 'article', 'category', 'comment', 'broadcast'
  resource_id   UUID,
  details       JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SITE SETTINGS (key-value store)
-- ============================================================
CREATE TABLE public.site_settings (
  key          TEXT PRIMARY KEY,
  value        JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================

-- Articles
CREATE INDEX idx_articles_status         ON public.articles(status);
CREATE INDEX idx_articles_published_at   ON public.articles(published_at DESC);
CREATE INDEX idx_articles_category_id    ON public.articles(category_id);
CREATE INDEX idx_articles_author_id      ON public.articles(author_id);
CREATE INDEX idx_articles_is_featured    ON public.articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_slug           ON public.articles(slug);
CREATE INDEX idx_articles_search_vector  ON public.articles USING GIN(search_vector);
CREATE INDEX idx_articles_view_count     ON public.articles(view_count DESC);
CREATE INDEX idx_articles_like_count     ON public.articles(like_count DESC);

-- Article tags
CREATE INDEX idx_article_tags_tag        ON public.article_tags(tag);

-- Comments
CREATE INDEX idx_comments_article_id    ON public.comments(article_id);
CREATE INDEX idx_comments_status        ON public.comments(status);
CREATE INDEX idx_comments_created_at    ON public.comments(created_at DESC);

-- Article likes
CREATE INDEX idx_likes_article_id       ON public.article_likes(article_id);

-- Article views
CREATE INDEX idx_views_article_id       ON public.article_views(article_id);
CREATE INDEX idx_views_created_at       ON public.article_views(created_at);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id     ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at  ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource    ON public.audit_logs(resource_type, resource_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment view count (atomic)
CREATE OR REPLACE FUNCTION public.increment_view_count(p_article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle like (returns true if liked, false if unliked)
CREATE OR REPLACE FUNCTION public.toggle_like(
  p_article_id UUID,
  p_ip_address INET,
  p_fingerprint TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.article_likes
    WHERE article_id = p_article_id AND ip_address = p_ip_address
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.article_likes
    WHERE article_id = p_article_id AND ip_address = p_ip_address;
    UPDATE public.articles SET like_count = GREATEST(0, like_count - 1) WHERE id = p_article_id;
    RETURN FALSE;
  ELSE
    INSERT INTO public.article_likes (article_id, ip_address, device_fingerprint)
    VALUES (p_article_id, p_ip_address, p_fingerprint)
    ON CONFLICT (article_id, ip_address) DO NOTHING;
    UPDATE public.articles SET like_count = like_count + 1 WHERE id = p_article_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment count
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE public.articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE public.articles SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.article_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.articles SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.article_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- PROFILES
CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES
CREATE POLICY "Active categories are public" ON public.categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- ARTICLES
CREATE POLICY "Published articles are public" ON public.articles
  FOR SELECT USING (status = 'published' AND published_at <= NOW());
CREATE POLICY "Admins see all articles" ON public.articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );
CREATE POLICY "Editors manage articles" ON public.articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- ARTICLE TAGS (follow article RLS)
CREATE POLICY "Tags on public articles are public" ON public.article_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE id = article_id AND status = 'published' AND published_at <= NOW()
    )
  );
CREATE POLICY "Admins manage tags" ON public.article_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- COMMENTS
CREATE POLICY "Approved comments are public" ON public.comments
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins see all comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Anyone can insert comment" ON public.comments
  FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Admins moderate comments" ON public.comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Admins delete comments" ON public.comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- LIKES
CREATE POLICY "Anyone can like" ON public.article_likes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can see likes" ON public.article_likes
  FOR SELECT USING (true);
CREATE POLICY "Anyone can unlike" ON public.article_likes
  FOR DELETE USING (true);

-- VIEWS
CREATE POLICY "Anyone can insert view" ON public.article_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins see views" ON public.article_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  );

-- WHATSAPP SUBSCRIBERS
CREATE POLICY "Anyone can subscribe" ON public.whatsapp_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage subscribers" ON public.whatsapp_subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- BROADCAST LOGS
CREATE POLICY "Admins manage broadcasts" ON public.broadcast_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- AUDIT LOGS
CREATE POLICY "Admins see audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- SITE SETTINGS
CREATE POLICY "Public settings are public" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- VIEWS (for convenience)
-- ============================================================

CREATE OR REPLACE VIEW public.articles_with_author AS
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

-- Monthly views analytics
CREATE OR REPLACE VIEW public.monthly_views AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*)::INTEGER AS view_count
FROM public.article_views
GROUP BY 1
ORDER BY 1;

-- Monthly articles analytics
CREATE OR REPLACE VIEW public.monthly_articles AS
SELECT
  DATE_TRUNC('month', published_at) AS month,
  COUNT(*)::INTEGER AS article_count
FROM public.articles
WHERE status = 'published'
GROUP BY 1
ORDER BY 1;

-- ============================================================
-- SEED DATA - Default Categories
-- ============================================================

INSERT INTO public.categories (name, slug, description, color, sort_order) VALUES
  ('Berita Pusat',   'berita-pusat',  'Berita dan informasi dari kantor pusat',         '#1a3c6e', 1),
  ('Berita Daerah',  'berita-daerah', 'Berita dari cabang dan daerah di seluruh Indonesia', '#0ea5e9', 2),
  ('Kegiatan',       'kegiatan',      'Kegiatan dan aktivitas organisasi',               '#10b981', 3),
  ('Kesehatan',      'kesehatan',     'Informasi dan tips kesehatan untuk anggota',      '#f59e0b', 4),
  ('Olahraga',       'olahraga',      'Kegiatan olahraga dan kebugaran',                 '#ef4444', 5),
  ('Sosial',         'sosial',        'Kegiatan sosial kemasyarakatan',                  '#8b5cf6', 6),
  ('Dapen Telkom',   'dapen-telkom',  'Informasi Dana Pensiun Telkom',                   '#ec4899', 7),
  ('Pengumuman',     'pengumuman',    'Pengumuman resmi organisasi',                     '#f97316', 8);

-- Default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name',          '"Portal PeduaTel"'),
  ('site_tagline',       '"Persatuan Pensiunan Telekomunikasi Indonesia"'),
  ('site_description',   '"Portal resmi berita dan informasi bagi pensiunan Telkom Indonesia"'),
  ('articles_per_page',  '12'),
  ('enable_comments',    'true'),
  ('require_comment_approval', 'true'),
  ('enable_whatsapp',    'false'),
  ('whatsapp_gateway',   '"manual"'),
  ('hero_article_id',    'null'),
  ('featured_count',     '6');
