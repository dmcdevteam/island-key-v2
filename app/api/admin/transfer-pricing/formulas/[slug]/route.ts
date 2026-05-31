import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('transfer_formula')
    .upsert({
      vehicle_slug:        params.slug,
      zone_config:         body.zone_config,
      airport_multiplier:  body.airport_multiplier,
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'vehicle_slug' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
