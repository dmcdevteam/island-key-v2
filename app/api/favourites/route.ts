import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json([])

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('favourites')
    .select('*')
    .eq('guest_session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()
  const { guest_session_id, item_type, item_id, item_slug, item_title, item_image, item_price } = body

  if (!guest_session_id || !item_type || !item_id || !item_slug || !item_title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('favourites')
    .insert({
      guest_session_id,
      item_type,
      item_id,
      item_slug,
      item_title,
      item_image: item_image ?? null,
      item_price: item_price ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
