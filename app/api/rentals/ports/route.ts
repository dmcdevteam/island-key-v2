import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  const supabase = createServerClient()
  let query = supabase
    .from('rental_ports')
    .select('id, name, area, address, lat, lng, google_maps_url, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (city) query = query.eq('area', city)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ports: data ?? [] })
}
