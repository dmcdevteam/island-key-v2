import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const supabase = createServerClient()
  let query = supabase
    .from('rental_pickup_locations')
    .select('id, name, city, address, google_maps_url, vehicle_categories, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (category) {
    query = query.contains('vehicle_categories', [category])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ locations: data ?? [] })
}
