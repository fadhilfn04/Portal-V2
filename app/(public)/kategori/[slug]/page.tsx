import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Newspaper } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/article/article-card'
import { EmptyState } from '@/components/shared/empty-state'
import type { ArticleListItem } from '@/lib/types'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ halaman?: string }>
}

const ITEMS_PER_PAGE = 12

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!category) return { title: 'Kategori Tidak Ditemukan' }

  return {
    title: category.name,
    description: category.description ?? `Baca artikel kategori ${category.name} di Portal PeduaTel.`,
  }
}

export const revalidate = 120

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { halaman } = await searchParams
  const page = Math.max(1, Number(halaman ?? 1))
  const offset = (page - 1) * ITEMS_PER_PAGE

  const supabase = await createClient()

  // Fetch category info + articles in parallel
  const [categoryRes, articlesRes, allCategoriesRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single(),

    supabase
      .from('articles_with_author')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .eq('category_slug', slug)
      .order('published_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1),

    supabase
      .from('categories')
      .select('id, name, slug, color')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  if (!categoryRes.data) notFound()

  const category = categoryRes.data
  const articles = (articlesRes.data as ArticleListItem[]) ?? []
  const total = articlesRes.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const allCategories = allCategoriesRes.data ?? []

  return (
    <div className="py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">Beranda</Link>
          <ChevronRight size={12} className="text-neutral-300" />
          <Link href="/artikel" className="hover:text-brand-600 transition-colors">Berita</Link>
          <ChevronRight size={12} className="text-neutral-300" />
          <span className="text-neutral-400">{category.name}</span>
        </nav>

        {/* Category header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-10 w-1.5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 font-heading">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-neutral-500 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-neutral-400 ml-5">{total} artikel tersedia</p>
        </div>

        {/* Other categories quick nav */}
        <div className="flex items-center gap-2 flex-wrap mb-8 pb-6 border-b border-neutral-150">
          <Link
            href="/artikel"
            className="px-3.5 py-1.5 text-sm font-medium rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            Semua
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/kategori/${cat.slug}`}
              className="px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors"
              style={
                cat.slug === slug
                  ? { backgroundColor: cat.color, color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#4e566c' }
              }
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Articles */}
        {articles.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={`Belum ada artikel di kategori ${category.name}`}
            description="Artikel akan segera hadir. Pantau terus portal kami."
            action={
              <Link
                href="/artikel"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-600 border-2 border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
              >
                Lihat Semua Artikel
              </Link>
            }
          />
        ) : (
          <>
            {/* First article featured */}
            {articles[0] && page === 1 && (
              <div className="mb-6">
                <Link
                  href={`/artikel/${articles[0].slug}`}
                  className="group hidden lg:grid grid-cols-12 gap-0 bg-white rounded-2xl border border-neutral-150 overflow-hidden card-hover"
                >
                  <div className="col-span-7 relative aspect-[16/9] bg-neutral-100 overflow-hidden">
                    {articles[0].cover_image && (
                      <img
                        src={articles[0].cover_image}
                        alt={articles[0].title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="col-span-5 p-7 flex flex-col justify-center">
                    <span
                      className="text-xs font-bold uppercase tracking-wider mb-3 block"
                      style={{ color: category.color }}
                    >
                      {category.name}
                    </span>
                    <h2 className="text-xl xl:text-2xl font-bold text-neutral-900 group-hover:text-brand-600 leading-snug mb-3 font-heading transition-colors">
                      {articles[0].title}
                    </h2>
                    {articles[0].excerpt && (
                      <p className="text-sm text-neutral-500 line-clamp-3 leading-relaxed mb-4">
                        {articles[0].excerpt}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400">
                      {articles[0].author_name ?? 'Tim Redaksi'} · {articles[0].reading_time} mnt baca
                    </p>
                  </div>
                </Link>
                {/* Mobile: show as regular card */}
                <div className="lg:hidden">
                  <ArticleCard article={articles[0]} priority />
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(page === 1 ? articles.slice(1) : articles).map((article, i) => (
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
                    href={`/kategori/${slug}?halaman=${page - 1}`}
                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    ← Sebelumnya
                  </Link>
                )}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1
                    return (
                      <Link
                        key={p}
                        href={`/kategori/${slug}?halaman=${p}`}
                        className={`flex h-9 w-9 items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                          p === page
                            ? 'text-white'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                        style={p === page ? { backgroundColor: category.color } : undefined}
                      >
                        {p}
                      </Link>
                    )
                  })}
                </div>
                {page < totalPages && (
                  <Link
                    href={`/kategori/${slug}?halaman=${page + 1}`}
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
