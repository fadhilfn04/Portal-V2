import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditorPage } from '@/components/admin/article-editor-page'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('title').eq('id', id).single()
  return { title: data ? `Edit: ${data.title}` : 'Edit Artikel' }
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [articleRes, categoriesRes, tagsRes] = await Promise.all([
    supabase.from('articles').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order'),
    supabase.from('article_tags').select('tag').eq('article_id', id),
  ])

  if (!articleRes.data) notFound()

  const article = articleRes.data
  const tags = tagsRes.data?.map((t: { tag: string }) => t.tag) ?? []

  const articleFormData = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    content: article.content,
    content_html: article.content_html,
    cover_image: article.cover_image ?? '',
    cover_image_alt: article.cover_image_alt ?? '',
    category_id: article.category_id ?? '',
    tags,
    status: article.status as 'draft' | 'published' | 'archived',
    is_featured: article.is_featured,
    meta_title: article.meta_title ?? '',
    meta_description: article.meta_description ?? '',
    published_at: article.published_at
      ? new Date(article.published_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  }

  return (
    <ArticleEditorPage
      categories={categoriesRes.data ?? []}
      article={articleFormData}
    />
  )
}
