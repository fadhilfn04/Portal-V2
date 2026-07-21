'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, ExternalLink, Trash2, Eye, EyeOff, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface ArticleRowActionsProps {
  articleId: string
  slug: string
  status: string
}

export function ArticleRowActions({ articleId, slug, status }: ArticleRowActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Hapus artikel ini? Tindakan ini tidak dapat dibatalkan.')) return
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      toast.success('Artikel berhasil dihapus.')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal menghapus artikel.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'published' | 'draft' | 'archived') => {
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      const labels: Record<string, string> = {
        published: 'Artikel diterbitkan.',
        draft:     'Artikel dikembalikan ke draf.',
        archived:  'Artikel diarsipkan.',
      }
      toast.success(labels[newStatus])
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal mengubah status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-40"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl border border-neutral-150 shadow-lg py-1 overflow-hidden">
            <Link
              href={`/admin/artikel/${articleId}/edit`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Edit size={15} className="text-neutral-400" />
              Edit Artikel
            </Link>

            {status === 'published' && (
              <a
                href={`/artikel/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink size={15} className="text-neutral-400" />
                Lihat di Portal
              </a>
            )}

            <div className="h-px bg-neutral-100 my-1" />

            {/* Submit/Resubmit button - only for draft and rejected */}
            {(status === 'draft' || status === 'rejected') && (
              <button
                onClick={() => handleStatusChange('published')}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors"
              >
                <Eye size={15} className="text-green-500" />
                {status === 'rejected' ? 'Ajukan Ulang' : 'Ajukan'}
              </button>
            )}
            {status === 'published' && (
              <button
                onClick={() => handleStatusChange('draft')}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <EyeOff size={15} className="text-amber-500" />
                Kembalikan ke Draf
              </button>
            )}
            {status !== 'archived' && (
              <button
                onClick={() => handleStatusChange('archived')}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                <Archive size={15} className="text-neutral-400" />
                Arsipkan
              </button>
            )}

            <div className="h-px bg-neutral-100 my-1" />

            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} className="text-red-400" />
              Hapus Artikel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
