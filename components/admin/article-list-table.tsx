'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Eye, Heart, Clock, ExternalLink } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/format-date'
import { ArticleRowActions } from '@/components/admin/article-row-actions'
import { RejectionReasonModal } from '@/components/admin/rejection-reason-modal'
import { cn } from '@/lib/utils/cn'

interface Article {
  id: string
  title: string
  excerpt: string | null
  cover_image: string | null
  category_name: string | null
  category_color: string | null
  status: string
  is_featured: boolean
  view_count: number
  like_count: number
  reading_time: number
  published_at: string | null
  created_at: string
  slug: string
  rejection_reason: string | null
}

interface ArticleListTableProps {
  articles: Article[]
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  published:      { label: 'Terbit',              class: 'bg-green-100 text-green-700' },
  pending_review: { label: 'Menunggu Persetujuan', class: 'bg-amber-100 text-amber-700' },
  rejected:       { label: 'Ditolak',             class: 'bg-red-100 text-red-700 cursor-pointer hover:bg-red-200' },
  draft:          { label: 'Draf',                class: 'bg-neutral-100 text-neutral-500' },
  archived:       { label: 'Diarsipkan',          class: 'bg-neutral-100 text-neutral-500' },
}

export function ArticleListTable({ articles }: ArticleListTableProps) {
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean
    reason: string | null
    articleTitle: string
  }>({ isOpen: false, reason: null, articleTitle: '' })

  const showRejectionReason = (article: Article) => {
    setRejectionModal({
      isOpen: true,
      reason: article.rejection_reason,
      articleTitle: article.title,
    })
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-1/2">Artikel</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Statistik</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">Tanggal</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {articles.map((article) => {
              const badge = STATUS_BADGE[article.status] ?? STATUS_BADGE.draft
              return (
                <tr key={article.id} className="hover:bg-neutral-25 group transition-colors">
                  {/* Title + thumbnail */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      {article.cover_image && (
                        <div className="hidden sm:block relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
                          <img
                            src={article.cover_image}
                            alt={article.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-800 line-clamp-2 leading-snug">
                          {article.title}
                        </p>
                        {article.excerpt && (
                          <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{article.excerpt}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {article.category_name ? (
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                        style={{ backgroundColor: `${article.category_color ?? '#1a3c6e'}18`, color: article.category_color ?? '#1a3c6e' }}
                      >
                        {article.category_name}
                      </span>
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span
                      className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', badge.class)}
                      onClick={() => article.status === 'rejected' && showRejectionReason(article)}
                    >
                      {badge.label}
                    </span>
                    {article.is_featured && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase">
                        Unggulan
                      </span>
                    )}
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {article.view_count.toLocaleString('id-ID')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {article.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {article.reading_time}m
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-neutral-400">
                    {formatDateShort(article.published_at ?? article.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <ArticleRowActions
                      articleId={article.id}
                      slug={article.slug}
                      status={article.status}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, reason: null, articleTitle: '' })}
        reason={rejectionModal.reason}
        articleTitle={rejectionModal.articleTitle}
      />
    </>
  )
}
