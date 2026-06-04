import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/utils/settings'
import { whatsappSubscribeSchema } from '@/lib/validations/comment'
import { normalizePhone } from '@/lib/utils/whatsapp'

export async function POST(req: NextRequest) {
  const settings = await getSettings()
  if (!settings.enable_whatsapp) {
    return NextResponse.json(
      { error: 'Fitur WhatsApp sedang tidak aktif.' },
      { status: 403 },
    )
  }

  const body = await req.json()
  const parsed = whatsappSubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const phone = normalizePhone(parsed.data.phone_number)
  const supabase = await createClient()

  // Upsert: if already subscribed → re-activate; otherwise insert fresh
  const { error } = await supabase
    .from('whatsapp_subscribers')
    .upsert(
      {
        phone_number: phone,
        name: parsed.data.name || null,
        is_active: true,
        source: 'website',
      },
      { onConflict: 'phone_number' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
