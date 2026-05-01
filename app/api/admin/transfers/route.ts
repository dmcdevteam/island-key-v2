import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data, error } = await supabase.from('transfer_routes').select('*').order('sort_order').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase.from('transfer_routes').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/transfers')
  revalidatePath('/transfers/results')
  return NextResponse.json(data, { status: 201 })
}
