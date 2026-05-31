import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../_lib/auth'

const KEY = 'return_trip_pricing'

const DEFAULT = {
  mode: 'same',
  discount_percent: 100,
  display_mode: 'per_leg_and_total',
  discount_label: null,
}

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data } = await supabase
    .from('transfer_settings')
    .select('value')
    .eq('key', KEY)
    .single()
  return NextResponse.json(data?.value ?? DEFAULT)
}

export async function PUT(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('transfer_settings')
    .upsert({ key: KEY, value: body, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.value ?? body)
}
