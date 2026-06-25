# WhatsApp Subscribers Management - Design Specification

**Date:** 2025-06-25
**Status:** Approved
**Author:** TechWolfAir (with Claude assistance)

---

## Overview

Halaman manajemen WhatsApp subscribers untuk melihat, mencari, memfilter, dan mengelola (activate/deactivate/delete) nomor WhatsApp yang berlangganan update dari Portal PeduaTel.

**Location:** `/admin/whatsapp-subscribers`

---

## Requirements

### Functional Requirements

1. **Display Subscribers**
   - List semua WhatsApp subscribers dari tabel `whatsapp_subscribers`
   - Show phone number, name, status, source, dan subscribed date
   - Handle empty states ketika tidak ada data

2. **Search & Filtering**
   - Search by nama atau phone number
   - Filter by status (Active/Inactive/All)
   - Filter by source (Web/Manual/Import/Other)
   - Filter by date range (Today/This Week/This Month/Custom)
   - Advanced filter: phone pattern matching
   - Sort options: newest, oldest, name A-Z, name Z-A

3. **Individual Actions**
   - Edit subscriber details (phone, name, source)
   - Toggle status: activate/deactivate
   - Delete subscriber (with confirmation)

4. **Bulk Actions**
   - Select multiple subscribers
   - Bulk activate/deactivate
   - Bulk delete (with confirmation)
   - Export selected to CSV

5. **Add Manual Subscriber**
   - Form untuk tambah subscriber manual
   - Validation: phone format, duplicate check

### Non-Functional Requirements

- Responsive design (mobile, tablet, desktop)
- Consistent styling dengan admin pages yang sudah ada
- Performance: handle sampai 1000+ subscribers dengan pagination
- Security: role-based access control (admin/editor only)

---

## Architecture

### Approach: Hybrid Server/Client Components

**Rationale:** Balance antara SEO-friendly initial load dan modern UX untuk filter/actions.

#### Component Structure

```
/admin/whatsapp-subscribers/
├── page.tsx                    # Server component - initial data fetch
└── components/
    └── whatsapp-subscribers-manager.tsx  # Client component - filters, actions, state
```

#### Data Flow

1. **Server Component** (`page.tsx`)
   - Fetch initial data from Supabase
   - Pass to client component as props
   - Handle route changes for navigation

2. **Client Component** (`whatsapp-subscribers-manager.tsx`)
   - Manage filter/search state
   - Handle individual actions (edit, activate, delete)
   - Handle bulk actions
   - Communicate dengan API endpoints untuk mutations

---

## Components

### 1. Page Header Component

**Location:** Top of page

**Content:**
- Title: "WhatsApp Subscribers"
- Subtitle: "Kelola nomor WhatsApp yang berlangganan update"
- Quick stats cards (horizontal layout):
  - Total subscribers
  - Active subscribers
  - Inactive subscribers
  - New this month

**Reference:** Similar to [admin/page.tsx:88-100](app/(admin)/admin/page.tsx#L88-L100)

### 2. Filter Controls Component

**Layout:** 2 rows dalam single card

**Row 1 - Primary Filters:**
- Search input (debounced)
- Status dropdown
- Source dropdown
- Date range picker

**Row 2 - Secondary Filters (expandable):**
- Phone pattern filter
- Sort options
- Reset filters button

**Behavior:**
- Real-time filtering (debounced untuk search)
- Filter count badge
- URL params sync (optional - untuk bookmarking)

### 3. Subscribers Table Component

**Columns:**
1. Checkbox (for bulk select)
2. Phone Number (clickable to copy)
3. Name (show "Anonymous" jika null)
4. Status Badge (green = active, gray = inactive)
5. Source Badge (color-coded)
6. Subscribed Date (relative format)
7. Actions (dropdown menu)

**Styling:**
- Follow existing admin table pattern
- Border rows dengan hover effects
- Empty state illustration

**Pagination:**
- 10/25/50 per page
- Page numbers dengan prev/next

### 4. Bulk Actions Bar

**Display Condition:** Show only when 1+ rows selected

**Content:**
- Selection count: "X subscribers terpilih"
- Action buttons:
  - Activate All
  - Deactivate All
  - Delete All (danger)
  - Export CSV

**Confirmation:**
- Activate/Deactivate: toast confirmation
- Delete: modal dengan count

### 5. Edit/Add Modal

**Edit Mode:**
- Fields: Phone Number, Name, Status, Source
- Readonly: Subscribed Date, Last Updated
- Actions: Save, Cancel

**Add Manual Mode:**
- Fields: Phone Number, Name, Source
- Auto-set: Status = Active, Subscribed = now

**Validation:**
- Phone format: Regex `/^(08|628|\+628)[0-9]{8,11}$/` (Indonesian WhatsApp format)
- Duplicate number check
- Reference: [lib/validations/comment.ts:11-18](lib/validations/comment.ts#L11-L18)

---

## Data Models

### WhatsAppSubscriber Type

```typescript
interface WhatsAppSubscriber {
  id: string
  phone_number: string
  name: string | null
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
  source: string | null
}
```

**Source:** Already defined in [lib/types/index.ts:121-129](lib/types/index.ts#L121-L129)

---

## API Endpoints

### Existing Endpoints to Use

- `GET /api/articles` - untuk fetch articles (reference pattern)
- `POST/PUT/DELETE /api/*` - untuk CRUD operations (follow existing patterns)

### New Endpoints Needed

1. **GET /api/whatsapp-subscribers**
   - Query params: `status`, `source`, `date_from`, `date_to`, `search`, `sort`, `page`, `per_page`
   - Returns: `{ data: WhatsAppSubscriber[], total, page, per_page }`

2. **PUT /api/whatsapp-subscribers/[id]**
   - Body: `{ name?, source?, is_active? }`
   - Returns: updated subscriber

3. **POST /api/whatsapp-subscribers/bulk-update**
   - Body: `{ ids: string[], action: 'activate' | 'deactivate' }`
   - Returns: `{ updated: number }`

4. **DELETE /api/whatsapp-subscribers/[id]**
   - Returns: success confirmation

5. **POST /api/whatsapp-subscribers/bulk-delete**
   - Body: `{ ids: string[] }`
   - Returns: `{ deleted: number }`

6. **POST /api/whatsapp-subscribers**
   - Body: `{ phone_number, name?, source }`
   - Validation: phone_number using regex `/^(08|628|\+628)[0-9]{8,11}$/`
   - Duplicate check: ensure phone_number not already exists
   - Returns: created subscriber

---

## Styling

### Design Tokens

- **Border radius:** `rounded-xl` (12px) untuk cards, `rounded-2xl` (16px) untuk larger cards
- **Colors:**
  - Primary: `brand-600` (#1a3c6e)
  - Success: `green-600` / `success-500`
  - Warning: `amber-600`
  - Danger: `red-600`
  - Neutral: `neutral-*` shades
- **Typography:**
  - Headings: `font-heading`, `font-extrabold`, `text-2xl`
  - Body: `text-sm`, `font-semibold` untuk labels
- **Shadows:** `shadow-sm` untuk cards
- **Transitions:** `transition-colors` untuk buttons/links

### Reference Patterns

- Admin dashboard: [app/(admin)/admin/page.tsx](app/(admin)/admin/page.tsx)
- Broadcast page: [app/(admin)/admin/broadcast/page.tsx](app/(admin)/admin/broadcast/page.tsx)
- Comments page: [app/(admin)/admin/komentar/page.tsx](app/(admin)/admin/komentar/page.tsx)

---

## Implementation Notes

### State Management

- Client component menggunakan `useState` untuk filters
- Search debounced (500ms)
- **NOT in v1 scope:** URL params sync untuk shareability (future enhancement)

### Error Handling

- Toast notifications untuk errors
- Form validation dengan inline errors
- Confirmation modals untuk destructive actions

### Performance Considerations

- Pagination untuk handle large datasets
- Debounced search untuk reduce API calls
- Virtual scrolling (optional, untuk 1000+ subscribers)

### Security

- Role check di server component (admin/editor only)
- Rate limiting untuk bulk actions
- CSRF protection untuk mutations

---

## Testing Strategy

### Unit Tests
- Component rendering
- Filter logic
- Form validation

### Integration Tests
- API endpoints
- Database operations

### E2E Tests
- User flows: filter → select → bulk action
- Add/edit/delete subscriber

---

## Success Criteria

- [ ] Page accessible at `/admin/whatsapp-subscribers`
- [ ] Can view, search, and filter subscribers
- [ ] Can edit individual subscribers
- [ ] Can activate/deactivate subscribers
- [ ] Can delete subscribers (individual + bulk)
- [ ] Can add new subscribers manually
- [ ] Can export to CSV
- [ ] Consistent styling dengan existing admin pages
- [ ] Responsive design works on mobile/tablet
- [ ] All actions have proper confirmation/feedback

---

## Future Enhancements (Out of Scope)

- Analytics dashboard (charts, growth trends)
- Import subscribers from CSV
- Auto-cleanup inactive subscribers
- Subscription preferences management
- WhatsApp message history per subscriber
