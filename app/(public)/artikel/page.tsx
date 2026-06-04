import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/article/article-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CategoryBadge } from '@/components/shared/category-badge'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import type { ArticleListItem } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Semua Berita',
  description: 'Baca semua berita, informasi, dan kegiatan terbaru dari PeduaTel.',
}

export const revalidate = 120

interface ArticleListPageProps {
  searchParams: Promise<{ kategori?: string; halaman?: string }>
}

const ITEMS_PER_PAGE = 12

export default async function ArticleListPage({ searchParams }: ArticleListPageProps) {
  const { kategori, halaman } = await searchParams
  const page = Number(halaman ?? 1)
  const offset = (page - 1) * ITEMS_PER_PAGE

  const supabase = await createClient()

  const [categoriesRes, articlesRes] = await Promise.all([
    supabase
      .from('categories')
      .select()
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('articles_with_author')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)
      .then(async (res) => {
        if (kategori && !res.error) {
          return supabase
            .from('articles_with_author')
            .select('*', { count: 'exact' })
            .eq('status', 'published')
            .eq('category_slug', kategori)
            .order('published_at', { ascending: false })
            .range(offset, offset + ITEMS_PER_PAGE - 1)
        }
        return res
      }),
  ])

  const articles = (articlesRes.data as ArticleListItem[]) ?? []
  const total = articlesRes.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const categories = categoriesRes.data ?? []
  const activeCategory = categories.find((c) => c.slug === kategori)

  return (
    <div className="py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 font-heading mb-2">
            {activeCategory ? activeCategory.name : 'Semua Berita'}
          </h1>
          <p className="text-neutral-500">
            {total} artikel {activeCategory ? `dalam kategori ${activeCategory.name}` : 'tersedia'}
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-8 pb-6 border-b border-neutral-150">
          <Link
            href="/artikel"
            className={`px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
              !kategori
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Semua
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/artikel?kategori=${cat.slug}`}
              className={`px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                kategori === cat.slug
                  ? 'text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              style={
                kategori === cat.slug
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Articles grid */}
        {articles.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Belum ada artikel"
            description="Artikel akan segera hadir. Pantau terus portal kami."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {articles.map((article, i) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  priority={i < 4}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {page > 1 && (
                  <Link
                    href={`/artikel?${kategori ? `kategori=${kategori}&` : ''}halaman=${page - 1}`}
                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    ← Sebelumnya
                  </Link>
                )}

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Link
                        key={pageNum}
                        href={`/artikel?${kategori ? `kategori=${kategori}&` : ''}halaman=${pageNum}`}
                        className={`flex h-9 w-9 items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                          pageNum === page
                            ? 'bg-brand-600 text-white'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>

                {page < totalPages && (
                  <Link
                    href={`/artikel?${kategori ? `kategori=${kategori}&` : ''}halaman=${page + 1}`}
                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Berikutnya →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
