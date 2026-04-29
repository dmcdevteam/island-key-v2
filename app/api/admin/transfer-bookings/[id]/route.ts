import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = createServerClient()

  const allowed: Record<string, unknown> = {}
  if (body.driver_name  !== undefined) allowed.driver_name  = body.driver_name
  if (body.driver_phone !== undefined) allowed.driver_phone = body.driver_phone
  if (body.status       !== undefined) allowed.status       = body.status
  if (body.guest_notes  !== undefined) allowed.guest_notes  = body.guest_notes

  if (body.status === 'confirmed') allowed.confirmed_at = new Date().toISOString()
  if (body.status === 'cancelled') allowed.cancelled_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .update(allowed)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
