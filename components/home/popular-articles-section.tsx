import Link from 'next/link'
import { TrendingUp, Eye, Heart, Clock } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/format-date'
import type { ArticleListItem } from '@/lib/types'

interface PopularArticlesSectionProps {
  articles: ArticleListItem[]
}

export function PopularArticlesSection({ articles }: PopularArticlesSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="py-10 lg:py-14 bg-neutral-50 border-y border-neutral-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10">
            <TrendingUp size={20} className="text-accent-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-accent-500 uppercase tracking-widest">Trending</p>
            <h2 className="text-2xl font-extrabold text-neutral-900 font-heading leading-none mt-0.5">
              Paling Banyak Dibaca
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.slice(0, 6).map((article, index) => (
            <Link
              key={article.id}
              href={`/artikel/${article.slug}`}
              className="group flex gap-4 p-4 bg-white rounded-xl border border-neutral-150 hover:border-brand-200 hover:shadow-sm transition-all"
            >
              {/* Rank badge */}
              <div
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold font-heading"
                style={{
                  backgroundColor: index < 3 ? '#e31837' : '#f3f4f6',
                  color: index < 3 ? 'white' : '#6b7591',
                }}
              >
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {article.category_name && (
                  <span
                    className="text-[11px] font-semibold mb-1 block"
                    style={{ color: article.category_color ?? '#1a3c6e' }}
                  >
                    {article.category_name}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-neutral-800 group-hover:text-brand-600 line-clamp-2 leading-snug transition-colors mb-2">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {article.view_count > 999
                      ? `${(article.view_count / 1000).toFixed(1)}k`
                      : article.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={11} />
                    {article.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {article.reading_time} mnt
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
