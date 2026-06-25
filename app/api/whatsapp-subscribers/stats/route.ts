import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      totalRes,
      activeRes,
      inactiveRes,
      newThisMonthRes,
    ] = await Promise.all([
      supabase.from('whatsapp_subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('whatsapp_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('whatsapp_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', false),
      supabase.from('whatsapp_subscribers').select('id', { count: 'exact', head: true }).gte('subscribed_at', startOfMonth),
    ])

    return NextResponse.json({
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      inactive: inactiveRes.count ?? 0,
      newThisMonth: newThisMonthRes.count ?? 0,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
