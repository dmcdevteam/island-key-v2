import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/app/api/admin/_lib/auth'

export async function POST(request: Request) {
  if (!isAdminAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { rental_id, location_ids } = await request.json()
  if (!rental_id) return NextResponse.json({ error: 'rental_id required' }, { status: 400 })

  const supabase = createServerClient()

  // Delete existing associations
  const { error: delError } = await supabase
    .from('rental_vehicle_pickup_locations')
    .delete()
    .eq('rental_id', rental_id)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  // Insert new associations
  if (Array.isArray(location_ids) && location_ids.length > 0) {
    const rows = location_ids.map((id: string) => ({
      rental_id,
      pickup_location_id: id,
      is_available: true,
    }))
    const { error: insError } = await supabase
      .from('rental_vehicle_pickup_locations')
      .insert(rows)
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
