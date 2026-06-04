'use client'

import { useState } from 'react'
import { MessageCircle, Clock, ChevronDown, MessageSquareOff, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelative } from '@/lib/utils/format-date'
import { CommentForm } from './comment-form'
import { cn } from '@/lib/utils/cn'
import type { Comment } from '@/lib/types'

interface CommentSectionProps {
  articleId:          string
  initialComments?:   Comment[]
  totalComments?:     number
  enableComments?:    boolean
  requireApproval?:   boolean
}

export function CommentSection({
  articleId,
  initialComments    = [],
  totalComments      = 0,
  enableComments     = true,
  requireApproval    = true,
}: CommentSectionProps) {
  const [comments, setComments]         = useState<Comment[]>(initialComments)
  const [showForm, setShowForm]         = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage]                 = useState(1)
  const [hasMore, setHasMore]           = useState(comments.length < totalComments)

  const handleNewComment = () => {
    setShowForm(false)
  }

  const loadMore = async () => {
    setIsLoadingMore(true)
    try {
      const res = await fetch(`/api/comments?article_id=${articleId}&page=${page + 1}`)
      const data = await res.json()
      if (data.data?.length) {
        setComments((prev) => [...prev, ...data.data])
        setPage((p) => p + 1)
        setHasMore(data.data.length === 10)
      } else {
        setHasMore(false)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <section className="mt-12 pt-8 border-t-2 border-neutral-100">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2.5 text-xl font-bold text-neutral-900 font-heading">
          <MessageCircle size={22} className="text-brand-600" />
          Komentar
          <span className="text-base font-normal text-neutral-400">({totalComments})</span>
        </h2>

        {/* Only show "Tulis Komentar" button when comments are enabled */}
        {enableComments && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
              showForm
                ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            )}
          >
            {showForm ? 'Batal' : 'Tulis Komentar'}
          </button>
        )}
      </div>

      {/* ── Comments disabled notice ───────────────────────── */}
      {!enableComments && (
        <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl mb-6">
          <MessageSquareOff size={18} className="text-neutral-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-neutral-600">Komentar Dinonaktifkan</p>
            <p className="text-sm text-neutral-500 mt-0.5">
              Fitur komentar pada portal ini sedang dinonaktifkan oleh administrator.
            </p>
          </div>
        </div>
      )}

      {/* ── Approval notice (only when enabled + requireApproval) ── */}
      {enableComments && requireApproval && !showForm && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <span className="text-base leading-none">💬</span>
          <p className="text-sm text-amber-800">
            Komentar Anda akan muncul setelah ditinjau dan disetujui oleh moderator.
          </p>
        </div>
      )}

      {/* ── No-approval notice (live comment) ─────────────── */}
      {enableComments && !requireApproval && !showForm && (
        <div className="flex items-center gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-xl mb-6">
          <CheckCircle2 size={16} className="text-green-500 shrink-0" />
          <p className="text-sm text-green-800">
            Komentar Anda akan langsung muncul setelah dikirim.
          </p>
        </div>
      )}

      {/* ── Comment form ─────────────────────────────────────── */}
      <AnimatePresence>
        {enableComments && showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-8"
          >
            <CommentForm
              articleId={articleId}
              requireApproval={requireApproval}
              onSuccess={handleNewComment}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Comment list ─────────────────────────────────────── */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle size={40} className="mx-auto mb-3 text-neutral-200" />
          <p className="text-neutral-500 font-medium">Belum ada komentar</p>
          {enableComments && (
            <>
              <p className="text-sm text-neutral-400 mt-1">Jadilah yang pertama berkomentar</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-5 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                Tulis Komentar
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-brand-400 border-t-transparent rounded-full" />
                  Memuat…
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Muat Komentar Lainnya
                </>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4"
    >
      <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center">
        <span className="text-sm font-bold text-white">
          {comment.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-neutral-50 rounded-2xl rounded-tl-sm p-4 border border-neutral-150">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-neutral-800">{comment.name}</span>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Clock size={11} />
              {formatRelative(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
