import { createClient } from '@/lib/supabase/server'

export function generateBroadcastMessage(article: {
  title: string
  excerpt?: string | null
  slug: string
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.peduatel.id'
  const url = `${siteUrl}/artikel/${article.slug}`
  const lines: string[] = [
    '📢 *Berita Terbaru PeduaTel*',
    '',
    `*${article.title}*`,
  ]
  if (article.excerpt) {
    const excerpt = article.excerpt.length > 200
      ? article.excerpt.slice(0, 200) + '…'
      : article.excerpt
    lines.push('', excerpt)
  }
  lines.push('', '📖 Baca Selengkapnya:', url, '', '_Portal PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia_')
  return lines.join('\n')
}

export function normalizePhone(phone: string): string {
  if (phone.startsWith('+')) return phone.slice(1)   // +628xxx → 628xxx
  if (phone.startsWith('08')) return '62' + phone.slice(1) // 08xxx → 628xxx
  return phone                                         // already 628xxx
}

interface Subscriber { phone_number: string }

interface SendResult { sentCount: number; failedCount: number; errors: string[] }

export async function sendWhatsAppMessages(
  subscribers: Subscriber[],
  message: string,
  gateway: string,
): Promise<SendResult> {
  // Fonnte supports bulk sending in a single request — handle separately
  if (gateway === 'fonnte') {
    return sendViaFonnte(subscribers, message, process.env.WHATSAPP_API_KEY ?? '')
  }

  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL ?? ''
  const apiKey = process.env.WHATSAPP_API_KEY ?? ''
  const senderNumber = process.env.WHATSAPP_SENDER_NUMBER ?? ''

  let sentCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const sub of subscribers) {
    const phone = normalizePhone(sub.phone_number)
    try {
      switch (gateway) {
        case 'waha':
          await sendViaWAHA(phone, message, gatewayUrl, apiKey)
          break
        case 'whapi':
          await sendViaWhapi(phone, message, apiKey, gatewayUrl || undefined)
          break
        case 'meta':
          await sendViaMeta(phone, message, senderNumber, apiKey)
          break
        default:
          // manual — no HTTP call, just count as sent
          sentCount++
          continue
      }
      sentCount++
    } catch (err: unknown) {
      failedCount++
      errors.push(`${phone}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }

  return { sentCount, failedCount, errors }
}

async function sendViaFonnte(
  subscribers: Subscriber[],
  message: string,
  apiKey: string,
): Promise<SendResult> {
  // Fonnte accepts pipe-separated targets in one request — efficient for bulk
  const target = subscribers.map((s) => normalizePhone(s.phone_number)).join('|')

  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: apiKey,  // Fonnte uses token directly, no "Bearer" prefix
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target, message, countryCode: '62' }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || !data.status) {
    return {
      sentCount: 0,
      failedCount: subscribers.length,
      errors: [data.reason ?? data.message ?? `HTTP ${res.status}`],
    }
  }

  return { sentCount: subscribers.length, failedCount: 0, errors: [] }
}

// Called from articles routes when a newly-published article should trigger a broadcast.
// Creates the broadcast_log and—for non-manual gateways—actually sends the messages.
export async function autoBroadcast(
  article: { id: string; title: string; excerpt?: string | null; slug: string },
  userId: string,
  gateway: string,
): Promise<void> {
  const supabase = await createClient()

  const { data: subscribers, count } = await supabase
    .from('whatsapp_subscribers')
    .select('phone_number', { count: 'exact' })
    .eq('is_active', true)

  if (!subscribers?.length) return

  const message = generateBroadcastMessage(article)
  const isManual = gateway === 'manual'

  const { data: log, error: logError } = await supabase
    .from('broadcast_logs')
    .insert({
      article_id: article.id,
      message,
      message_template: message,
      status: isManual ? 'queued' : 'processing',
      recipient_count: count ?? subscribers.length,
      gateway,
      created_by: userId,
    })
    .select('id')
    .single()

  if (logError || !log) return

  if (!isManual) {
    const result = await sendWhatsAppMessages(subscribers, message, gateway)
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
      .eq('id', log.id)
  }
}

async function sendViaWAHA(phone: string, message: string, gatewayUrl: string, apiKey: string) {
  const res = await fetch(`${gatewayUrl}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify({ chatId: `${phone}@c.us`, text: message, session: 'default' }),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function sendViaWhapi(phone: string, message: string, apiKey: string, customUrl?: string) {
  const base = customUrl ?? 'https://gate.whapi.cloud'
  const res = await fetch(`${base}/messages/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ to: phone, body: message }),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function sendViaMeta(phone: string, message: string, senderNumber: string, apiKey: string) {
  const res = await fetch(`https://graph.facebook.com/v18.0/${senderNumber}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    }),
  })
  if (!res.ok) throw new Error(await res.text())
}
