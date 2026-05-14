import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/app/admin/_lib/auth'

export async function GET(request: Request) {
  if (!isAdminAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const rentalId = searchParams.get('rental_id')
  const supabase = createServerClient()

  if (rentalId) {
    // Return junction rows for this specific vehicle
    const { data, error } = await supabase
      .from('rental_vehicle_pickup_locations')
      .select('pickup_location_id')
      .eq('rental_id', rentalId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  const { data, error } = await supabase
    .from('rental_pickup_locations')
    .select('*')
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  if (!isAdminAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rental_pickup_locations')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
