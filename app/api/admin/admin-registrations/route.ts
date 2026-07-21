import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Create admin client with service role key
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List pending admin registrations (super_admin only)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Get pending admin registrations (without email from profiles)
    const { data: pendingAdmins, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, registered_at')
      .eq('role', 'admin')
      .eq('is_approved', false)
      .order('registered_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching pending admins:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch pending registrations' }, { status: 500 })
    }

    // Get emails from auth.users for each pending admin
    const adminsWithEmails = await Promise.all(
      (pendingAdmins || []).map(async (admin) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(admin.id)
        return {
          ...admin,
          email: userData.user?.email || '',
        }
      })
    )

    return NextResponse.json({ data: adminsWithEmails })
  } catch (error) {
    console.error('Error in GET /api/admin/admin-registrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
