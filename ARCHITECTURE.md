# Portal PeduaTel — System Architecture & Design Specification

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Portal PeduaTel                               │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Next.js 15 │    │   Supabase   │    │    Vercel CDN    │  │
│  │  App Router  │◄──►│  PostgreSQL  │    │  Edge Network    │  │
│  │  React 19    │    │  Auth + RLS  │    │  Auto-scaling    │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                   │                                    │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │  Supabase    │    │  WhatsApp    │                          │
│  │  Storage     │    │  Gateway     │                          │
│  │  (Images)    │    │  (Future)    │                          │
│  └──────────────┘    └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Database ERD

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  profiles   │     │    articles      │     │ categories  │
│─────────────│     │──────────────────│     │─────────────│
│ id (PK)     │◄────│ id (PK)          │────►│ id (PK)     │
│ full_name   │     │ title            │     │ name        │
│ avatar_url  │     │ slug (UNIQUE)    │     │ slug        │
│ bio         │     │ excerpt          │     │ description │
│ role        │     │ content          │     │ color       │
│ is_active   │     │ content_html     │     │ sort_order  │
└─────────────┘     │ cover_image      │     │ is_active   │
                    │ category_id (FK) │     └─────────────┘
                    │ author_id (FK)   │
                    │ status           │     ┌─────────────────┐
                    │ is_featured      │     │  article_tags   │
                    │ view_count       │     │─────────────────│
                    │ like_count       │◄────│ article_id (FK) │
                    │ comment_count    │     │ tag             │
                    │ reading_time     │     └─────────────────┘
                    │ published_at     │
                    │ search_vector    │     ┌─────────────────┐
                    └──────────────────┘     │   comments      │
                           │                 │─────────────────│
                           │◄────────────────│ id (PK)         │
                           │                 │ article_id (FK) │
                    ┌──────────────────┐     │ name            │
                    │  article_likes   │     │ email           │
                    │──────────────────│     │ content         │
                    │ id (PK)          │     │ status          │
                    │ article_id (FK)  │     │ ip_address      │
                    │ ip_address       │     └─────────────────┘
                    │ device_fp        │
                    └──────────────────┘     ┌──────────────────────┐
                                             │  broadcast_logs      │
                    ┌──────────────────┐     │──────────────────────│
                    │  article_views   │     │ id (PK)              │
                    │──────────────────│     │ article_id (FK)      │
                    │ id (PK)          │     │ message              │
                    │ article_id (FK)  │     │ status               │
                    │ ip_address       │     │ recipient_count      │
                    │ session_id       │     │ gateway              │
                    │ referrer         │     │ created_by (FK)      │
                    └──────────────────┘     └──────────────────────┘

                    ┌────────────────────────┐
                    │  whatsapp_subscribers  │
                    │────────────────────────│
                    │ id (PK)                │
                    │ phone_number (UNIQUE)  │
                    │ name                   │
                    │ is_active              │
                    └────────────────────────┘
```

## 3. Feature Breakdown

### Public Portal
- **Homepage**: Hero featured article, latest news grid, popular articles, regional news, WhatsApp CTA
- **Article List**: Paginated grid, category filters, sort options
- **Article Detail**: Medium-quality reading experience, like/share/comment
- **Category Pages**: Filtered article lists per category
- **Search**: Full-text search via PostgreSQL `tsvector` + `websearch_to_tsquery`
- **About Page**: Organization information

### Admin Panel
- **Dashboard**: Stats overview, recent articles, pending comments alert
- **Article Management**: Create/Edit/Delete with TipTap editor, SEO fields, tag management
- **Category Management**: CRUD with color picker
- **Comment Moderation**: Approve/Reject/Delete with bulk actions
- **WhatsApp Broadcast**: Article selection, message template generation, gateway selection
- **Analytics**: Views per month charts (Recharts), category stats
- **Settings**: Site configuration

## 4. API Design

```
GET    /api/articles              - List articles (paginated)
POST   /api/articles              - Create article (admin)
GET    /api/articles/[id]         - Get article by ID
PUT    /api/articles/[id]         - Update article (admin)
DELETE /api/articles/[id]         - Delete article (admin)
POST   /api/articles/[id]/like    - Toggle like (public)

GET    /api/comments              - List approved comments
POST   /api/comments              - Submit comment (public, pending)
PUT    /api/comments/[id]         - Moderate comment (admin)
DELETE /api/comments/[id]         - Delete comment (admin)

GET    /api/categories            - List categories
POST   /api/categories            - Create category (admin)
PUT    /api/categories/[id]       - Update category (admin)

GET    /api/search                - Full-text search

POST   /api/views/[id]            - Record article view (deduped)

POST   /api/broadcast             - Create broadcast (admin)
GET    /api/broadcast             - List broadcast logs (admin)

POST   /api/subscribe             - WhatsApp subscriber opt-in
DELETE /api/subscribe             - Unsubscribe

POST   /api/upload                - Image upload to Supabase Storage
```

## 5. UI/UX Design System

### Color Palette
```
Brand — Telkom Navy
  50:  #f0f5ff   100: #e1eaff   200: #c3d5ff
  300: #93b3ff   400: #5d88ff   500: #3461ff
  600: #1a3c6e ← Primary       700: #152f58
  800: #0f2242   900: #08142a   950: #04091a

Accent — Telkom Red
  500: #e31837 ← Primary Accent
  600: #c01530

Neutral
  25:  #fafafa   50:  #f7f8fa   100: #f0f2f5
  200: #e2e5eb   400: #9aa3b5   600: #4e566c
  900: #141824
```

### Typography
```
Display/Heading: Plus Jakarta Sans (400–800)
Body:            Inter Variable (400–600)
Mono:            JetBrains Mono (400)

Article body: 18px / line-height 1.85
Card title:   16px / font-weight 700
Caption:      12px / font-weight 500
```

### Spacing System
4px base grid — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128px

### Border Radius
xs: 4px  sm: 6px  DEFAULT: 10px  lg: 16px  xl: 20px  2xl: 24px  full: 9999px

### Shadows
xs → 2xl progressively deeper shadows with low opacity values

### Component Patterns
- Cards: white bg, neutral-150 border, hover:shadow-md hover:border-brand-200
- Buttons: rounded-xl, height 10-11 (40-44px), min-width for touch
- Inputs: rounded-xl, border + ring focus style
- Badges: rounded-full, colored bg at 10% opacity + colored border + colored text

## 6. Folder Structure

```
portal-peduatel/
├── app/
│   ├── (public)/               # Public-facing pages
│   │   ├── layout.tsx          # Header + Footer wrapper
│   │   ├── page.tsx            # Homepage
│   │   ├── artikel/
│   │   │   ├── page.tsx        # Article list
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Article detail
│   │   ├── kategori/[slug]/    # Category pages
│   │   ├── cari/               # Search
│   │   └── tentang/            # About page
│   ├── (auth)/
│   │   └── login/              # Admin login
│   ├── (admin)/
│   │   ├── layout.tsx          # Admin shell (sidebar + topbar)
│   │   └── admin/
│   │       ├── page.tsx        # Dashboard
│   │       ├── artikel/        # Article management
│   │       ├── kategori/       # Category management
│   │       ├── komentar/       # Comment moderation
│   │       ├── broadcast/      # WhatsApp broadcast
│   │       └── analitik/       # Analytics
│   ├── api/                    # Route Handlers
│   ├── globals.css             # Design system (TW v4 @theme)
│   └── layout.tsx              # Root layout
├── components/
│   ├── layout/                 # Header, Footer, Nav
│   ├── home/                   # Homepage sections
│   ├── article/                # Article components
│   ├── admin/                  # Admin components
│   └── shared/                 # Reusable atoms
├── lib/
│   ├── supabase/               # Client + Server + Middleware
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Helpers (date, slug, reading-time)
│   ├── validations/            # Zod schemas
│   ├── hooks/                  # TanStack Query hooks
│   ├── stores/                 # Zustand stores
│   └── actions/                # Server Actions
├── supabase/
│   └── migrations/             # SQL migrations
├── public/                     # Static assets
├── middleware.ts               # Route protection
└── next.config.ts
```

## 7. WhatsApp Broadcast Architecture

```
Article Published
      │
      ▼
Admin Dashboard
  [Broadcast WA button]
      │
      ▼
POST /api/broadcast
  {article_id, gateway}
      │
      ▼
  Generate Template
  ┌──────────────────────────────────┐
  │ 📢 Berita Terbaru PeduaTel      │
  │                                  │
  │ *{title}*                        │
  │                                  │
  │ {excerpt}                        │
  │                                  │
  │ 📖 Baca Selengkapnya:            │
  │ https://portal.peduatel.id/...   │
  └──────────────────────────────────┘
      │
      ├── gateway: 'manual' → Save to broadcast_logs (queued)
      │                     → Return template to admin (copy/paste)
      │
      ├── gateway: 'waha'   → Call WAHA API → Mark as sent
      ├── gateway: 'whapi'  → Call Whapi API → Mark as sent
      └── gateway: 'meta'   → Call Meta WA Business API → Mark as sent
```

## 8. Step-by-Step Implementation Plan

### Phase 1 — Foundation (Week 1)
- [ ] Install dependencies: `npm install`
- [ ] Set up Supabase project
- [ ] Run database migrations
- [ ] Configure environment variables
- [ ] Deploy base to Vercel
- [ ] Test auth flow

### Phase 2 — Core Reading Experience (Week 2)
- [ ] Homepage with hero, latest, popular sections
- [ ] Article detail page with typography
- [ ] Category pages
- [ ] Search page
- [ ] Footer

### Phase 3 — Engagement Features (Week 3)
- [ ] Like system (client-side + API)
- [ ] Comment submission + moderation
- [ ] Share buttons
- [ ] View counting
- [ ] WhatsApp subscription form

### Phase 4 — Admin Panel (Week 4)
- [ ] Login page + middleware
- [ ] Admin sidebar + layout
- [ ] Dashboard with stats
- [ ] Article editor (TipTap)
- [ ] Category management

### Phase 5 — Advanced Admin (Week 5)
- [ ] Comment moderation UI
- [ ] Broadcast system (manual mode first)
- [ ] Analytics charts (Recharts)
- [ ] Image upload to Supabase Storage
- [ ] Audit log display

### Phase 6 — Polish & Launch (Week 6)
- [ ] SEO: sitemap.xml, robots.txt, OG images
- [ ] Performance: image optimization, PPR
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile testing across devices
- [ ] Load testing
- [ ] Content migration from old WordPress
- [ ] Go-live

### Phase 7 — Post-launch (Ongoing)
- [ ] WhatsApp Gateway integration (WAHA/Whapi/Meta)
- [ ] Analytics deep dive
- [ ] Email newsletter option
- [ ] Push notifications (PWA)
- [ ] Progressive Web App manifest

## 9. Performance Targets

| Metric                | Target   |
|-----------------------|----------|
| LCP (Largest CP)      | < 2.0s   |
| FID (First Input)     | < 100ms  |
| CLS (Layout Shift)    | < 0.1    |
| Mobile PageSpeed      | > 90     |
| Desktop PageSpeed     | > 95     |
| Accessibility Score   | > 90     |
| Time to First Byte    | < 200ms  |

## 10. Security Checklist

- ✅ Row Level Security (RLS) on all tables
- ✅ Admin role verification in middleware + API routes
- ✅ Comment rate limiting (3/IP/hour)
- ✅ Like deduplication by IP
- ✅ No service role key exposed to client
- ✅ Zod validation on all API inputs
- ✅ SQL injection protection (Supabase parameterized queries)
- ✅ CSRF protection (Next.js built-in)
- ✅ Content Security Policy (add via next.config)
- ✅ Input sanitization on TipTap HTML output
