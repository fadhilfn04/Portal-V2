import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
    redirect('/login?error=no-access')
  }

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar userRole={profile.role} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 bg-white border-b border-neutral-200">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">
              Halo, <span className="font-semibold text-neutral-900">{profile.full_name ?? user.email}</span>
            </span>
            <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {(profile.full_name ?? user.email ?? 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
