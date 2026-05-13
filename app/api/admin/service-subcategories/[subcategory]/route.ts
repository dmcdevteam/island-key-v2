import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../../../_lib/auth'

export async function PUT(request: Request, { params }: { params: { subcategory: string } }) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('service_subcategories')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('subcategory', params.subcategory)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
