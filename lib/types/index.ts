// ============================================================
// PORTAL PEDUATEL – Core TypeScript Types
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer'
export type ArticleStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected'
export type CommentStatus = 'pending' | 'approved' | 'rejected'
export type BroadcastStatus = 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled'
export type BroadcastGateway = 'manual' | 'fonnte' | 'waha' | 'whapi' | 'meta'

// ── Profile ────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Category ───────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// ── Article ────────────────────────────────────────────────
export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  content_html: string
  cover_image: string | null
  cover_image_alt: string | null
  category_id: string | null
  author_id: string | null
  status: ArticleStatus
  is_featured: boolean
  view_count: number
  like_count: number
  comment_count: number
  reading_time: number
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // ── Event / Calendar fields (nullable — set only on event articles)
  event_date: string | null
  event_end_date: string | null
  event_time: string | null
  event_end_time: string | null
  event_location: string | null
}

export interface ArticleWithRelations extends Article {
  category_name: string | null
  category_slug: string | null
  category_color: string | null
  author_name: string | null
  author_avatar: string | null
  tags: string[]
}

export interface ArticleListItem
  extends Pick<
    ArticleWithRelations,
    | 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image' | 'cover_image_alt'
    | 'reading_time' | 'view_count' | 'like_count' | 'comment_count'
    | 'is_featured' | 'published_at' | 'status'
    | 'category_name' | 'category_slug' | 'category_color'
    | 'author_name' | 'author_avatar' | 'tags'
    | 'event_date' | 'event_end_date' | 'event_time' | 'event_end_time' | 'event_location'
  > {}

// ── Comment ────────────────────────────────────────────────
export interface Comment {
  id: string
  article_id: string
  name: string
  email: string | null
  content: string
  status: CommentStatus
  ip_address: string | null
  moderated_by: string | null
  moderated_at: string | null
  created_at: string
}

// ── Broadcast ──────────────────────────────────────────────
export interface BroadcastLog {
  id: string
  article_id: string | null
  message: string
  message_template: string
  status: BroadcastStatus
  recipient_count: number
  sent_count: number
  failed_count: number
  gateway: BroadcastGateway
  gateway_response: Record<string, unknown> | null
  error_message: string | null
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
  created_by: string | null
}

// ── WhatsApp Subscriber ────────────────────────────────────
export interface WhatsAppSubscriber {
  id: string
  phone_number: string
  name: string | null
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
  source: string | null
}

// ── Audit Log ──────────────────────────────────────────────
export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// ── Analytics ──────────────────────────────────────────────
export interface MonthlyStats {
  month: string
  view_count: number
}

export interface MonthlyArticles {
  month: string
  article_count: number
}

export interface DashboardStats {
  total_articles: number
  total_published: number
  total_views: number
  total_likes: number
  total_comments: number
  total_pending_comments: number
  total_subscribers: number
}

// ── API Responses ──────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ── Form Types ─────────────────────────────────────────────
export interface ArticleFormValues {
  title: string
  slug: string
  excerpt: string
  content: string
  content_html: string
  cover_image: string
  cover_image_alt: string
  category_id: string
  tags: string[]
  status: ArticleStatus
  is_featured: boolean
  meta_title: string
  meta_description: string
  published_at: string
  // Event fields (for Kegiatan category)
  event_date?: string
  event_end_date?: string
  event_time?: string
  event_end_time?: string
  event_location?: string
}

export interface CommentFormValues {
  name: string
  email: string
  content: string
}

export interface WhatsAppSubscribeFormValues {
  phone_number: string
  name: string
}

// ── Site Settings ──────────────────────────────────────────
export interface SiteSettings {
  site_name: string
  site_tagline: string
  site_description: string
  articles_per_page: number
  enable_comments: boolean
  require_comment_approval: boolean
  enable_whatsapp: boolean
  whatsapp_gateway: BroadcastGateway
  hero_article_id: string | null
  featured_count: number
}

// ── Search ─────────────────────────────────────────────────
export interface SearchResult {
  articles: ArticleListItem[]
  total: number
  query: string
}

// ── Navigation ─────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon?: string
  children?: NavItem[]
}
