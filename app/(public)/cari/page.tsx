import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/article/article-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Search } from 'lucide-react'
import type { ArticleListItem } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Pencarian',
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let articles: ArticleListItem[] = []
  let total = 0

  if (query.length >= 2) {
    const supabase = await createClient()
    const { data, count } = await supabase
      .from('articles_with_author')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .textSearch('search_vector', query, { type: 'websearch', config: 'indonesian' })
      .order('published_at', { ascending: false })
      .limit(24)

    articles = (data as ArticleListItem[]) ?? []
    total = count ?? 0
  }

  return (
    <div className="py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Search header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 font-heading mb-2">
            {query ? (
              <>
                Hasil pencarian untuk{' '}
                <span className="text-brand-600">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              'Cari Artikel'
            )}
          </h1>
          {query && (
            <p className="text-neutral-500">
              Ditemukan {total} artikel
            </p>
          )}
        </div>

        {/* Search input */}
        <form className="mb-10">
          <div className="relative max-w-2xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari judul, kategori, atau konten artikel…"
              className="w-full h-14 pl-12 pr-4 text-base rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 shadow-sm transition-all"
              autoFocus={!query}
            />
          </div>
        </form>

        {/* Results */}
        {!query ? (
          <EmptyState
            icon={Search}
            title="Masukkan kata kunci"
            description="Cari berita, kegiatan, dan informasi dari seluruh arsip portal PeduaTel."
          />
        ) : articles.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`Tidak ada hasil untuk "${query}"`}
            description="Coba kata kunci lain atau telusuri berdasarkan kategori."
            action={
              <a
                href="/artikel"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-600 border-2 border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
              >
                Lihat Semua Artikel
              </a>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
