import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/utils/settings'
import { autoBroadcast } from '@/lib/utils/whatsapp'

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Hanya super admin yang dapat menyetujui artikel.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { action, reason } = parsed.data

  const updates =
    action === 'approve'
      ? { status: 'published', published_at: new Date().toISOString(), rejection_reason: null }
      : { status: 'draft', rejection_reason: reason ?? 'Artikel ditolak.' }

  const { data: article, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: action === 'approve' ? 'approve' : 'reject',
    resource_type: 'article',
    resource_id: id,
    details: { title: article.title, reason: reason ?? null },
  })

  if (action === 'approve') {
    const settings = await getSettings()
    if (settings.enable_whatsapp) {
      await autoBroadcast(article, user.id, settings.whatsapp_gateway)
        .catch((err) => console.error('[broadcast] error:', err))
    }
  }

  return NextResponse.json({ data: article })
}
