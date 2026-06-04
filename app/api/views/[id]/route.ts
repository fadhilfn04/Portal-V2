import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params
  const headerStore = await headers()

  const ip = (
    headerStore.get('cf-connecting-ip') ??
    headerStore.get('x-real-ip') ??
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1'
  )
  const userAgent = headerStore.get('user-agent') ?? ''
  const referer = headerStore.get('referer') ?? ''

  const supabase = await createClient()

  // Deduplicate: same IP + article within 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('article_views')
    .select('id', { count: 'exact' })
    .eq('article_id', articleId)
    .eq('ip_address', ip)
    .gte('created_at', fourHoursAgo)

  if ((count ?? 0) === 0) {
    await supabase.from('article_views').insert({
      article_id: articleId,
      ip_address: ip,
      user_agent: userAgent,
      referrer: referer,
    })
    await supabase.rpc('increment_view_count', { p_article_id: articleId })
  }

  return NextResponse.json({ ok: true })
}
