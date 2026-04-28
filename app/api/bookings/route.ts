import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Resolve property slug → UUID
  let propertyId: string | null = (body.property_id as string) ?? null
  if (!propertyId && body.property_slug) {
    const { data: prop } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', body.property_slug as string)
      .single()
    propertyId = prop?.id ?? null
  }

  const insertPayload = {
    item_type:      body.item_type      ?? 'activity',
    item_id:        body.item_id        ?? null,
    item_title:     body.item_title     ?? '',
    booking_date:   body.booking_date   ?? null,
    pax:            body.pax            ?? 1,
    days:           body.days           ?? 1,
    unit_price:     body.unit_price     ?? 0,
    total_price:    body.total_price    ?? 0,
    payment_method: body.payment_method ?? 'whatsapp',
    status:         'pending',
    guest_id:       body.guest_id       ?? null,
    property_id:    propertyId,
    provider_id:    body.provider_id    ?? null,
    guest_notes:    body.guest_notes    ?? null,
    guest_name:     body.guest_name     ?? null,
    guest_email:    body.guest_email    ?? null,
  }

  console.log('[POST /api/bookings] inserting:', JSON.stringify(insertPayload))

  const { data, error } = await supabase
    .from('bookings')
    .insert(insertPayload)
    .select('id, confirmation_code')
    .single()

  if (error || !data) {
    console.error('[POST /api/bookings] insert failed:', error?.message, error?.details, error?.hint)
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  console.log('[POST /api/bookings] created booking', data.confirmation_code)
  return NextResponse.json(data)
}

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
