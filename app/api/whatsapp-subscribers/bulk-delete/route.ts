import { createClient } from '@/lib/supabase/server'
import { bulkDeleteSchema } from '@/lib/validations/whatsapp-subscriber'
import { NextRequest, NextResponse } from 'next/server'

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

    // Authorization check - only admins and super_admins can delete subscribers
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const validation = bulkDeleteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { ids } = validation.data

    const { data, error } = await supabase
      .from('whatsapp_subscribers')
      .delete()
      .in('id', ids)
      .select('id')

    if (error) {
      console.error('Error bulk deleting subscribers:', error)
      return NextResponse.json(
        { error: 'Failed to delete subscribers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length ?? 0,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
