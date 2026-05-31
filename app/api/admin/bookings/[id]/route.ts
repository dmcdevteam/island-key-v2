import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { isAdminAuthed } from '../../_lib/auth'
import { sendAllConfirmationEmails, sendGuestBookingCancelled } from '@/lib/email'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as Record<string, unknown>

  // Build update payload — accept editable fields plus status
  const update: Record<string, unknown> = {}

  const EDITABLE = ['guest_name', 'guest_email', 'guest_notes', 'booking_date', 'pax', 'item_title'] as const
  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key] ?? null
  }

  const newStatus = typeof body.status === 'string' ? body.status : null

  if (newStatus) {
    if (!['pending', 'confirmed', 'cancelled', 'completed', 'refunded'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = newStatus
    if (newStatus === 'confirmed') update.confirmed_at = new Date().toISOString()
    if (newStatus === 'cancelled') update.cancelled_at = new Date().toISOString()
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', params.id)
    .select('id, confirmation_code, item_type, item_id, item_title, booking_date, pax, guest_name, guest_email, guest_notes, guest_id, status, confirmed_at, cancelled_at')
    .single()

  if (error || !booking) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 })

  // Fire emails on status transitions
  if (newStatus === 'confirmed') {
    await sendAllConfirmationEmails(booking.id)
      .catch(err => console.error('admin confirm emails error:', err))
  } else if (newStatus === 'cancelled') {
    const guestEmail = booking.guest_email as string | null
    const guestName  = (booking.guest_name as string | null) ?? 'Guest'
    if (guestEmail) {
      sendGuestBookingCancelled({
        to: guestEmail,
        guestName,
        itemTitle: booking.item_title,
        bookingDate: booking.booking_date,
        confirmationCode: booking.confirmation_code,
      }).catch(err => console.error('cancel email error:', err))
    }
  }

  return NextResponse.json({ ok: true, booking })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
