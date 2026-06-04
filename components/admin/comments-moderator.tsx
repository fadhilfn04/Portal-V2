'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Trash2, Clock, MessageSquare, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/format-date'
import { cn } from '@/lib/utils/cn'

interface CommentWithArticle {
  id: string
  name: string
  email: string | null
  content: string
  status: string
  created_at: string
  articles: { title: string; slug: string } | null
}

interface CommentsModerator {
  pending: CommentWithArticle[]
  approved: CommentWithArticle[]
}

export function CommentsModerator({ pending: initialPending, approved: initialApproved }: CommentsModerator) {
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [processing, setProcessing] = useState<string | null>(null)

  const moderateComment = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: action !== 'delete' ? JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected'
        }) : undefined,
      })

      if (!res.ok) throw new Error()

      if (action === 'approve') {
        const comment = pending.find((c) => c.id === id)
        if (comment) {
          setPending((p) => p.filter((c) => c.id !== id))
          setApproved((a) => [{ ...comment, status: 'approved' }, ...a])
        }
        toast.success('Komentar disetujui')
      } else if (action === 'reject') {
        setPending((p) => p.filter((c) => c.id !== id))
        toast.success('Komentar ditolak')
      } else {
        setPending((p) => p.filter((c) => c.id !== id))
        setApproved((a) => a.filter((c) => c.id !== id))
        toast.success('Komentar dihapus')
      }
    } catch {
      toast.error('Gagal memproses komentar')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-amber-500" />
          <h2 className="text-base font-bold text-neutral-900 font-heading">
            Menunggu Persetujuan
          </h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-150 rounded-xl text-sm text-neutral-500">
            <CheckCircle2 size={18} className="text-success-500" />
            Tidak ada komentar yang menunggu persetujuan.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onApprove={() => moderateComment(comment.id, 'approve')}
                onReject={() => moderateComment(comment.id, 'reject')}
                onDelete={() => moderateComment(comment.id, 'delete')}
                isProcessing={processing === comment.id}
                showActions
              />
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-success-500" />
          <h2 className="text-base font-bold text-neutral-900 font-heading">
            Komentar Disetujui
          </h2>
        </div>

        {approved.length === 0 ? (
          <p className="text-sm text-neutral-400">Belum ada komentar yang disetujui.</p>
        ) : (
          <div className="space-y-3">
            {approved.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onDelete={() => moderateComment(comment.id, 'delete')}
                isProcessing={processing === comment.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentCard({
  comment,
  onApprove,
  onReject,
  onDelete,
  isProcessing,
  showActions = false,
}: {
  comment: CommentWithArticle
  onApprove?: () => void
  onReject?: () => void
  onDelete?: () => void
  isProcessing?: boolean
  showActions?: boolean
}) {
  return (
    <div className={cn(
      'bg-white rounded-xl border p-4 transition-opacity',
      showActions ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-150',
      isProcessing && 'opacity-50 pointer-events-none'
    )}>
      {/* Article ref */}
      {comment.articles && (
        <div className="flex items-center gap-1.5 mb-3 text-xs">
          <span className="text-neutral-400">Pada artikel:</span>
          <a
            href={`/artikel/${comment.articles.slug}`}
            target="_blank"
            className="font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            {comment.articles.title.slice(0, 60)}…
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Author */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white">
                {comment.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold text-neutral-800">{comment.name}</span>
              {comment.email && (
                <span className="ml-2 text-xs text-neutral-400">{comment.email}</span>
              )}
            </div>
            <span className="ml-auto text-xs text-neutral-400">
              {formatDateTime(comment.created_at)}
            </span>
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed pl-9">
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showActions && (
            <>
              <button
                onClick={onApprove}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 text-success-600 hover:bg-success-100 transition-colors"
                title="Setujui"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={onReject}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                title="Tolak"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-error-50 text-error-500 hover:bg-error-100 transition-colors"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
