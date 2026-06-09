import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Articles that have event_date set are treated as calendar events
const EVENT_SELECT =
  'id,title,slug,excerpt,cover_image,is_featured,category_name,category_slug,category_color,event_date,event_end_date,event_time,event_end_time,event_location'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const now = new Date()
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles_with_author')
    .select(EVENT_SELECT)
    .eq('status', 'published')
    .not('event_date', 'is', null)
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
