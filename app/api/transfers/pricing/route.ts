import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()

  const [formulaRes, vtRes, routesRes, settingsRes] = await Promise.all([
    supabase.from('transfer_formula').select('vehicle_slug, zone_config, airport_multiplier'),
    supabase.from('vehicle_types').select('slug, name, category, image_url, example_models').order('sort_order'),
    supabase
      .from('transfer_routes')
      .select('id, from_location, to_location, slug, transfer_prices(vehicle_type_id, price, original_price, discount_label, vehicle_types(slug))')
      .eq('is_active', true),
    supabase.from('transfer_settings').select('value').eq('key', 'return_trip_pricing').single(),
  ])

  return NextResponse.json({
    formulas:      formulaRes.data ?? [],
    vehicleTypes:  vtRes.data      ?? [],
    presetRoutes:  routesRes.data  ?? [],
    returnPricing: settingsRes.data?.value ?? { mode: 'same', discount_percent: 100, display_mode: 'per_leg_and_total', discount_label: null },
  })
}
