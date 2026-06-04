import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commentSchema } from '@/lib/validations/comment'
import { getSettings } from '@/lib/utils/settings'
import { headers } from 'next/headers'
import { z } from 'zod'

const createCommentSchema = commentSchema.extend({
  article_id: z.string().uuid(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const articleId = searchParams.get('article_id')
  const status    = searchParams.get('status') ?? 'approved'
  const page      = Number(searchParams.get('page') ?? 1)
  const limit     = 10
  const offset    = (page - 1) * limit

  if (!articleId) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

  const supabase = await createClient()

  const { data, count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact' })
    .eq('article_id', articleId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count ?? 0, page, per_page: limit })
}

export async function POST(req: NextRequest) {
  // ── 1. Check site settings ───────────────────────────────
  const settings = await getSettings()

  if (!settings.enable_comments) {
    return NextResponse.json(
      { error: 'Komentar tidak diaktifkan pada portal ini.' },
      { status: 403 }
    )
  }

  // ── 2. Get IP ─────────────────────────────────────────────
  const headerStore = await headers()
  const ip = (
    headerStore.get('cf-connecting-ip') ??
    headerStore.get('x-real-ip') ??
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1'
  )

  // ── 3. Validate body ──────────────────────────────────────
  const body = await req.json()
  const parsed = createCommentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const supabase = await createClient()

  // ── 4. Rate limit: 3 comments per IP per hour ────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact' })
    .eq('ip_address', ip)
    .gte('created_at', oneHourAgo)

  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Terlalu banyak komentar dalam waktu singkat. Silakan coba lagi nanti.' },
      { status: 429 }
    )
  }

  // ── 5. Insert with correct status from settings ───────────
  const commentStatus = settings.require_comment_approval ? 'pending' : 'approved'

  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id: parsed.data.article_id,
      name:       parsed.data.name,
      email:      parsed.data.email || null,
      content:    parsed.data.content,
      status:     commentStatus,
      ip_address: ip,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    {
      data,
      // Tell client whether the comment is live or pending review
      requires_approval: settings.require_comment_approval,
    },
    { status: 201 }
  )
}
