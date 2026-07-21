# Article Approval Flow - Test Checklist

## Security Test Checklist

This checklist ensures the article approval workflow is secure and enforced at all layers.

### ✅ Backend API Tests

#### POST /api/articles (Create Article)

- [ ] **Admin creates article with `status=draft`** → Article saved as `draft`
- [ ] **Admin creates article with `status=published`** → Status changed to `pending_review`
- [ ] **Superadmin creates article with `status=published`** → Article saved as `published`, `approved_at` and `approved_by` populated
- [ ] **Editor creates article with `status=published`** → Status changed to `pending_review`
- [ ] **Unauthenticated user attempts to create** → Returns 401 Unauthorized
- [ ] **Viewer attempts to create** → Returns 403 Forbidden

#### PUT /api/articles/{id} (Update Article)

- [ ] **Admin updates article to `status=published`** → Status changed to `pending_review`
- [ ] **Superadmin updates article to `status=published`** → Status becomes `published`, `approved_at` and `approved_by` populated
- [ ] **Status-only update with `status=published` by Admin** → Status changed to `pending_review`
- [ ] **Status-only update with `status=published` by Superadmin** → Status becomes `published`

#### POST /api/articles/{id}/review (Approve/Reject)

- [ ] **Superadmin approves article** → Status becomes `published`, `approved_at` and `approved_by` populated
- [ ] **Superadmin rejects article with reason** → Status becomes `draft`, `rejection_reason` stored, `approved_at` and `approved_by` cleared
- [ ] **Admin attempts to approve** → Returns 403 Forbidden
- [ ] **Editor attempts to approve** → Returns 403 Forbidden

#### GET /api/articles (List Articles)

- [ ] **Unauthenticated user requests with `?status=draft`** → Returns only `published` articles
- [ ] **Unauthenticated user requests with `?status=pending_review`** → Returns only `published` articles
- [ ] **Unauthenticated user default request** → Returns only `published` articles
- [ ] **Admin requests with `?status=draft`** → Returns draft articles
- [ ] **Admin requests with `?status=pending_review`** → Returns pending articles
- [ ] **Editor requests with `?status=all`** → Returns all articles

#### GET /api/articles/{id} (Single Article)

- [ ] **Unauthenticated user requests draft article by ID** → Returns 404 Not Found
- [ ] **Unauthenticated user requests pending article by ID** → Returns 404 Not Found
- [ ] **Unauthenticated user requests published article** → Returns article
- [ ] **Admin requests draft article** → Returns article
- [ ] **Superadmin requests pending article** → Returns article

### ✅ Frontend UI Tests

#### Article Editor (Admin)

- [ ] **"Simpan Draf" button** → Saves article as draft
- [ ] **"Ajukan untuk Disetujui" button** → Submits for approval (status=pending_review)
- [ ] **No "Publish" button shown** → Admin should not see direct publish option

#### Article Editor (Superadmin)

- [ ] **"Terbitkan" button** → Publishes immediately (status=published)
- [ ] **No approval required** → Article becomes published without review

#### Article List (Admin View)

- [ ] **"Ajukan" button for draft articles** → Submits for approval
- [ ] **"Kirim Ulang" button for pending articles** → Re-submits for approval
- [ ] **No "Publish" button** → Should not exist for admin

#### Approval Page (Superadmin Only)

- [ ] **Page accessible only to super_admin** → Admins redirected
- [ ] **"Setujui" button** → Approves and publishes article
- [ ] **"Tolak" button with reason** → Rejects and sends back to draft

### ✅ Public Page Tests

#### Homepage (/)

- [ ] **Featured articles** → Only shows `published` articles
- [ ] **Latest news section** → Only shows `published` articles
- [ ] **Popular articles** → Only shows `published` articles
- [ ] **Regional news** → Only shows `published` articles
- [ ] **Events calendar** → Only shows `published` articles

#### Article List (/artikel)

- [ ] **All articles listed** → Only `published` articles visible
- [ ] **Category filter** → Only shows `published` in category
- [ ] **Pagination** → Only includes `published` articles

#### Article Detail (/artikel/{slug})

- [ ] **Published article** → Displays correctly
- [ ] **Draft article slug** → Returns 404
- [ ] **Pending article slug** → Returns 404
- [ ] **Archived article slug** → Returns 404

#### Search (/cari?q=term)

- [ ] **Search results** → Only returns `published` articles
- [ ] **Draft articles not indexed** → Not in search results
- [ ] **Pending articles not indexed** → Not in search results

#### Category Pages (/kategori/{slug})

- [ ] **Category articles** → Only shows `published` articles

### ✅ Database Tests

#### RLS Policies

- [ ] **Unauthenticated direct query** → Can only select `published` articles
- [ ] **Admin direct query** → Can select all articles
- [ ] **Editor direct query** → Can select all articles

#### Direct Bypass Attempts

- [ ] **UPDATE articles SET status='published' WHERE id={draft_id}** → Blocked by RLS for unauthenticated
- [ ] **SELECT * FROM articles WHERE status='draft'** → Blocked by RLS for unauthenticated
- [ ] **INSERT with status='published' as viewer** → Blocked by RLS

### ✅ API Bypass Tests

#### Direct HTTP Requests (curl/Postman)

```bash
# Test 1: Try to publish as Admin
curl -X POST https://your-domain.com/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{"title":"Test","content":"Test","status":"published"}'
# Expected: status=pending_review, NOT published

# Test 2: Try to access draft article anonymously
curl https://your-domain.com/api/articles/{DRAFT_UUID}
# Expected: 404 Not Found

# Test 3: Try to list draft articles anonymously
curl "https://your-domain.com/api/articles?status=draft"
# Expected: Returns only published articles

# Test 4: Try to approve as Admin
curl -X POST https://your-domain.com/api/articles/{id}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{"action":"approve"}'
# Expected: 403 Forbidden
```

### ✅ Race Condition Tests

- [ ] **Concurrent publish attempts** → Only one should succeed
- [ ] **Approve while editing** → Should handle gracefully
- [ ] **Reject while approving** → Last action should win

### ✅ Audit Trail Tests

- [ ] **Article creation** → Audit log entry created
- [ ] **Article approval** → Audit log with action='approve'
- [ ] **Article rejection** → Audit log with action='reject' and reason
- [ ] **approved_at populated** → Set when article is approved
- [ ] **approved_by populated** → Set to super_admin UUID on approval
- [ ] **rejection_reason populated** → Set when article is rejected

### ✅ Edge Cases

- [ ] **Superadmin edits own published article** → Should remain published (re-approval not required)
- [ ] **Admin edits published article** → Should require re-approval (status changes to pending_review)
- [ ] **Article scheduled for future** → Should not appear until published_at passes
- [ ] **Archive published article** → Should be removed from public view
- [ ] **Unarchive article** → Should remain draft, require re-approval

### ✅ Security Headers

- [ ] **API responses include CORS headers** → Properly configured
- [ ] **Rate limiting on publish endpoint** → Prevents abuse
- [ ] **Request validation** → Invalid payloads rejected

## Manual Testing Steps

### Step 1: Admin Creates Article

1. Login as Admin
2. Create new article with content
3. Click "Simpan Draf" → Verify status is `draft`
4. Click "Ajukan untuk Disetujui" → Verify status is `pending_review`
5. Try to access `/artikel/{slug}` → Should return 404

### Step 2: Superadmin Approval

1. Login as Superadmin
2. Navigate to `/admin/approval`
3. Click "Setujui" on pending article
4. Verify `approved_at` and `approved_by` are populated
5. Access `/artikel/{slug}` → Should display article

### Step 3: Rejection Test

1. Create another article as Admin
2. Submit for approval
3. As Superadmin, click "Tolak" with reason
4. Verify `rejection_reason` is stored
5. Verify status is `draft`
6. Verify rejection notice shows for Admin

### Step 4: Superadmin Direct Publish

1. Login as Superadmin
2. Create new article
3. Click "Terbitkan"
4. Verify status is `published` immediately
5. Verify `approved_at` and `approved_by` are populated

### Step 5: API Security Test

1. Open Postman or curl
2. Attempt GET `/api/articles?status=draft` without auth
3. Verify response only contains `published` articles
4. Attempt GET `/api/articles/{draft_id}` without auth
5. Verify 404 response

## Regression Tests

After any code changes, verify:

- [ ] Homepage displays correctly
- [ ] Article list displays correctly
- [ ] Search works correctly
- [ ] Admin approval queue works correctly
- [ ] Admin article management works correctly
- [ ] Superadmin can still approve/reject
- [ ] Published articles are publicly accessible
- [ ] Non-published articles are NOT publicly accessible
