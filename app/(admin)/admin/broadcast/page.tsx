'use client'

import { useState } from 'react'
import { Send, Copy, Check, Loader2, MessageCircle, Users, Calendar } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/format-date'

interface ArticleOption {
  id: string
  title: string
  slug: string
  published_at: string
  status: string
}

export default function BroadcastPage() {
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [gateway, setGateway] = useState<'manual' | 'waha' | 'whapi' | 'meta'>('manual')
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: articles = [], isLoading: loadingArticles } = useQuery<ArticleOption[]>({
    queryKey: ['articles', 'published'],
    queryFn: async () => {
      const res = await fetch('/api/articles?status=published&limit=50')
      const json = await res.json()
      return json.data ?? []
    },
  })

  const { data: broadcastLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['broadcast-logs'],
    queryFn: async () => {
      const res = await fetch('/api/broadcast')
      const json = await res.json()
      return json.data ?? []
    },
  })

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: selectedArticleId, gateway }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Gagal membuat broadcast')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setPreview(data.data.message_template)
      toast.success(`Broadcast dibuat! ${data.data.recipient_count} penerima.`)
      refetchLogs()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleCopy = async () => {
    if (!preview) return
    await navigator.clipboard.writeText(preview)
    setCopied(true)
    toast.success('Pesan disalin ke clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const STATUS_COLORS: Record<string, string> = {
    queued: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-neutral-100 text-neutral-600',
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Broadcast WhatsApp</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Kirim berita terbaru kepada seluruh pelanggan WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast composer */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-neutral-150 p-6 space-y-5">
            <h2 className="text-base font-bold text-neutral-900 font-heading flex items-center gap-2">
              <MessageCircle size={18} className="text-green-500" />
              Buat Broadcast
            </h2>

            {/* Article selection */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Pilih Artikel
              </label>
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                disabled={loadingArticles}
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="">-- Pilih artikel yang akan disiarkan --</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>

            {/* Gateway selection */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Gateway WhatsApp
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'manual', label: 'Manual', desc: 'Salin & tempel' },
                    { value: 'waha', label: 'WAHA', desc: 'WhatsApp API' },
                    { value: 'whapi', label: 'Whapi', desc: 'Whapi.cloud' },
                    { value: 'meta', label: 'Meta Business', desc: 'Official API' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGateway(g.value)}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                      gateway === g.value
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    )}
                  >
                    <span className="text-sm font-semibold">{g.label}</span>
                    <span className="text-xs opacity-70">{g.desc}</span>
                    {g.value !== 'manual' && (
                      <span className="mt-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                        Segera Hadir
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {gateway === 'manual' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Mode manual: Sistem akan membuat template pesan yang dapat Anda salin dan kirim secara manual melalui WhatsApp.
              </div>
            )}

            <button
              onClick={() => broadcastMutation.mutate()}
              disabled={!selectedArticleId || broadcastMutation.isPending}
              className="w-full flex items-center justify-center gap-2 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {broadcastMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  <Send size={16} />
                  Buat Broadcast
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-white rounded-2xl border border-neutral-150 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-neutral-900">Preview Pesan</h3>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Tersalin!' : 'Salin Pesan'}
                </button>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <pre className="text-xs text-green-900 whitespace-pre-wrap font-sans leading-relaxed">
                  {preview}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Broadcast history */}
        <div className="bg-white rounded-2xl border border-neutral-150 p-5">
          <h2 className="text-base font-bold text-neutral-900 mb-4 font-heading">Riwayat Broadcast</h2>
          {broadcastLogs.length === 0 ? (
            <div className="text-center py-10 text-neutral-400">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada broadcast</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(broadcastLogs as any[]).map((log: any) => (
                <div key={log.id} className="p-3.5 border border-neutral-150 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-neutral-800 line-clamp-1">
                      {log.articles?.title ?? 'Artikel dihapus'}
                    </p>
                    <span className={cn(
                      'shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
                      STATUS_COLORS[log.status] ?? 'bg-neutral-100 text-neutral-600'
                    )}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {log.recipient_count} penerima
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
