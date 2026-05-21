import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    title, body: notifBody, type, target,
    target_property_id, target_guest_id,
    scheduled_at, is_active,
  } = body

  if (!title || !notifBody || !type || !target) {
    return NextResponse.json({ error: 'title, body, type and target are required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title,
      body: notifBody,
      type,
      target,
      target_property_id: target_property_id || null,
      target_guest_id:    target_guest_id    || null,
      scheduled_at:       scheduled_at       || new Date().toISOString(),
      is_active:          is_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notification: data })
}
