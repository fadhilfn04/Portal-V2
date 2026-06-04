import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { articleSchema } from '@/lib/validations/article'
import { generateSlug } from '@/lib/utils/slug'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { getSettings } from '@/lib/utils/settings'
import { autoBroadcast } from '@/lib/utils/whatsapp'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 12)
  const status = searchParams.get('status') ?? 'published'
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')

  const supabase = await createClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from('articles_with_author')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq('category_slug', category)
  if (featured === 'true') query = query.eq('is_featured', true)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    per_page: limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
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
  const slug = articleData.slug || generateSlug(articleData.title)
  const readingTime = calculateReadingTime(articleData.content)

  // Insert article
  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      ...articleData,
      slug,
      reading_time: readingTime,
      author_id: profile.id,
      published_at: articleData.status === 'published'
        ? articleData.published_at || new Date().toISOString()
        : null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan. Gunakan judul atau slug yang berbeda.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Insert tags
  if (tags.length > 0) {
    await supabase.from('article_tags').insert(
      tags.map((tag) => ({ article_id: article.id, tag }))
    )
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: profile.id,
    action: 'create',
    resource_type: 'article',
    resource_id: article.id,
    details: { title: article.title, status: article.status },
  })

  // Auto-broadcast if article is published and WhatsApp is enabled
  if (article.status === 'published') {
    const settings = await getSettings()
    if (settings.enable_whatsapp) {
      autoBroadcast(article, profile.id, settings.whatsapp_gateway).catch(() => {})
    }
  }

  return NextResponse.json({ data: article }, { status: 201 })
}
