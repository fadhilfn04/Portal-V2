'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { commentSchema, type CommentFormData } from '@/lib/validations/comment'
import { cn } from '@/lib/utils/cn'
import type { Comment } from '@/lib/types'

interface CommentFormProps {
  articleId:       string
  requireApproval?: boolean
  onSuccess?:      (newComment?: Comment) => void
}

export function CommentForm({ articleId, requireApproval = true, onSuccess }: CommentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  const onSubmit = async (values: CommentFormData) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, article_id: articleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Use the message that matches the actual server setting
      const msg = data.requires_approval
        ? 'Komentar terkirim! Akan tampil setelah disetujui moderator.'
        : 'Komentar berhasil dikirim dan langsung tampil!'
      toast.success(msg)
      reset()
      onSuccess?.(data.requires_approval ? undefined : (data.data as Comment))
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal mengirim komentar. Silakan coba lagi.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
      <h3 className="text-base font-bold text-neutral-900 mb-4 font-heading">Tulis Komentar</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5" htmlFor="comment-name">
            Nama <span className="text-accent-500">*</span>
          </label>
          <input
            id="comment-name"
            type="text"
            placeholder="Nama Anda"
            {...register('name')}
            className={cn(
              'w-full h-10 px-3.5 rounded-lg border text-sm text-neutral-900 placeholder-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
              errors.name
                ? 'border-error-500 bg-error-50'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            )}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-error-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5" htmlFor="comment-email">
            Email <span className="text-neutral-400">(opsional)</span>
          </label>
          <input
            id="comment-email"
            type="email"
            placeholder="email@contoh.com"
            {...register('email')}
            className={cn(
              'w-full h-10 px-3.5 rounded-lg border text-sm text-neutral-900 placeholder-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
              errors.email
                ? 'border-error-500 bg-error-50'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-error-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-neutral-600 mb-1.5" htmlFor="comment-content">
          Komentar <span className="text-accent-500">*</span>
        </label>
        <textarea
          id="comment-content"
          rows={4}
          placeholder="Tulis komentar Anda di sini…"
          {...register('content')}
          className={cn(
            'w-full px-3.5 py-3 rounded-lg border text-sm text-neutral-900 placeholder-neutral-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all',
            errors.content
              ? 'border-error-500 bg-error-50'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          )}
        />
        {errors.content && (
          <p className="mt-1 text-xs text-error-600">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400 max-w-xs">
          {requireApproval
            ? 'Komentar akan ditampilkan setelah disetujui oleh moderator.'
            : 'Komentar akan langsung ditampilkan setelah dikirim.'}
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mengirim…
            </>
          ) : (
            <>
              <Send size={16} />
              Kirim Komentar
            </>
          )}
        </button>
      </div>
    </form>
  )
}
