import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

export async function GET(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status  = searchParams.get('status')
  const search  = searchParams.get('search')?.toLowerCase()
  const dateFrom = searchParams.get('from')
  const dateTo   = searchParams.get('to')

  const supabase = createServerClient()
  let query = supabase
    .from('bookings')
    .select(`
      id, confirmation_code, item_type, item_id, item_title,
      booking_date, pax, unit_price, total_price, payment_method,
      status, guest_id, guest_name, guest_email, guest_notes,
      action_token, confirmed_at, cancelled_at, created_at,
      properties!property_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(300)

  if (status && status !== 'all') query = query.eq('status', status)
  if (dateFrom) query = query.gte('booking_date', dateFrom)
  if (dateTo)   query = query.lte('booking_date', dateTo)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Client-side search filter (reference or name)
  const rows = search
    ? (data ?? []).filter((b: Record<string, unknown>) =>
        String(b.confirmation_code ?? '').toLowerCase().includes(search) ||
        String(b.guest_name ?? '').toLowerCase().includes(search) ||
        String(b.guest_email ?? '').toLowerCase().includes(search) ||
        String(b.item_title ?? '').toLowerCase().includes(search)
      )
    : (data ?? [])

  return NextResponse.json(rows)
}
