import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params
  const headerStore = await headers()

  // Get real IP (supports Vercel, Cloudflare, etc.)
  const ip = (
    headerStore.get('cf-connecting-ip') ??
    headerStore.get('x-real-ip') ??
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1'
  )

  const body = await req.json().catch(() => ({}))
  const fingerprint = body.fingerprint ?? null

  const supabase = await createClient()

  const { data: liked, error } = await supabase.rpc('toggle_like', {
    p_article_id: articleId,
    p_ip_address: ip,
    p_fingerprint: fingerprint,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get updated count
  const { data: article } = await supabase
    .from('articles')
    .select('like_count')
    .eq('id', articleId)
    .single()

  return NextResponse.json({ liked, count: article?.like_count ?? 0 })
}
