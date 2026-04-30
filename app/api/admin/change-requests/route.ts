import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../_lib/auth'

export async function GET(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const supabase = createServerClient()
  let query = supabase
    .from('change_requests')
    .select(`
      id, status, notes, admin_notes, requested_date, requested_time, requested_pax, requested_vehicle_class, created_at, resolved_at,
      bookings(id, confirmation_code, item_type, item_title, guest_name, guest_email, pickup_location, dropoff_location)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
