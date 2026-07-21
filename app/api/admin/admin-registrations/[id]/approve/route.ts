import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Create admin client with service role key
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Approve a pending admin registration (super_admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super_admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 })
    }

    // Check if target user exists and is a pending admin
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('role, is_approved, full_name')
      .eq('id', id)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.role !== 'admin') {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 })
    }

    if (targetProfile.is_approved) {
      return NextResponse.json({ error: 'User is already approved' }, { status: 400 })
    }

    // Approve the admin - use admin client to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error approving admin:', updateError)
      return NextResponse.json({ error: 'Failed to approve admin' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Admin ${targetProfile.full_name} berhasil disetujui.`,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/admin-registrations/[id]/approve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
