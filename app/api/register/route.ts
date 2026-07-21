import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const registerSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
})

type RegisterInput = z.infer<typeof registerSchema>

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join('. ') },
        { status: 400 }
      )
    }

    const { email, password, full_name } = parsed.data

    // Check if user already exists by querying auth.users
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === email)

    if (checkError && !existingUsers) {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Terjadi kesalahan saat memeriksa email.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar.' },
        { status: 409 }
      )
    }

    // Create auth user with admin privileges
    // Note: We need to use the service role for this
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message || 'Gagal membuat pengguna.' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Gagal membuat pengguna. User tidak dibuat.' },
        { status: 500 }
      )
    }

    // Update profile with admin role and pending approval status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'admin',
        is_approved: false,
        registered_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // If profile update fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Gagal mengatur profil admin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Registrasi berhasil. Silakan tunggu persetujuan admin.',
      userId: authData.user.id,
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan tak terduga saat registrasi.' },
      { status: 500 }
    )
  }
}
