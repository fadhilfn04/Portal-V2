import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CommentsModerator } from '@/components/admin/comments-moderator'

export const metadata: Metadata = { title: 'Moderasi Komentar' }

export default async function CommentsPage() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('comments')
    .select('*, articles(title, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: approved } = await supabase
    .from('comments')
    .select('*, articles(title, slug)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">Moderasi Komentar</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Tinjau dan kelola komentar dari pengunjung</p>
      </div>
      <CommentsModerator pending={pending ?? []} approved={approved ?? []} />
    </div>
  )
}
