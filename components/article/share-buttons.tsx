'use client'

import { useState } from 'react'
import { Link2, Facebook, Twitter, MessageCircle, Check, Share2, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface ShareButtonsProps {
  url: string
  title: string
  excerpt?: string
  /** sidebar = vertical full-width (default) | inline = horizontal compact */
  variant?: 'sidebar' | 'inline'
  className?: string
}

export function ShareButtons({
  url,
  title,
  excerpt,
  variant = 'sidebar',
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const fullUrl  = url.startsWith('http') ? url : `${siteUrl}${url}`
  const encUrl   = encodeURIComponent(fullUrl)
  const encTitle = encodeURIComponent(title)
  const encText  = encodeURIComponent(excerpt ?? title)

  const PLATFORMS = [
    {
      key:   'whatsapp',
      label: 'WhatsApp',
      color: '#25D366',
      bg:    '#f0fdf4',
      Icon:  MessageCircle,
      href:  `https://wa.me/?text=${encTitle}%0A%0A${encUrl}`,
    },
    {
      key:   'facebook',
      label: 'Facebook',
      color: '#1877F2',
      bg:    '#eff6ff',
      Icon:  Facebook,
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    },
    {
      key:   'twitter',
      label: 'X / Twitter',
      color: '#000000',
      bg:    '#f9fafb',
      Icon:  Twitter,
      href:  `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`,
    },
    {
      key:   'telegram',
      label: 'Telegram',
      color: '#2AABEE',
      bg:    '#eff8ff',
      Icon:  Send,
      href:  `https://t.me/share/url?url=${encUrl}&text=${encText}`,
    },
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('Tautan berhasil disalin!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Gagal menyalin tautan')
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !('share' in navigator)) return
    try {
      await navigator.share({ title, text: excerpt ?? title, url: fullUrl })
    } catch {}
  }

  // ── Inline variant ─────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mr-1">
          Bagikan:
        </span>

        {PLATFORMS.map(({ key, label, color, bg, Icon, href }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bagikan ke ${label}`}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
            style={{
              backgroundColor: hoveredKey === key ? bg : 'white',
              borderColor:     hoveredKey === key ? color : '#e2e5eb',
              color:           hoveredKey === key ? color : '#6b7591',
            }}
          >
            <Icon size={13} />
            {label}
          </a>
        ))}

        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
            copied
              ? 'bg-green-50 border-green-400 text-green-600'
              : 'bg-white border-neutral-200 text-neutral-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600'
          )}
          aria-label="Salin tautan"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check size={13} />
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Link2 size={13} />
              </motion.span>
            )}
          </AnimatePresence>
          {copied ? 'Tersalin!' : 'Salin'}
        </button>
      </div>
    )
  }

  // ── Sidebar variant (default) ──────────────────────────────
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
        Bagikan Artikel
      </p>

      {/* Platform list */}
      <div className="space-y-1.5">
        {PLATFORMS.map(({ key, label, color, bg, Icon, href }) => {
          const isHovered = hoveredKey === key
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Bagikan ke ${label}`}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl border transition-all duration-200 group"
              style={{
                backgroundColor: isHovered ? bg : 'transparent',
                borderColor:     isHovered ? `${color}40` : '#e2e5eb',
              }}
            >
              {/* Icon bubble */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: isHovered ? color : `${color}15`,
                  color:           isHovered ? 'white' : color,
                }}
              >
                <Icon size={15} />
              </div>

              {/* Label */}
              <span
                className="flex-1 text-sm font-semibold transition-colors duration-200"
                style={{ color: isHovered ? color : '#4e566c' }}
              >
                {label}
              </span>

              {/* Arrow */}
              <svg
                className="h-3.5 w-3.5 transition-all duration-200"
                style={{
                  color:     isHovered ? color : '#cdd2dc',
                  transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6l6 6-6 6" />
              </svg>
            </a>
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-100" />

      {/* Copy link button */}
      <button
        onClick={handleCopy}
        className={cn(
          'flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl border transition-all duration-200',
          copied
            ? 'bg-green-50 border-green-300'
            : 'border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
        )}
        aria-label="Salin tautan artikel"
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
            copied ? 'bg-green-500' : 'bg-neutral-100'
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Check size={15} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Link2 size={15} className="text-neutral-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className={cn('flex-1 text-sm font-semibold text-left transition-colors', copied ? 'text-green-700' : 'text-neutral-600')}>
          {copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan'}
        </span>

        {!copied && (
          <span className="text-[10px] font-mono text-neutral-300 bg-neutral-100 px-1.5 py-0.5 rounded hidden sm:block">
            URL
          </span>
        )}
      </button>

      {/* Native share — mobile only */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all duration-200"
          aria-label="Bagikan via sistem"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
            <Share2 size={15} className="text-neutral-500" />
          </div>
          <span className="flex-1 text-sm font-semibold text-neutral-600 text-left">
            Bagikan via Lainnya
          </span>
        </button>
      )}
    </div>
  )
}
