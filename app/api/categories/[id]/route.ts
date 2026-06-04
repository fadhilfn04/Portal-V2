import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { data, error } = await supabase
    .from('categories')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if category has articles
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact' })
    .eq('category_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Kategori ini memiliki ${count} artikel. Pindahkan artikel terlebih dahulu.` },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
