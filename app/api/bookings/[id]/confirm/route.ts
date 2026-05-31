import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { sendAllConfirmationEmails } from '@/lib/email'

function html(title: string, heading: string, body: string, color: string, showAdminBtn = false) {
  const icon = heading === 'Confirmed' ? '✓' : '✕'
  const adminBtn = showAdminBtn
    ? `<a href="https://app.islandkey.gr/admin/bookings"
         style="display:block;width:100%;box-sizing:border-box;padding:13px 0;background:#1B2D4F;color:white;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;text-align:center;margin-bottom:10px">
         Go to Admin Panel →
       </a>
       <button onclick="(function(){var closed=false;try{window.close();setTimeout(function(){if(!closed)document.getElementById('close-fallback').style.display='block'},400)}catch(e){document.getElementById('close-fallback').style.display='block'}})()"
         style="display:block;width:100%;box-sizing:border-box;padding:13px 0;background:white;color:#6B7280;font-size:14px;font-weight:600;border-radius:8px;border:1px solid #E5E7EB;cursor:pointer;text-align:center">
         Close tab
       </button>
       <p id="close-fallback" style="display:none;margin-top:12px;font-size:12px;color:#9CA3AF">You can now close this tab manually.</p>`
    : `<p style="margin-top:4px;font-size:12px;color:#9CA3AF">You can close this tab.</p>`

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
      <div style="width:56px;height:56px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px;line-height:56px">${icon}</div>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1B2D4F">${heading}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6">${body}</p>
      ${adminBtn}
    </div>
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

  // Verify token + fetch booking in one query
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_type, item_id, item_title, booking_date, pax, guest_name, guest_email, guest_id, status, action_token')
    .eq('id', params.id)
    .eq('action_token', token)
    .single()

  if (error || !booking) {
    return html('Invalid link', 'Invalid link', 'This confirmation link is invalid or has already been used.', '#FEE2E2')
  }

  if (booking.status === 'confirmed') {
    return html('Already confirmed', 'Already confirmed', `Booking ${booking.confirmation_code} was already confirmed.`, '#D1FAE5')
  }

  if (booking.status === 'cancelled') {
    return html('Booking cancelled', 'Booking cancelled', `This booking (${booking.confirmation_code}) has already been cancelled and cannot be confirmed.`, '#FEE2E2')
  }

  // Update status
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', params.id)

  if (updateErr) {
    console.error('confirm route: update failed', updateErr)
    return html('Error', 'Something went wrong', 'Could not update the booking. Please try again or contact support.', '#FEE2E2')
  }

  // Fire all four confirmation emails (guest, host, internal, provider)
  sendAllConfirmationEmails(booking.id)
    .catch(err => console.error('confirm route: email error', err))

  return html(
    'Booking confirmed',
    'Confirmed',
    `Booking <strong>${booking.confirmation_code}</strong> — <em>${booking.item_title}</em> — has been confirmed. Confirmation emails are being sent.`,
    '#D1FAE5',
    true
  )
}
