import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <>
      <Header categories={categories ?? []} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
