import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { sendGuestBookingCancelled } from '@/lib/email'

function html(title: string, heading: string, body: string, color: string) {
  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Island Key</title>
</head>
<body style="margin:0;padding:40px 24px;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center">
  <div style="max-width:420px;margin:0 auto">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF">Island Key</p>
    <div style="background:white;border-radius:12px;padding:36px 28px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <div style="width:56px;height:56px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px;line-height:56px">✕</div>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1B2D4F">${heading}</h1>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6">${body}</p>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#9CA3AF">You can close this tab.</p>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return html('Error', 'Invalid link', 'This link is missing a verification token.', '#FEE2E2')
  }

  const supabase = createServerClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_title, booking_date, guest_name, guest_email, guest_id, status, action_token')
    .eq('id', params.id)
    .eq('action_token', token)
    .single()

  if (error || !booking) {
    return html('Invalid link', 'Invalid link', 'This cancellation link is invalid or has already been used.', '#FEE2E2')
  }

  if (booking.status === 'cancelled') {
    return html('Already cancelled', 'Already cancelled', `Booking ${booking.confirmation_code} was already cancelled.`, '#FEE2E2')
  }

  // Update status
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', params.id)

  if (updateErr) {
    console.error('cancel route: update failed', updateErr)
    return html('Error', 'Something went wrong', 'Could not update the booking. Please try again or contact support.', '#FEE2E2')
  }

  // Resolve guest email
  let guestEmail = booking.guest_email as string | null
  let guestName  = (booking.guest_name as string | null) ?? 'Guest'

  if (!guestEmail && booking.guest_id) {
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name')
      .eq('id', booking.guest_id)
      .single()
    if (guest?.first_name && !guestName) guestName = guest.first_name
  }

  // Fire cancellation email
  if (guestEmail) {
    sendGuestBookingCancelled({
      to: guestEmail,
      guestName,
      itemTitle: booking.item_title,
      bookingDate: booking.booking_date,
      confirmationCode: booking.confirmation_code,
    }).catch(err => console.error('cancel route: email error', err))
  }

  return html(
    'Booking cancelled',
    'Cancelled',
    `Booking <strong>${booking.confirmation_code}</strong> — <em>${booking.item_title}</em> — has been cancelled. A cancellation email has been sent to the guest.`,
    '#FEE2E2'
  )
}
