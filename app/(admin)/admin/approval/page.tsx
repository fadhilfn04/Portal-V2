import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ClipboardCheck, Eye, Calendar, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDateShort } from '@/lib/utils/format-date'
import { ApprovalActions } from '@/components/admin/approval-actions'

export const metadata: Metadata = { title: 'Persetujuan Artikel' }

export default async function ApprovalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/admin')

  const { data: articlesRaw } = await supabase
    .from('articles_with_author')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  const articles = articlesRaw ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <ClipboardCheck size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-heading">Persetujuan Artikel</h1>
          <p className="text-sm text-neutral-500">
            {articles.length === 0
              ? 'Tidak ada artikel yang menunggu persetujuan'
              : `${articles.length} artikel menunggu persetujuan Anda`}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 mb-4">
            <ClipboardCheck size={28} className="text-green-500" />
          </div>
          <h3 className="text-base font-semibold text-neutral-700 mb-1">Semua beres!</h3>
          <p className="text-sm text-neutral-400">Tidak ada artikel yang perlu ditinjau saat ini.</p>
        </div>
      )}

      {/* Article list */}
      {articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article: any) => (
            <div
              key={article.id}
              className="bg-white rounded-2xl border border-neutral-150 p-5 shadow-sm space-y-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                      Menunggu Persetujuan
                    </span>
                    {article.category_name && (
                      <span className="text-xs text-neutral-400">{article.category_name}</span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 leading-snug">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                </div>

                {/* Preview link - disabled for pending articles */}
                <div className="flex items-center gap-1.5 shrink-0 text-xs text-neutral-300">
                  <ExternalLink size={13} />
                  <span>Preview tersedia setelah disetujui</span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold" style={{ fontSize: 9 }}>
                    {(article.author_name ?? 'T').charAt(0)}
                  </div>
                  <span className="font-medium text-neutral-600">{article.author_name ?? 'Tim Redaksi'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Diajukan {formatDateShort(article.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={12} />
                  <span>{article.reading_time} menit baca</span>
                </div>
              </div>

              {/* Actions */}
              <ApprovalActions articleId={article.id} articleTitle={article.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
