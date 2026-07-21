import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE - Reject and delete a pending admin registration (super_admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()
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
      return NextResponse.json({ error: 'Cannot reject an approved admin' }, { status: 400 })
    }

    // Delete the auth user (this will cascade delete the profile)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Pendaftaran ${targetProfile.full_name} berhasil ditolak.`,
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/admin-registrations/[id]/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
