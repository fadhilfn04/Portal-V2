import { createClient } from '@/lib/supabase/server'
import { whatsappSubscriberUpdateSchema } from '@/lib/validations/whatsapp-subscriber'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Authentication check - require authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - only admins and editors can update subscribers
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

    const validation = whatsappSubscriberUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // If updating phone_number, check for duplicates
    if (validation.data.phone_number) {
      const { data: existing } = await supabase
        .from('whatsapp_subscribers')
        .select('id')
        .eq('phone_number', validation.data.phone_number)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp sudah digunakan oleh subscriber lain' },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_subscribers')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscriber:', error)
      return NextResponse.json(
        { error: 'Failed to update subscriber' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Authentication check - require authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - only admins and editors can delete subscribers
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

    const { error } = await supabase
      .from('whatsapp_subscribers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting subscriber:', error)
      return NextResponse.json(
        { error: 'Failed to delete subscriber' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
