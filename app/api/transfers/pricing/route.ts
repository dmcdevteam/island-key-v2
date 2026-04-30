import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()

  const [formulaRes, vtRes, routesRes] = await Promise.all([
    supabase.from('transfer_formula').select('vehicle_slug, zone_config, airport_multiplier'),
    supabase.from('vehicle_types').select('name, category, image_url, example_models').order('sort_order'),
    supabase
      .from('transfer_routes')
      .select('id, from_location, to_location, slug, transfer_prices(vehicle_type_id, price, original_price, discount_label, vehicle_types(slug))')
      .eq('is_active', true),
  ])

  return NextResponse.json({
    formulas:     formulaRes.data ?? [],
    vehicleTypes: vtRes.data     ?? [],
    presetRoutes: routesRes.data ?? [],
  })
}
