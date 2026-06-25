import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { whatsappSubscriberSchema } from '@/lib/validations/whatsapp-subscriber'

// Validation schema for query parameters
const whatsappSubscribersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  source: z.enum(['website', 'manual', 'import']).optional(),
  search: z.string().max(100).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  sort: z.enum(['subscribed_at', 'name', '-subscribed_at', '-name']).default('subscribed_at'),
})


// Helper function to escape special characters for SQL LIKE
function escapeSqlLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authentication check - require authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - only admins and editors can access this endpoint
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const queryParams: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    const validationResult = whatsappSubscribersQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const params = validationResult.data
    const { page, per_page, status, source, search, date_from, date_to, sort } = params

    let query = supabase
      .from('whatsapp_subscribers')
      .select('*', { count: 'exact' })

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Apply source filter (already validated by zod)
    if (source) {
      query = query.eq('source', source)
    }

    // Apply search filter with proper SQL injection protection
    if (search) {
      const sanitizedSearch = escapeSqlLike(search.trim())
      query = query.or(`name.ilike.%${sanitizedSearch}%,phone_number.ilike.%${sanitizedSearch}%`)
    }

    // Apply date range filters (already validated by zod)
    if (date_from) {
      query = query.gte('subscribed_at', date_from)
    }

    if (date_to) {
      query = query.lte('subscribed_at', date_to)
    }

    // Apply sorting with proper validation
    const sortColumn = sort.startsWith('-') ? sort.slice(1) : sort
    const ascending = !sort.startsWith('-')
    query = query.order(sortColumn, { ascending })

    const from = (page - 1) * per_page
    const to = from + per_page - 1

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
      per_page: per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authentication check - require authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - only admins and editors can create subscribers
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const validation = whatsappSubscriberSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { phone_number, name, source } = validation.data

    // Check for duplicate phone number
    const { data: existing } = await supabase
      .from('whatsapp_subscribers')
      .select('id')
      .eq('phone_number', phone_number)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp sudah terdaftar' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('whatsapp_subscribers')
      .insert({
        phone_number,
        name: name || null,
        source: source || 'manual',
        is_active: true,
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subscriber:', error)
      return NextResponse.json(
        { error: 'Failed to create subscriber' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
