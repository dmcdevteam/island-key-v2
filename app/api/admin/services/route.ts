import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../_lib/auth'
import { createNotificationFromContent } from '@/lib/create-notification'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order')
    .order('title')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { notify_guests, ...insertData } = body
  const supabase = createServerClient()
  const { data, error } = await supabase.from('services').insert(insertData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (notify_guests && data) {
    await createNotificationFromContent({
      title: data.title,
      body: data.short_description ?? `New service now available: ${data.title}`,
      type: 'offer',
    })
  }
  return NextResponse.json(data, { status: 201 })
}
