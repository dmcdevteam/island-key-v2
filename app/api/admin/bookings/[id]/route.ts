import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminAuthed } from '../../_lib/auth'
import { sendGuestBookingConfirmed, sendGuestBookingCancelled } from '@/lib/email'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status } = body as { status: string }

  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createServerClient()

  const update: Record<string, unknown> = { status }
  if (status === 'confirmed') update.confirmed_at = new Date().toISOString()
  if (status === 'cancelled') update.cancelled_at = new Date().toISOString()

  const { data: booking, error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', params.id)
    .select('id, confirmation_code, item_type, item_id, item_title, booking_date, pax, guest_name, guest_email, guest_id, status')
    .single()

  if (error || !booking) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 })

  // Resolve guest email + name if not stored directly
  let guestEmail = booking.guest_email as string | null
  let guestName  = booking.guest_name as string ?? 'Guest'

  if (!guestEmail && booking.guest_id) {
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name')
      .eq('id', booking.guest_id)
      .single()
    if (guest?.first_name && !guestName) guestName = guest.first_name
  }

  // Fire confirmation/cancellation email to guest if we have their email
  if (guestEmail) {
    if (status === 'confirmed') {
      sendGuestBookingConfirmed({
        to: guestEmail,
        bookingId: booking.id,
        guestName,
        itemTitle: booking.item_title,
        bookingDate: booking.booking_date,
        pax: booking.pax,
        confirmationCode: booking.confirmation_code,
        itemId: booking.item_type === 'activity' ? booking.item_id : null,
      }).catch(err => console.error('confirm email error:', err))
    } else if (status === 'cancelled') {
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
