import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { sendChangeRequestSubmissionEmails } from '@/lib/email'
import { whatsappLink } from '@/lib/utils'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { booking_id, guest_id, notes, requested_date, requested_time, requested_pax, requested_vehicle_class } = body

  if (!booking_id || !notes) {
    return NextResponse.json({ error: 'booking_id and notes are required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('change_requests')
    .insert({
      booking_id,
      guest_id:                  guest_id             ?? null,
      notes:                     notes as string,
      requested_date:            requested_date        ?? null,
      requested_time:            requested_time        ?? null,
      requested_pax:             requested_pax         ?? null,
      requested_vehicle_class:   requested_vehicle_class ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[POST /api/change-requests] insert failed:', error?.message)
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  try {
    await sendChangeRequestSubmissionEmails(data.id)
  } catch (e) {
    console.error('[POST /api/change-requests] emails failed:', e)
  }

  return NextResponse.json(data, { status: 201 })
}
