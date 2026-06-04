import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBroadcastMessage, sendWhatsAppMessages } from '@/lib/utils/whatsapp'
import { z } from 'zod'

const broadcastSchema = z.object({
  article_id: z.string().uuid(),
  gateway: z.enum(['manual', 'fonnte', 'waha', 'whapi', 'meta']).default('manual'),
  scheduled_at: z.string().optional(),
})

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

  // Fetch subscriber list for actual sending
  const { data: subscribers } = await supabase
    .from('whatsapp_subscribers')
    .select('phone_number')
    .eq('is_active', true)

  const isManual = gateway === 'manual'

  // Create broadcast log
  const { data: broadcastLog, error } = await supabase
    .from('broadcast_logs')
    .insert({
      article_id,
      message: messageTemplate,
      message_template: messageTemplate,
      status: isManual ? 'queued' : 'processing',
      recipient_count: recipientCount ?? 0,
      gateway,
      scheduled_at: scheduled_at ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For non-manual gateways, send immediately and update log
  let sentCount = 0
  let failedCount = 0
  if (!isManual && subscribers?.length) {
    const result = await sendWhatsAppMessages(subscribers, messageTemplate, gateway)
    sentCount = result.sentCount
    failedCount = result.failedCount

    await supabase
      .from('broadcast_logs')
      .update({
        status: result.failedCount === subscribers.length ? 'failed' : 'sent',
        sent_count: result.sentCount,
        failed_count: result.failedCount,
        sent_at: new Date().toISOString(),
        ...(result.errors.length > 0 && {
          error_message: result.errors.slice(0, 10).join('; '),
        }),
      })
      .eq('id', broadcastLog.id)
  }

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
      status: isManual ? 'queued' : (failedCount === (subscribers?.length ?? 0) ? 'failed' : 'sent'),
      sent_count: sentCount,
      failed_count: failedCount,
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
