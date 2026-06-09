'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Search, Menu, X, ChevronDown, Bell, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { Category } from '@/lib/types'

const NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  {
    label: 'Berita',
    href: '/artikel',
    children: [
      { label: 'Berita Pusat', href: '/kategori/berita-pusat' },
      { label: 'Berita Daerah', href: '/kategori/berita-daerah' },
      { label: 'Pengumuman', href: '/kategori/pengumuman' },
      { label: 'Semua Berita', href: '/artikel' },
    ],
  },
  {
    label: 'Kegiatan',
    href: '/kategori/kegiatan',
    children: [
      { label: 'Olahraga', href: '/kategori/olahraga' },
      { label: 'Sosial', href: '/kategori/sosial' },
      { label: 'Kegiatan', href: '/kategori/kegiatan' },
    ],
  },
  { label: 'Kesehatan', href: '/kategori/kesehatan' },
  { label: 'Dapen Telkom', href: '/kategori/dapen-telkom' },
  { label: 'Tentang', href: '/tentang' },
]

interface HeaderProps {
  categories?: Category[]
}

export function Header({ categories }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus()
  }, [isSearchOpen])

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/cari?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <>
      {/* Announcement bar */}
      {/* <div className="bg-brand-600 text-white text-center py-2 px-4 text-sm font-medium">
        Portal Resmi Persatuan Pensiunan Telekomunikasi Indonesia (PeduaTel)
      </div> */}

      <header
        className={cn(
          'sticky top-0 z-[200] w-full transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-neutral-150'
            : 'bg-white border-b border-neutral-100'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg font-heading">
                P
              </div>
              <div className="hidden sm:block">
                <span className="block text-sm font-bold text-brand-600 font-heading leading-none">
                  PeduaTel
                </span>
                <span className="block text-[10px] text-neutral-500 leading-none mt-0.5 tracking-wide">
                  PORTAL PENSIUNAN TELKOM
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative">
                  {item.children ? (
                    <button
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-50 transition-colors"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={cn(
                          'transition-transform duration-200',
                          openDropdown === item.label && 'rotate-180'
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}

                  {/* Dropdown */}
                  <AnimatePresence>
                    {item.children && openDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-white shadow-lg border border-neutral-150 overflow-hidden py-1"
                        onMouseEnter={() => setOpenDropdown(item.label)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* SIPATEL Button */}
              <a
                href="https://sipatel.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                <span>SIPATEL</span>
                <ExternalLink size={14} className="opacity-80" />
              </a>

              {/* Search toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-brand-600 transition-colors"
                aria-label="Cari artikel"
              >
                <Search size={18} />
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Menu"
              >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search bar — expands below nav */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-3"
              >
                <form onSubmit={handleSearch} className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari artikel, berita, kegiatan…"
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category bar (quick links) */}
        <div className="border-t border-neutral-100 bg-neutral-25 overflow-x-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-2 whitespace-nowrap">
              <span className="text-xs text-neutral-400 font-medium mr-2">Kategori:</span>
              {(categories ?? []).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/kategori/${cat.slug}`}
                  className="px-2.5 py-1 text-xs font-medium rounded-full transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                  }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[190] bg-black/50"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-[195] w-72 bg-white shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-base">
                    P
                  </div>
                  <span className="font-bold text-brand-600 font-heading">PeduaTel</span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center px-3 py-3 text-base font-medium text-neutral-800 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* SIPATEL Button in mobile menu */}
                <div className="pt-4 mt-4 border-t border-neutral-100">
                  <a
                    href="https://sipatel.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-sm"
                  >
                    <span>SIPATEL</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
