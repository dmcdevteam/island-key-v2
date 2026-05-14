import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/app/api/admin/_lib/auth'

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { rental_id, locations } = body
  if (!rental_id) return NextResponse.json({ error: 'rental_id required' }, { status: 400 })

  const supabase = createServerClient()

  // Delete existing associations
  const { error: delError } = await supabase
    .from('rental_vehicle_pickup_locations')
    .delete()
    .eq('rental_id', rental_id)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  // Insert new associations — accepts { id, instructions }[] or legacy string[]
  const entries: { id: string; instructions: string }[] = Array.isArray(locations)
    ? locations.map((l: any) => typeof l === 'string' ? { id: l, instructions: '' } : l)
    : []

  if (entries.length > 0) {
    const rows = entries.map(({ id, instructions }) => ({
      rental_id,
      pickup_location_id: id,
      instructions: instructions || null,
      is_available: true,
    }))
    const { error: insError } = await supabase
      .from('rental_vehicle_pickup_locations')
      .insert(rows)
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
