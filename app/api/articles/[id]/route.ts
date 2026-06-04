import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { articleSchema } from '@/lib/validations/article'
import { calculateReadingTime } from '@/lib/utils/reading-time'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles_with_author')
    .select()
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })

  const { data: tags } = await supabase
    .from('article_tags')
    .select('tag')
    .eq('article_id', id)

  return NextResponse.json({ data: { ...data, tags: tags?.map((t) => t.tag) ?? [] } })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = articleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { tags, ...articleData } = parsed.data
  const readingTime = body.reading_time ?? calculateReadingTime(articleData.content)

  const { data: article, error } = await supabase
    .from('articles')
    .update({
      ...articleData,
      reading_time: readingTime,
      published_at: articleData.status === 'published'
        ? articleData.published_at || new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Replace tags
  await supabase.from('article_tags').delete().eq('article_id', id)
  if (tags.length > 0) {
    await supabase.from('article_tags').insert(tags.map((tag) => ({ article_id: id, tag })))
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update',
    resource_type: 'article',
    resource_id: id,
    details: { title: article.title, status: article.status },
  })

  return NextResponse.json({ data: article })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'delete',
    resource_type: 'article',
    resource_id: id,
  })

  return NextResponse.json({ success: true })
}
