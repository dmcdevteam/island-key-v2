import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, confirmation_code, item_type, item_title, activity_slug,
      booking_date, booking_time, pax, pax_count, luggage_count, status, created_at,
      pickup_at, pickup_location, dropoff_location, vehicle_class,
      flight_number, extras, notes, guest_notes,
      unit_price, total_price, payment_method,
      transfer_type, distance_km, duration_min,
      group_ref, guest_id
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
