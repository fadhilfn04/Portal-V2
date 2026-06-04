import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Clock } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/format-date'
import type { ArticleListItem } from '@/lib/types'

interface RegionalNewsSectionProps {
  articles: ArticleListItem[]
}

const REGIONS = [
  'Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
  'Sumatera', 'Kalimantan', 'Sulawesi', 'Bali & NTB',
]

export function RegionalNewsSection({ articles }: RegionalNewsSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-1.5">
              Regional
            </p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 font-heading">
              Berita Daerah
            </h2>
          </div>
          <Link
            href="/kategori/berita-daerah"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 group transition-colors"
          >
            Lihat Semua
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {articles.slice(0, 4).map((article) => (
            <Link
              key={article.id}
              href={`/artikel/${article.slug}`}
              className="group flex flex-col bg-white rounded-xl border border-neutral-150 overflow-hidden hover:border-brand-200 hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                {article.cover_image ? (
                  <Image
                    src={article.cover_image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                    <MapPin size={32} className="text-brand-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {article.category_name && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={11} style={{ color: article.category_color ?? '#0284c7' }} />
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: article.category_color ?? '#0284c7' }}
                    >
                      {article.category_name}
                    </span>
                  </div>
                )}
                <h3 className="text-sm font-bold text-neutral-800 group-hover:text-brand-600 line-clamp-3 leading-snug transition-colors mb-3">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <Clock size={11} />
                  <span>{article.reading_time} mnt</span>
                  <span>·</span>
                  <span>{formatDateShort(article.published_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile: view all */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/kategori/berita-daerah"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-brand-600 border-2 border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Lihat Semua Berita Daerah <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
