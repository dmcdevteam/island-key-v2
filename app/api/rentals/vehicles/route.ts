import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const COLS = [
  'id','type','car_class','name','description','price_per_day','price_per_week',
  'seats','doors','transmission','fuel_type','ac','zero_deposit','deposit_amount',
  'insurance_included','features','images','image_wide','image_square',
  'focal_x','focal_y','focal_sq_x','focal_sq_y',
  'is_active','is_featured','sort_order','region','pickup_locations',
  'rider_height','max_speed','motor_power','autonomy','gears',
  'delivery_area','bike_includes','day_discounts','bike_tcs','availability_note',
].join(',')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id   = searchParams.get('id')
  const type = searchParams.get('type') ?? 'car'

  const supabase = createServerClient()

  let query = supabase
    .from('rentals')
    .select(COLS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('price_per_day', { ascending: true })

  if (id)   query = query.eq('id', id)
  else      query = query.eq('type', type)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (id) {
    const rental = data?.[0] ?? null
    if (!rental) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ rental })
  }

  return NextResponse.json({ rentals: data ?? [] })
}
