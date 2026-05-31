import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id         = searchParams.get('id')
  const city       = searchParams.get('city')
  const portId     = searchParams.get('port_id')
  const withSkipper = searchParams.get('with_skipper')
  const minPrice   = searchParams.get('min_price')
  const maxPrice   = searchParams.get('max_price')
  const minCap     = searchParams.get('min_capacity')
  const minLen     = searchParams.get('min_length')
  const maxLen     = searchParams.get('max_length')
  const minEngine  = searchParams.get('min_engine')
  const maxEngine  = searchParams.get('max_engine')

  const supabase = createServerClient()

  let query = supabase
    .from('rentals')
    .select(`
      id, type, car_class, name, description, price_per_day, price_per_week,
      features, images, image_wide, image_square, focal_x, focal_y,
      focal_sq_x, focal_sq_y, is_active, is_featured, sort_order, region,
      capacity, length_m, engine_power, year_built, licence_required,
      with_skipper, fuel_included, min_rental_age, checkin_time, checkout_time,
      cancellation_policy, boat_equipment, boat_faq, port_id,
      rental_ports!port_id (id, name, area, address, lat, lng, google_maps_url)
    `)
    .eq('type', 'boat')

  if (id) {
    query = query.eq('id', id)
  } else {
    query = query.eq('is_active', true)
  }

  if (portId)      query = query.eq('port_id', portId)
  if (withSkipper === 'true')  query = query.eq('with_skipper', true)
  if (withSkipper === 'false') query = query.eq('with_skipper', false)
  if (minPrice)    query = query.gte('price_per_day', parseFloat(minPrice))
  if (maxPrice)    query = query.lte('price_per_day', parseFloat(maxPrice))
  if (minCap)      query = query.gte('capacity', parseInt(minCap))
  if (minLen)      query = query.gte('length_m', parseFloat(minLen))
  if (maxLen)      query = query.lte('length_m', parseFloat(maxLen))
  if (minEngine)   query = query.gte('engine_power', parseInt(minEngine))
  if (maxEngine)   query = query.lte('engine_power', parseInt(maxEngine))

  query = query.order('sort_order')

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter by city via the joined port
  let boats = (data ?? []) as Record<string, unknown>[]
  if (city) {
    boats = boats.filter(b => {
      const port = b.rental_ports as Record<string, unknown> | null
      return port?.area === city
    })
  }

  if (id) {
    return NextResponse.json({ boat: boats[0] ?? null })
  }
  return NextResponse.json({ boats })
}
