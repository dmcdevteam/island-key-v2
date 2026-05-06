import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../../../_lib/auth'

export async function PUT(request: Request, { params }: { params: { category: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rental_essentials_categories')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('category', params.category)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
