import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditorPage } from '@/components/admin/article-editor-page'

export const metadata: Metadata = { title: 'Tulis Artikel Baru' }

export default async function NewArticlePage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order')

  return <ArticleEditorPage categories={categories ?? []} />
}
