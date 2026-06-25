'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Newspaper, Tag, MessageSquare,
  Send, BarChart3, Settings, LogOut, ExternalLink,
  ClipboardCheck, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const BASE_NAV = [
  {
    group: 'Menu Utama',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Artikel', href: '/admin/artikel', icon: Newspaper },
      { label: 'Kategori', href: '/admin/kategori', icon: Tag },
      { label: 'Komentar', href: '/admin/komentar', icon: MessageSquare },
    ],
  },
  {
    group: 'Komunikasi',
    items: [
      { label: 'Broadcast WA', href: '/admin/broadcast', icon: Send },
      { label: 'Subscribers WA', href: '/admin/whatsapp-subscribers', icon: Users },
      { label: 'Analitik', href: '/admin/analitik', icon: BarChart3 },
    ],
  },
  {
    group: 'Pengaturan',
    items: [
      { label: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
    ],
  },
]

interface AdminSidebarProps {
  userRole?: string
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Inject approval link for super_admin under Menu Utama
  const navItems = BASE_NAV.map((group) => {
    if (group.group !== 'Menu Utama' || userRole !== 'super_admin') return group
    return {
      ...group,
      items: [
        ...group.items,
        { label: 'Persetujuan', href: '/admin/approval', icon: ClipboardCheck, exact: false },
      ],
    }
  })

  return (
    <aside className="flex h-full w-64 flex-col bg-brand-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white font-bold text-base font-heading">
          P
        </div>
        <div>
          <p className="font-bold text-white font-heading text-sm leading-none">PeduaTel</p>
          <p className="text-[10px] text-white/50 leading-none mt-0.5 uppercase tracking-wider">Admin Panel</p>
        </div>
      </div>

      {/* View site link */}
      <div className="px-4 py-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
        >
          <span>Lihat Portal</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.group} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-white/15 text-white'
                          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                      )}
                    >
                      <item.icon size={17} />
                      <span>{item.label}</span>
                      {active && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-white"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all"
        >
          <LogOut size={17} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
