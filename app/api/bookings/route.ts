import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendGuestConfirmation, sendHostNotification, sendInternalNotification, sendTransferEnquiryEmails } from '@/lib/email'

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
    // transfers have no item — item_id is nullable after migration
    item_id:        (body.item_id as string | null) ?? null,
    item_title:     body.item_title     ?? '',
    booking_date:   body.booking_date   ?? null,
    booking_time:   body.booking_time   ?? null,
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
    ...(body.activity_slug ? { activity_slug: body.activity_slug } : {}),
    ...(body.transfer_type ? {
      transfer_type:    body.transfer_type,
      pickup_at:        body.pickup_at        ?? null,
      pickup_location:  body.pickup_location  ?? null,
      dropoff_location: body.dropoff_location ?? null,
      flight_number:    body.flight_number    ?? null,
      pax_count:        body.pax_count        ?? null,
      luggage_count:    body.luggage_count    ?? null,
      vehicle_class:    body.vehicle_class    ?? null,
      distance_km:      body.distance_km      ?? null,
      duration_min:     body.duration_min     ?? null,
      extras:           body.extras           ?? [],
      notes:            body.notes            ?? null,
    } : {}),
    ...(body.group_ref ? { group_ref: body.group_ref } : {}),
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

  // Fire emails independently — one failure must not block others
  const bookingId  = data.id
  const guestName  = (body.guest_name  as string | null) ?? 'Guest'
  const guestEmail = (body.guest_email as string | null) ?? null
  const guestPhone = (body.guest_phone as string | null) ?? null

  if (body.item_type === 'transfer') {
    // Transfer-specific email pipeline (internal alert + guest receipt)
    try {
      await sendTransferEnquiryEmails(bookingId)
    } catch (e) {
      console.error('[POST /api/bookings] transfer emails failed:', e)
    }
  } else {
    // Activity / deal / rental email pipeline
    try {
      await sendInternalNotification(bookingId, { guestEmail: guestEmail ?? undefined })
    } catch (e) {
      console.error('[POST /api/bookings] internal email failed:', e)
    }

    try {
      await sendHostNotification(bookingId, { guestName, guestPhone })
    } catch (e) {
      console.error('[POST /api/bookings] host email failed:', e)
    }

    if (guestEmail) {
      try {
        await sendGuestConfirmation({
          to: guestEmail,
          guestName,
          itemTitle:        (body.item_title     as string) ?? '',
          bookingDate:      (body.booking_date   as string) ?? '',
          pax:              (body.pax            as number) ?? 1,
          totalPrice:       (body.total_price    as number) ?? 0,
          confirmationCode: data.confirmation_code,
          paymentMethod:    (body.payment_method as string) ?? 'whatsapp',
        })
      } catch (e) {
        console.error('[POST /api/bookings] guest email failed:', e)
      }
    }
  }

  return NextResponse.json(data)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const guestId = searchParams.get('guest_id')
  if (!guestId) return NextResponse.json([])

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_type, item_title, booking_date, booking_time, pax, pax_count, luggage_count, status, created_at, activity_slug, pickup_at, pickup_location, dropoff_location, vehicle_class')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
