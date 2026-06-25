import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '10')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const sort = searchParams.get('sort') || 'subscribed_at'

    if (page < 1 || perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('whatsapp_subscribers')
      .select('*', { count: 'exact' })

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (source) {
      query = query.eq('source', source)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    if (dateFrom) {
      query = query.gte('subscribed_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('subscribed_at', dateTo)
    }

    const sortColumn = sort === 'name' ? 'name' : 'subscribed_at'
    const sortOrder = sort === 'name' || sort === 'subscribed_at' ? true : false
    query = query.order(sortColumn, { ascending: sortOrder })

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error('Error fetching subscribers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
