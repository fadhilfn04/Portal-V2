import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Search, Eye, Heart, Clock, Edit, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDateShort } from '@/lib/utils/format-date'
import { ArticleRowActions } from '@/components/admin/article-row-actions'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'Kelola Artikel' }

interface Props {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}

const ITEMS_PER_PAGE = 15

const STATUS_TABS = [
  { label: 'Semua', value: '' },
  { label: 'Terbit', value: 'published' },
  { label: 'Menunggu', value: 'pending_review' },
  { label: 'Draf', value: 'draft' },
  { label: 'Diarsipkan', value: 'archived' },
]

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  published:      { label: 'Terbit',              class: 'bg-green-100 text-green-700' },
  pending_review: { label: 'Menunggu Persetujuan', class: 'bg-amber-100 text-amber-700' },
  draft:          { label: 'Draf',                class: 'bg-neutral-100 text-neutral-500' },
  archived:       { label: 'Diarsipkan',          class: 'bg-neutral-100 text-neutral-500' },
}

export default async function ArticleListPage({ searchParams }: Props) {
  const { status, q, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = await createClient()

  let query = supabase
    .from('articles_with_author')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (status) query = query.eq('status', status)
  if (q?.trim()) query = query.ilike('title', `%${q.trim()}%`)

  const { data: articlesRaw, count } = await query
  const articles = articlesRaw ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const buildHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (q) p.set('q', q)
    if (currentPage > 1) p.set('page', String(currentPage))
    Object.entries(overrides).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const str = p.toString()
    return `/admin/artikel${str ? `?${str}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Kelola Artikel</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} artikel ditemukan</p>
        </div>
        <Link
          href="/admin/artikel/baru"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tulis Artikel
        </Link>
      </div>

      {/* Status tabs + Search */}
      <div className="bg-white rounded-2xl border border-neutral-150">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 gap-4 flex-wrap">
          {/* Status tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={buildHref({ status: tab.value, page: '' })}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  (status ?? '') === tab.value
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Search */}
          <form className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari judul artikel…"
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white transition-all"
            />
          </form>
        </div>

        {/* Table */}
        {articles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 font-medium">Tidak ada artikel ditemukan</p>
            <Link href="/admin/artikel/baru" className="mt-3 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
              <Plus size={14} /> Tulis artikel pertama
            </Link>
          </div>
        ) : (
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
                {(articles as any[]).map((article) => {
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
                            style={{ backgroundColor: `${article.category_color}18`, color: article.category_color }}
                          >
                            {article.category_name}
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', badge.class)}>
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              Menampilkan {offset + 1}–{Math.min(offset + ITEMS_PER_PAGE, total)} dari {total}
            </p>
            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <Link href={buildHref({ page: String(currentPage - 1) })}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  ← Sebelumnya
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1
                return (
                  <Link key={p} href={buildHref({ page: String(p) })}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center text-xs font-medium rounded-lg transition-colors',
                      p === currentPage ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    )}>
                    {p}
                  </Link>
                )
              })}
              {currentPage < totalPages && (
                <Link href={buildHref({ page: String(currentPage + 1) })}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  Berikutnya →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
