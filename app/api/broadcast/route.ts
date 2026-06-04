import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const broadcastSchema = z.object({
  article_id: z.string().uuid(),
  gateway: z.enum(['manual', 'waha', 'whapi', 'meta']).default('manual'),
  scheduled_at: z.string().optional(),
})

// Generate WhatsApp message template from article
function generateBroadcastMessage(article: {
  title: string
  excerpt?: string | null
  slug: string
  category_name?: string | null
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.peduatel.id'
  const articleUrl = `${siteUrl}/artikel/${article.slug}`

  return [
    '📢 *Berita Terbaru PeduaTel*',
    '',
    `*${article.title}*`,
    '',
    article.excerpt ? article.excerpt.slice(0, 200) + (article.excerpt.length > 200 ? '…' : '') : '',
    '',
    `📖 Baca Selengkapnya:`,
    articleUrl,
    '',
    '_Portal PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia_',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

export async function POST(req: NextRequest) {
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

  const body = await req.json()
  const parsed = broadcastSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { article_id, gateway, scheduled_at } = parsed.data

  // Fetch article for message generation
  const { data: article } = await supabase
    .from('articles_with_author')
    .select('title, excerpt, slug, category_name')
    .eq('id', article_id)
    .single()

  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })

  const messageTemplate = generateBroadcastMessage(article)

  // Count active subscribers
  const { count: recipientCount } = await supabase
    .from('whatsapp_subscribers')
    .select('id', { count: 'exact' })
    .eq('is_active', true)

  // Create broadcast log
  const { data: broadcastLog, error } = await supabase
    .from('broadcast_logs')
    .insert({
      article_id,
      message: messageTemplate,
      message_template: messageTemplate,
      status: 'queued',
      recipient_count: recipientCount ?? 0,
      gateway,
      scheduled_at: scheduled_at ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If gateway is 'manual', keep as queued — admin copies the message manually
  // For other gateways, this is where you'd call the WhatsApp API:
  //
  // switch (gateway) {
  //   case 'waha':
  //     await sendViaWAHA(messageTemplate, subscribers)
  //     break
  //   case 'whapi':
  //     await sendViaWhapi(messageTemplate, subscribers)
  //     break
  //   case 'meta':
  //     await sendViaMetaBusiness(messageTemplate, subscribers)
  //     break
  // }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'broadcast',
    resource_type: 'broadcast',
    resource_id: broadcastLog.id,
    details: { article_id, gateway, recipient_count: recipientCount },
  })

  return NextResponse.json({
    data: {
      broadcast_id: broadcastLog.id,
      message_template: messageTemplate,
      recipient_count: recipientCount ?? 0,
      status: broadcastLog.status,
    },
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('broadcast_logs')
    .select('*, articles(title, slug)')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
