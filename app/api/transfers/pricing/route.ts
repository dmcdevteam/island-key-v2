import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('transfer_formula')
    .select('vehicle_slug, zone_config, airport_multiplier')

  if (error) {
    // Return empty — client will fall back to hardcoded defaults
    return NextResponse.json([])
  }
  return NextResponse.json(data ?? [])
}
