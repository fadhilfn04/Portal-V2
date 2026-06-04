import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticleCard } from '@/components/article/article-card'
import type { ArticleListItem } from '@/lib/types'

interface LatestNewsSectionProps {
  articles: ArticleListItem[]
}

export function LatestNewsSection({ articles }: LatestNewsSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-1.5">
              Terkini
            </p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 font-heading">
              Berita Terbaru
            </h2>
          </div>
          <Link
            href="/artikel"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 group transition-colors"
          >
            Lihat Semua Berita
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Featured first article */}
        {articles[0] && (
          <div className="mb-6">
            <ArticleCard
              article={articles[0]}
              priority
              className="lg:hidden"
            />
            {/* Desktop: large first card */}
            <Link
              href={`/artikel/${articles[0].slug}`}
              className="hidden lg:grid grid-cols-12 gap-0 bg-white rounded-2xl border border-neutral-150 overflow-hidden card-hover group"
            >
              <div className="col-span-7 relative aspect-[16/9] bg-neutral-100 overflow-hidden">
                {articles[0].cover_image && (
                  <img
                    src={articles[0].cover_image}
                    alt={articles[0].title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {articles[0].category_name && (
                  <div className="absolute top-4 left-4">
                    <span
                      className="px-2.5 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: articles[0].category_color ?? '#1a3c6e' }}
                    >
                      {articles[0].category_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-span-5 p-7 flex flex-col justify-center">
                <h3 className="text-xl xl:text-2xl font-bold text-neutral-900 group-hover:text-brand-600 leading-snug mb-3 font-heading transition-colors">
                  {articles[0].title}
                </h3>
                {articles[0].excerpt && (
                  <p className="text-sm text-neutral-500 line-clamp-3 leading-relaxed mb-5">
                    {articles[0].excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{articles[0].author_name ?? 'Tim Redaksi'}</span>
                  <span>·</span>
                  <span>{articles[0].reading_time} mnt baca</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Grid of remaining articles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.slice(1, 7).map((article, i) => (
            <ArticleCard
              key={article.id}
              article={article}
              priority={i < 3}
            />
          ))}
        </div>

        {/* Mobile: view all link */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/artikel"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-brand-600 border-2 border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Lihat Semua Berita
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
