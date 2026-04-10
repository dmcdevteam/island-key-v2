import { Resend } from 'resend';
import { createServerClient } from './supabase';

const FROM = 'onboarding@resend.dev';

function buildEmailHtml(data: {
  propertyName: string;
  guestName: string;
  guestPhone: string | null;
  itemTitle: string;
  bookingDate: string;
  pax: number;
  totalPrice: number;
  confirmationCode: string;
  paymentMethod: string;
}): string {
  const formattedDate = new Date(data.bookingDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedTotal = `€${data.totalPrice.toLocaleString('en', { minimumFractionDigits: 0 })}`;
  const paymentLabel = data.paymentMethod === 'stripe' ? 'Card (paid)' : 'Via WhatsApp';

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;width:40%">${label}</td>
      <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1B2D4F;border-bottom:1px solid #F3F4F6">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto">

    <!-- Header -->
    <div style="background:#1B2D4F;border-radius:8px 8px 0 0;padding:24px;text-align:center">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
      <h1 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">New Booking at ${data.propertyName}</h1>
    </div>

    <!-- Body -->
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151">A guest has booked an experience through Island Key. Details below.</p>

      <table style="width:100%;border-collapse:collapse">
        ${row('Experience', data.itemTitle)}
        ${row('Date', formattedDate)}
        ${row('Guests', `${data.pax} ${data.pax === 1 ? 'person' : 'people'}`)}
        ${row('Total', formattedTotal)}
        ${row('Payment', paymentLabel)}
        ${row('Reference', `<span style="color:#1A8A7D;font-family:monospace">${data.confirmationCode}</span>`)}
        ${row('Guest name', data.guestName)}
        ${data.guestPhone ? row('Guest WhatsApp', `<a href="https://wa.me/${data.guestPhone.replace(/\D/g, '')}" style="color:#25D366">${data.guestPhone}</a>`) : ''}
      </table>

      <!-- Note -->
      <div style="margin-top:24px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Island Key will confirm with the guest via WhatsApp.</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280">No action needed from you unless you need to contact the guest directly.</p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
      Island Key &mdash; Crete &mdash; <a href="https://islandkey.app" style="color:#9CA3AF">islandkey.app</a>
    </p>

  </div>
</body>
</html>`;
}

export async function sendHostNotification(
  bookingId: string,
  options?: { guestName?: string; guestPhone?: string | null }
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  console.log('[EMAIL] API key prefix:', apiKey?.slice(0, 8));
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('Email: RESEND_API_KEY not set — skipping host notification');
    return;
  }

  const supabase = createServerClient();

  // Fetch booking
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('item_title, booking_date, pax, total_price, confirmation_code, payment_method, property_id, guest_id')
    .eq('id', bookingId)
    .single();

  if (bErr || !booking) {
    console.error('Email: booking not found', bookingId, bErr?.message);
    return;
  }

  // Fetch property for host email
  if (!booking.property_id) {
    console.warn('Email: no property_id on booking', bookingId);
    return;
  }

  const { data: property, error: pErr } = await supabase
    .from('properties')
    .select('name, host_name, host_email')
    .eq('id', booking.property_id)
    .single();

  if (pErr || !property) {
    console.error('Email: property not found for booking', bookingId, pErr?.message);
    return;
  }

  if (!property.host_email) {
    console.warn('Email: no host_email for property', property.name, '— skipping');
    return;
  }

  // Resolve guest name/phone — prefer passed options, then look up guest record
  let guestName = options?.guestName ?? 'Guest';
  let guestPhone = options?.guestPhone ?? null;

  if (booking.guest_id && (!options?.guestName || !options?.guestPhone)) {
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name, whatsapp_number')
      .eq('id', booking.guest_id)
      .single();
    if (guest) {
      if (!options?.guestName && guest.first_name) guestName = guest.first_name;
      if (!options?.guestPhone && guest.whatsapp_number) guestPhone = guest.whatsapp_number;
    }
  }

  const resend = new Resend(apiKey);

  console.log('[EMAIL] Sending to:', property.host_email, '| from:', FROM);
  const { error: emailErr } = await resend.emails.send({
    from: FROM,
    to: property.host_email,
    subject: `New booking at ${property.name} — Ref: ${booking.confirmation_code}`,
    html: buildEmailHtml({
      propertyName: property.name,
      guestName,
      guestPhone,
      itemTitle: booking.item_title,
      bookingDate: booking.booking_date,
      pax: booking.pax,
      totalPrice: booking.total_price,
      confirmationCode: booking.confirmation_code,
      paymentMethod: booking.payment_method ?? 'whatsapp',
    }),
  });

  if (emailErr) {
    console.error('Email: Resend send failed', emailErr);
  } else {
    console.log('Email: host notified at', property.host_email, 'for booking', booking.confirmation_code);
  }
}
