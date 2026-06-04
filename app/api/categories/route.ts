import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateSlug } from '@/lib/utils/slug'

const categorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().optional(),
  description: z.string().max(200).optional().default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1a3c6e'),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
})

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const slug = parsed.data.slug || generateSlug(parsed.data.name)

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...parsed.data, slug })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Nama atau slug kategori sudah ada.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
