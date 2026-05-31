import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../_lib/auth'
import { createNotificationFromContent } from '@/lib/create-notification'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('smart_cards')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { notify_guests, ...insertData } = body
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('smart_cards')
    .insert(insertData)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (notify_guests && data) {
    await createNotificationFromContent({
      title: data.title,
      body: data.subtitle ?? `Check out: ${data.title}`,
      type: 'info',
    })
  }
  return NextResponse.json(data, { status: 201 })
}
