import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

export async function GET(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const exclude  = searchParams.get('exclude')

  let query = supabase.from('vehicle_types').select('*').order('sort_order').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  if (exclude)  query = query.neq('category', exclude)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase.from('vehicle_types').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
