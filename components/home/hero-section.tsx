import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Eye } from 'lucide-react'
import { CategoryBadge } from '@/components/shared/category-badge'
import { formatDate } from '@/lib/utils/format-date'
import type { ArticleListItem } from '@/lib/types'

interface HeroSectionProps {
  featured: ArticleListItem | null
  secondary?: ArticleListItem[]
}

export function HeroSection({ featured, secondary = [] }: HeroSectionProps) {
  if (!featured) return null

  return (
    <section className="py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero — 8 cols */}
          <div className="lg:col-span-8">
            <Link
              href={`/artikel/${featured.slug}`}
              className="group relative block w-full aspect-[16/9] lg:aspect-[16/10] rounded-2xl lg:rounded-3xl overflow-hidden bg-neutral-200 shadow-xl"
            >
              {/* Background image */}
              {featured.cover_image ? (
                <Image
                  src={featured.cover_image}
                  alt={featured.cover_image_alt ?? featured.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-600" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                {/* Category + date */}
                <div className="flex items-center gap-3 mb-3">
                  {featured.category_name && (
                    <CategoryBadge
                      name={featured.category_name}
                      color="#ffffff"
                      size="sm"
                      className="!bg-white/20 !border-white/30 !text-white"
                    />
                  )}
                  <span className="text-white/70 text-xs">
                    {formatDate(featured.published_at)}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3 font-heading text-balance">
                  {featured.title}
                </h1>

                {/* Excerpt */}
                {featured.excerpt && (
                  <p className="hidden sm:block text-white/80 text-sm lg:text-base leading-relaxed mb-4 line-clamp-2">
                    {featured.excerpt}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white/70 text-xs">
                    {featured.author_name && (
                      <span className="font-medium text-white">{featured.author_name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {featured.reading_time} menit baca
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {featured.view_count.toLocaleString('id-ID')} dilihat
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/30 rounded-full px-3.5 py-1.5 transition-colors group-hover:translate-x-0.5 transition-transform">
                    Baca Selengkapnya
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Secondary articles — 4 cols */}
          {secondary.length > 0 && (
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Berita Lainnya
                </h2>
                <Link
                  href="/artikel"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Lihat Semua <ArrowRight size={12} />
                </Link>
              </div>

              {secondary.slice(0, 3).map((article, i) => (
                <Link
                  key={article.id}
                  href={`/artikel/${article.slug}`}
                  className="group flex gap-3.5 p-3.5 bg-white rounded-xl border border-neutral-150 hover:border-brand-200 hover:shadow-sm transition-all"
                >
                  {/* Rank */}
                  <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-sm font-heading">
                    {i + 1}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    {article.category_name && (
                      <span
                        className="text-[11px] font-semibold mb-1 block"
                        style={{ color: article.category_color ?? '#1a3c6e' }}
                      >
                        {article.category_name}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-neutral-800 group-hover:text-brand-600 line-clamp-2 leading-snug transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                      <Clock size={10} />
                      <span>{article.reading_time} mnt</span>
                      <span>·</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {article.cover_image && (
                    <div className="relative shrink-0 w-16 h-14 rounded-lg overflow-hidden bg-neutral-100">
                      <Image
                        src={article.cover_image}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
