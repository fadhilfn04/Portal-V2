import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditorPage } from '@/components/admin/article-editor-page'

export const metadata: Metadata = { title: 'Tulis Artikel Baru' }

export default async function NewArticlePage() {
  const supabase = await createClient()

  const [categoriesRes, { data: { user } }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order'),
    supabase.auth.getUser(),
  ])

  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  return <ArticleEditorPage categories={categoriesRes.data ?? []} userRole={profile?.role} />
}
