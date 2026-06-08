import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Clock, Calendar, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/utils/settings'
import { CategoryBadge } from '@/components/shared/category-badge'
import { LikeButton } from '@/components/article/like-button'
import { ShareButtons } from '@/components/article/share-buttons'
import { CommentSection } from '@/components/article/comment-section'
import { PhotoCollage } from '@/components/article/image-gallery'
import { ArticleCard } from '@/components/article/article-card'
import { formatDate, formatRelative } from '@/lib/utils/format-date'
import type { ArticleWithRelations, Comment, ArticleListItem } from '@/lib/types'

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles_with_author')
    .select('title, excerpt, cover_image, meta_title, meta_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) return { title: 'Artikel Tidak Ditemukan' }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt || '',
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || '',
      type: 'article',
      images: article.cover_image ? [{ url: article.cover_image }] : [],
    },
  }
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch article
  const { data: article } = await supabase
    .from('articles_with_author')
    .select()
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  // Fetch settings + article data in parallel
  const [settings, commentsRes, relatedRes, tagsRes] = await Promise.all([
    getSettings(),
    supabase
      .from('comments')
      .select()
      .eq('article_id', article.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('articles_with_author')
      .select()
      .eq('status', 'published')
      .eq('category_id', article.category_id)
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(3),

    supabase
      .from('article_tags')
      .select('tag')
      .eq('article_id', article.id),
  ])

  const comments = (commentsRes.data as Comment[]) ?? []
  const related = (relatedRes.data as ArticleListItem[]) ?? []
  const tags = (tagsRes.data ?? []).map((t: { tag: string }) => t.tag)
  const articlePath = `/artikel/${article.slug}`

  // Record view in background (fire and forget via API)
  // In a real scenario this is handled by a Route Handler on first load

  return (
    <article>
      {/* Breadcrumb */}
      <div className="border-b border-neutral-150 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-600 transition-colors">Beranda</Link>
            <ChevronRight size={12} className="text-neutral-300" />
            <Link href="/artikel" className="hover:text-brand-600 transition-colors">Berita</Link>
            {article.category_name && (
              <>
                <ChevronRight size={12} className="text-neutral-300" />
                <Link
                  href={`/kategori/${article.category_slug}`}
                  className="hover:text-brand-600 transition-colors"
                >
                  {article.category_name}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-neutral-300" />
            <span className="text-neutral-400 truncate max-w-[200px]">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          {/* Main content */}
          <div className="lg:col-span-8">
            {/* Article header */}
            <header className="mb-8">
              {/* Category */}
              {article.category_name && (
                <Link href={`/kategori/${article.category_slug}`} className="inline-block mb-4">
                  <CategoryBadge
                    name={article.category_name}
                    color={article.category_color ?? '#1a3c6e'}
                    size="lg"
                  />
                </Link>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 leading-tight mb-5 font-heading text-balance">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-lg text-neutral-500 leading-relaxed mb-6 font-light">
                  {article.excerpt}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 py-4 border-y border-neutral-150">
                {/* Author */}
                <div className="flex items-center gap-2.5">
                  {article.author_avatar ? (
                    <Image
                      src={article.author_avatar}
                      alt={article.author_name ?? 'Author'}
                      width={36}
                      height={36}
                      className="rounded-full ring-2 ring-neutral-150"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center ring-2 ring-neutral-150">
                      <span className="text-sm font-bold text-white">
                        {(article.author_name ?? 'T').charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">
                      {article.author_name ?? 'Tim Redaksi PeduaTel'}
                    </p>
                    <p className="text-xs text-neutral-400">Penulis</p>
                  </div>
                </div>

                <div className="h-6 w-px bg-neutral-200 hidden sm:block" />

                {/* Date */}
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Calendar size={15} className="text-neutral-400" />
                  <span>{formatDate(article.published_at)}</span>
                </div>

                {/* Reading time */}
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Clock size={15} className="text-neutral-400" />
                  <span>{article.reading_time} menit baca</span>
                </div>

                {/* Views */}
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Eye size={15} className="text-neutral-400" />
                  <span>{article.view_count.toLocaleString('id-ID')} dilihat</span>
                </div>
              </div>
            </header>

            {/* Photos — collage if gallery uploaded, fallback to single cover */}
            {(() => {
              const gallery: string[] = Array.isArray((article as any).gallery_images) && (article as any).gallery_images.length > 0
                ? (article as any).gallery_images
                : article.cover_image ? [article.cover_image] : []
              return gallery.length > 0 ? <PhotoCollage images={gallery} /> : null
            })()}

            {/* Article content */}
            <div
              className="prose-peduatel"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-neutral-150">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-1">
                  Tag:
                </span>
                {tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/cari?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-brand-50 hover:text-brand-600 border border-neutral-200 rounded-full transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Bottom engagement row */}
            <div className="mt-10 pt-6 border-t border-neutral-150 space-y-5">
              {/* Like */}
              <div className="flex items-center gap-3">
                <LikeButton articleId={article.id} initialCount={article.like_count} />
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Artikel ini bermanfaat?</p>
                  <p className="text-xs text-neutral-400">Klik suka untuk mendukung penulis</p>
                </div>
              </div>

              {/* Share inline */}
              <ShareButtons
                url={articlePath}
                title={article.title}
                excerpt={article.excerpt ?? undefined}
                variant="inline"
              />
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <section className="mt-12 pt-8 border-t-2 border-neutral-100">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 font-heading">
                  Artikel Terkait
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((rel) => (
                    <ArticleCard key={rel.id} article={rel} />
                  ))}
                </div>
              </section>
            )}

            {/* Comments */}
            <CommentSection
              articleId={article.id}
              initialComments={comments}
              totalComments={article.comment_count}
              enableComments={settings.enable_comments}
              requireApproval={settings.require_comment_approval}
            />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              {/* Like */}
              <div className="p-5 bg-white rounded-2xl border border-neutral-150 shadow-sm">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  Dukung Artikel Ini
                </p>
                <div className="flex items-center gap-3">
                  <LikeButton articleId={article.id} initialCount={article.like_count} />
                  <p className="text-sm text-neutral-500 leading-snug">
                    Klik suka jika artikel ini bermanfaat untuk Anda
                  </p>
                </div>
              </div>

              {/* Share sidebar */}
              <div className="p-5 bg-white rounded-2xl border border-neutral-150 shadow-sm">
                <ShareButtons
                  url={articlePath}
                  title={article.title}
                  excerpt={article.excerpt ?? undefined}
                  variant="sidebar"
                />
              </div>

              {/* Author bio */}
              <div className="p-5 bg-white rounded-2xl border border-neutral-150 shadow-sm">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Tentang Penulis</p>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {(article.author_name ?? 'T').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">
                      {article.author_name ?? 'Tim Redaksi PeduaTel'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      Tim redaksi Portal PeduaTel yang berkomitmen menyajikan berita terpercaya.
                    </p>
                  </div>
                </div>
              </div>

              {/* Related sidebar */}
              {related.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-neutral-150 shadow-sm">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    Artikel Terkait
                  </p>
                  <div className="space-y-4">
                    {related.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/artikel/${rel.slug}`}
                        className="group flex gap-3"
                      >
                        {rel.cover_image && (
                          <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
                            <Image
                              src={rel.cover_image}
                              alt={rel.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-neutral-700 group-hover:text-brand-600 line-clamp-2 leading-snug transition-colors">
                            {rel.title}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {formatDate(rel.published_at)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}
