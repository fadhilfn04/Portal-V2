'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ApprovalActionsProps {
  articleId: string
  articleTitle: string
}

export function ApprovalActions({ articleId, articleTitle }: ApprovalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')

  const approve = async () => {
    setLoading('approve')
    try {
      const res = await fetch(`/api/articles/${articleId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Artikel disetujui dan telah diterbitkan.')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyetujui artikel.')
    } finally {
      setLoading(null)
    }
  }

  const reject = async () => {
    if (!reason.trim()) { toast.warning('Tulis alasan penolakan terlebih dahulu.'); return }
    setLoading('reject')
    try {
      const res = await fetch(`/api/articles/${articleId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Artikel dikembalikan ke penulis.')
      setShowRejectForm(false)
      setReason('')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menolak artikel.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {!showRejectForm ? (
        <div className="flex gap-2">
          <button
            onClick={approve}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Setujui
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle size={12} />
            Tolak
          </button>
        </div>
      ) : (
        <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-semibold text-red-800">Alasan penolakan untuk &ldquo;{articleTitle}&rdquo;:</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Tulis alasan penolakan yang jelas untuk penulis…"
            className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-white focus:outline-none focus:border-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={reject}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'reject' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              Kirim Penolakan
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setReason('') }}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
