import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()

  const [formulaRes, vtRes] = await Promise.all([
    supabase.from('transfer_formula').select('vehicle_slug, zone_config, airport_multiplier'),
    supabase.from('vehicle_types').select('name, category, image_url, example_models').order('sort_order'),
  ])

  return NextResponse.json({
    formulas:     formulaRes.data ?? [],
    vehicleTypes: vtRes.data     ?? [],
  })
}
