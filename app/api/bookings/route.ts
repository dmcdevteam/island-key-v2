import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const guestId = searchParams.get('guest_id')
  if (!guestId) return NextResponse.json([])

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_type, item_title, booking_date, pax, status, created_at')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
