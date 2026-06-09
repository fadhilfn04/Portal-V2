import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { articleSchema, articleStatusSchema } from '@/lib/validations/article'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { getSettings } from '@/lib/utils/settings'
import { autoBroadcast } from '@/lib/utils/whatsapp'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles_with_author')
    .select()
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })

  const { data: tags } = await supabase
    .from('article_tags')
    .select('tag')
    .eq('article_id', id)

  return NextResponse.json({ data: { ...data, tags: tags?.map((t) => t.tag) ?? [] } })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // Check if this is a status-only update (partial update)
  const isStatusOnlyUpdate = Object.keys(body).length === 1 && 'status' in body

  if (isStatusOnlyUpdate) {
    // Use simplified schema for status-only updates
    const parsed = articleStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    // Capture old status to detect publish event
    const { data: existing } = await supabase
      .from('articles')
      .select('status, title')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const { status } = parsed.data

    // Non-super_admin cannot publish directly — route through approval
    const effectiveStatus =
      status === 'published' && profile.role !== 'super_admin'
        ? 'pending_review'
        : status

    const { data: article, error } = await supabase
      .from('articles')
      .update({
        status: effectiveStatus,
        rejection_reason: null,
        published_at: effectiveStatus === 'published'
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'update',
      resource_type: 'article',
      resource_id: id,
      details: { title: existing.title, status: article.status },
    })

    // Auto-broadcast only when status transitions to published for the first time
    const justPublished = article.status === 'published' && !['published'].includes(existing?.status ?? '')
    if (justPublished) {
      const settings = await getSettings()
      if (settings.enable_whatsapp) {
        await autoBroadcast(article, user.id, settings.whatsapp_gateway)
          .catch((err) => console.error('[broadcast] error:', err))
      }
    }

    return NextResponse.json({ data: article })
  }

  // Full article update
  const parsed = articleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  // Capture old status to detect publish event
  const { data: existing } = await supabase
    .from('articles')
    .select('status')
    .eq('id', id)
    .single()

  const { tags, ...articleData } = parsed.data
  const readingTime = body.reading_time ?? calculateReadingTime(articleData.content)

  // Non-super_admin cannot publish directly — route through approval
  const effectiveStatus =
    articleData.status === 'published' && profile.role !== 'super_admin'
      ? 'pending_review'
      : articleData.status

  const { data: article, error } = await supabase
    .from('articles')
    .update({
      ...articleData,
      status: effectiveStatus,
      rejection_reason: null, // clear any prior rejection when re-submitting
      reading_time: readingTime,
      published_at: effectiveStatus === 'published'
        ? articleData.published_at || new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Replace tags
  await supabase.from('article_tags').delete().eq('article_id', id)
  if (tags.length > 0) {
    await supabase.from('article_tags').insert(tags.map((tag) => ({ article_id: id, tag })))
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update',
    resource_type: 'article',
    resource_id: id,
    details: { title: article.title, status: article.status },
  })

  // Auto-broadcast only when status transitions to published for the first time
  const justPublished = article.status === 'published' && !['published'].includes(existing?.status ?? '')
  if (justPublished) {
    const settings = await getSettings()
    if (settings.enable_whatsapp) {
      await autoBroadcast(article, user.id, settings.whatsapp_gateway)
        .catch((err) => console.error('[broadcast] error:', err))
    }
  }

  return NextResponse.json({ data: article })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'delete',
    resource_type: 'article',
    resource_id: id,
  })

  return NextResponse.json({ success: true })
}
