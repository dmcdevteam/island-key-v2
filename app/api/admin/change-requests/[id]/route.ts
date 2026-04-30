import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../../_lib/auth'
import { sendChangeRequestApprovalEmails, sendChangeRequestRejectionEmails } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch { /* empty body ok */ }

  const action     = body.action as string | undefined      // 'approve' | 'reject'
  const adminNotes = (body.admin_notes as string) || null

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Fetch change request + booking
  const { data: cr, error: fetchErr } = await supabase
    .from('change_requests')
    .select('id, booking_id, status, requested_date, requested_time, requested_pax, requested_vehicle_class')
    .eq('id', params.id)
    .single()

  if (fetchErr || !cr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (cr.status !== 'pending') return NextResponse.json({ error: 'Already resolved' }, { status: 409 })

  // Update change_request status
  const { error: updateErr } = await supabase
    .from('change_requests')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', admin_notes: adminNotes, resolved_at: new Date().toISOString() })
    .eq('id', params.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // If approving, patch the booking with requested values
  if (action === 'approve') {
    const patch: Record<string, unknown> = {}
    if (cr.requested_date)          patch.booking_date   = cr.requested_date
    if (cr.requested_time)          patch.booking_time   = cr.requested_time
    if (cr.requested_pax)           { patch.pax = cr.requested_pax; patch.pax_count = cr.requested_pax }
    if (cr.requested_vehicle_class) patch.vehicle_class  = cr.requested_vehicle_class
    // Rebuild pickup_at if date/time changed
    const newDate = (cr.requested_date as string | null) ?? null
    const newTime = (cr.requested_time as string | null) ?? null
    if (newDate && newTime) patch.pickup_at = `${newDate}T${newTime}:00`

    if (Object.keys(patch).length > 0) {
      await supabase.from('bookings').update(patch).eq('id', cr.booking_id)
    }
  }

  // Send emails
  try {
    if (action === 'approve') {
      await sendChangeRequestApprovalEmails(params.id)
    } else {
      await sendChangeRequestRejectionEmails(params.id)
    }
  } catch (e) {
    console.error('[change-requests] email failed:', e)
  }

  return NextResponse.json({ ok: true })
}
