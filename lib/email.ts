import { Resend } from 'resend';
import { createServerClient } from './supabase';

const FROM = 'bookings@islandkey.gr';

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
      <h1 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">New Enquiry at ${data.propertyName}</h1>
    </div>

    <!-- Body -->
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151">A guest has submitted an availability enquiry through Island Key. Details below.</p>

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
      Island Key &mdash; Crete &mdash; <a href="https://app.islandkey.gr" style="color:#9CA3AF">app.islandkey.gr</a>
    </p>

  </div>
</body>
</html>`;
}

function buildGuestEmailHtml(data: {
  guestName: string;
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
  const paymentLabel = data.paymentMethod === 'stripe' ? 'Card (paid online)' : 'Via WhatsApp';

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
      <h1 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">Enquiry received</h1>
    </div>

    <!-- Body -->
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151">Hi ${data.guestName}, we've received your enquiry! Your Island Key curator will check availability and get back to you on WhatsApp within a few hours.</p>

      <table style="width:100%;border-collapse:collapse">
        ${row('Experience', data.itemTitle)}
        ${row('Date', formattedDate)}
        ${row('Guests', `${data.pax} ${data.pax === 1 ? 'person' : 'people'}`)}
        ${row('Total', formattedTotal)}
        ${row('Payment', paymentLabel)}
        ${row('Reference', `<span style="color:#1A8A7D;font-family:monospace;font-size:15px">${data.confirmationCode}</span>`)}
      </table>

      <!-- Note -->
      <div style="margin-top:24px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Your curator will be in touch via WhatsApp within a few hours.</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280">No payment is taken until availability is confirmed. Keep your reference number handy.</p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
      Island Key &mdash; Crete &mdash; <a href="https://app.islandkey.gr" style="color:#9CA3AF">app.islandkey.gr</a>
    </p>

  </div>
</body>
</html>`;
}

export async function sendGuestConfirmation(data: {
  to: string;
  guestName: string;
  itemTitle: string;
  bookingDate: string;
  pax: number;
  totalPrice: number;
  confirmationCode: string;
  paymentMethod: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('Email: RESEND_API_KEY not set — skipping guest confirmation');
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Enquiry received — Ref: ${data.confirmationCode}`,
    html: buildGuestEmailHtml(data),
  });

  if (error) {
    console.error('Email: guest confirmation failed', error);
  } else {
    console.log('Email: guest confirmation sent to', data.to, 'for booking', data.confirmationCode);
  }
}

const INTERNAL_EMAIL = 'dmcdevteam@gmail.com';

export async function sendInternalNotification(
  bookingId: string,
  options?: { guestEmail?: string }
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') return;

  const supabase = createServerClient();

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, item_title, booking_date, pax, total_price, unit_price, confirmation_code, payment_method, property_id, guest_id, guest_name, guest_email, action_token')
    .eq('id', bookingId)
    .single();

  if (bErr || !booking) {
    console.error('Internal email: booking not found', bookingId, bErr?.message);
    return;
  }

  let propertyName = '—';
  if (booking.property_id) {
    const { data: prop } = await supabase
      .from('properties')
      .select('name')
      .eq('id', booking.property_id)
      .single();
    if (prop?.name) propertyName = prop.name;
  }

  let guestName = 'Guest', guestPhone = '—', guestEmail = options?.guestEmail ?? '—';
  if (booking.guest_id) {
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name, whatsapp_number')
      .eq('id', booking.guest_id)
      .single();
    if (guest) {
      if (guest.first_name) guestName = guest.first_name;
      if (guest.whatsapp_number) guestPhone = guest.whatsapp_number;
    }
  }

  const formattedDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  const paymentLabel = booking.payment_method === 'stripe' ? 'Card (Stripe)' : 'WhatsApp';

  // Use guest_email from booking record if not passed in options
  if (guestEmail === '—' && (booking as Record<string, unknown>).guest_email) {
    guestEmail = (booking as Record<string, unknown>).guest_email as string;
  }
  if (guestName === 'Guest' && (booking as Record<string, unknown>).guest_name) {
    guestName = (booking as Record<string, unknown>).guest_name as string;
  }

  const rows = [
    ['Ref',         booking.confirmation_code],
    ['Activity',    booking.item_title],
    ['Date',        formattedDate],
    ['Guests',      String(booking.pax)],
    ['Unit price',  `€${booking.unit_price}`],
    ['Total',       `€${booking.total_price}`],
    ['Payment',     paymentLabel],
    ['Property',    propertyName],
    ['Guest name',  guestName],
    ['Guest email', guestEmail],
    ['Guest WA',    guestPhone],
  ].map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;color:#6B7280;font-size:13px;white-space:nowrap">${k}</td><td style="padding:5px 0;font-size:13px;font-weight:600;color:#111">${v}</td></tr>`).join('');

  const baseUrl = 'https://app.islandkey.gr';
  const actionButtons = (booking as Record<string, unknown>).action_token
    ? `<div style="margin-top:24px;display:flex;gap:12px">
        <a href="${baseUrl}/api/bookings/${bookingId}/confirm?token=${(booking as Record<string, unknown>).action_token}"
           style="flex:1;display:block;text-align:center;padding:12px 0;background:#1A8A7D;color:white;font-size:14px;font-weight:700;border-radius:6px;text-decoration:none">
          ✓ Confirm this booking
        </a>
        <a href="${baseUrl}/api/bookings/${bookingId}/cancel?token=${(booking as Record<string, unknown>).action_token}"
           style="flex:1;display:block;text-align:center;padding:12px 0;background:#DC2626;color:white;font-size:14px;font-weight:700;border-radius:6px;text-decoration:none">
          ✕ Cancel this booking
        </a>
      </div>`
    : '';

  const html = `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#f9f9f9">
<div style="max-width:480px;background:white;padding:24px;border:1px solid #e5e7eb;border-radius:6px">
<p style="margin:0 0 16px;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px">Island Key — Internal Booking Alert</p>
<table style="border-collapse:collapse;width:100%">${rows}</table>
${actionButtons}
</div></body></html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: INTERNAL_EMAIL,
    subject: `[IK Enquiry] ${booking.confirmation_code} — ${booking.item_title} — ${propertyName}`,
    html,
  });

  if (error) console.error('Internal email: Resend failed', error);
  else console.log('Internal email: sent for booking', booking.confirmation_code);
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
    subject: `[IK Enquiry] ${booking.confirmation_code} — ${booking.item_title} — ${property.name}`,
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

const TEAM_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '306974176759';

export async function sendGuestBookingConfirmed(data: {
  to: string;
  bookingId: string;
  guestName: string;
  itemTitle: string;
  bookingDate: string;
  pax: number;
  confirmationCode: string;
  itemId: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('Email: RESEND_API_KEY not set — skipping guest booking confirmed');
    return;
  }

  const formattedDate = new Date(data.bookingDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Optionally fetch activity details
  let meetingPoint: string | null = null;
  let includes: string[] | null = null;
  let goodToKnow: string | null = null;

  if (data.itemId) {
    const supabase = createServerClient();
    const { data: activity } = await supabase
      .from('activities')
      .select('meeting_point, includes, good_to_know')
      .eq('id', data.itemId)
      .single();
    if (activity) {
      meetingPoint = activity.meeting_point ?? null;
      includes = activity.includes ?? null;
      goodToKnow = activity.good_to_know ?? null;
    }
  }

  const includesHtml = includes && includes.length > 0
    ? `<div style="margin-top:20px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px">What's included</p>
        <ul style="margin:0;padding:0;list-style:none">
          ${includes.map(item => `<li style="padding:3px 0;font-size:13px;color:#374151">&#10003; ${item}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const meetingHtml = meetingPoint
    ? `<div style="margin-top:20px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1A8A7D;text-transform:uppercase;letter-spacing:0.5px">Meeting point</p>
        <p style="margin:0;font-size:13px;color:#374151">${meetingPoint}</p>
      </div>`
    : '';

  const goodToKnowHtml = goodToKnow
    ? `<div style="margin-top:16px;padding:14px 16px;background:#FFFBEB;border-left:3px solid #D97706;border-radius:0 6px 6px 0">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:0.5px">Good to know</p>
        <p style="margin:0;font-size:13px;color:#374151">${goodToKnow}</p>
      </div>`
    : '';

  const waNumber = TEAM_WHATSAPP.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto">

    <!-- Header -->
    <div style="background:#1A8A7D;border-radius:8px 8px 0 0;padding:24px;text-align:center">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
      <h1 style="margin:6px 0 4px;color:white;font-size:20px;font-weight:700">Booking Confirmed!</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px">${data.itemTitle}</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151">Hi ${data.guestName}, great news — your experience is confirmed. We're looking forward to seeing you!</p>

      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;width:40%">Reference</td>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1A8A7D;border-bottom:1px solid #F3F4F6;font-family:monospace">${data.confirmationCode}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;width:40%">Experience</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1B2D4F;border-bottom:1px solid #F3F4F6">${data.itemTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;width:40%">Date</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1B2D4F;border-bottom:1px solid #F3F4F6">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;width:40%">Group size</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1B2D4F">${data.pax} ${data.pax === 1 ? 'person' : 'people'}</td>
        </tr>
      </table>

      ${meetingHtml}
      ${includesHtml}
      ${goodToKnowHtml}

      <!-- WhatsApp CTA -->
      <div style="margin-top:24px;text-align:center">
        <p style="margin:0 0 12px;font-size:13px;color:#6B7280">Questions? Message your Island Key curator directly on WhatsApp.</p>
        <a href="${waUrl}" style="display:inline-block;padding:12px 28px;background:#25D366;color:white;font-size:14px;font-weight:700;border-radius:24px;text-decoration:none">
          Message us on WhatsApp
        </a>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
      Island Key &mdash; Crete &mdash; <a href="https://app.islandkey.gr" style="color:#9CA3AF">app.islandkey.gr</a>
    </p>

  </div>
</body>
</html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Confirmed — ${data.itemTitle} · ${data.confirmationCode}`,
    html,
  });

  if (error) console.error('Email: sendGuestBookingConfirmed failed', error);
  else console.log('Email: booking confirmed sent to', data.to, 'ref', data.confirmationCode);
}

export async function sendGuestBookingCancelled(data: {
  to: string;
  guestName: string;
  itemTitle: string;
  bookingDate: string;
  confirmationCode: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('Email: RESEND_API_KEY not set — skipping guest booking cancelled');
    return;
  }

  const formattedDate = new Date(data.bookingDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const waNumber = TEAM_WHATSAPP.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto">

    <!-- Header -->
    <div style="background:#1B2D4F;border-radius:8px 8px 0 0;padding:24px;text-align:center">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
      <h1 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">Booking Cancelled</h1>
    </div>

    <!-- Body -->
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 16px;font-size:14px;color:#374151">Hi ${data.guestName}, we're sorry to let you know that your booking has been cancelled.</p>

      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;width:40%">Reference</td>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:#374151;border-bottom:1px solid #F3F4F6;font-family:monospace">${data.confirmationCode}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;width:40%">Experience</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1B2D4F;border-bottom:1px solid #F3F4F6">${data.itemTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;width:40%">Date</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1B2D4F">${formattedDate}</td>
        </tr>
      </table>

      <!-- Offer to rebook -->
      <div style="margin-top:24px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">We'd love to help you find an alternative.</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280">Message us on WhatsApp and your Island Key curator will suggest the best available options for your dates.</p>
      </div>

      <div style="margin-top:20px;text-align:center">
        <a href="${waUrl}" style="display:inline-block;padding:12px 28px;background:#25D366;color:white;font-size:14px;font-weight:700;border-radius:24px;text-decoration:none">
          Message us on WhatsApp
        </a>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
      Island Key &mdash; Crete &mdash; <a href="https://app.islandkey.gr" style="color:#9CA3AF">app.islandkey.gr</a>
    </p>

  </div>
</body>
</html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Booking cancelled — ${data.confirmationCode}`,
    html,
  });

  if (error) console.error('Email: sendGuestBookingCancelled failed', error);
  else console.log('Email: booking cancelled sent to', data.to, 'ref', data.confirmationCode);
}

// ─── Transfer confirmation emails ────────────────────────────────────────────
// Sent by admin when status → 'confirmed'.
// Returns the pre-filled WhatsApp message text so the API can build a deep link.
export async function sendTransferConfirmationEmails(bookingId: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('[transferConfirm] RESEND_API_KEY not set — skipping');
    return null;
  }

  const supabase = createServerClient();

  const { data: b, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_title, booking_date, booking_time, pax, pax_count, luggage_count, total_price, guest_name, guest_email, guest_id, property_id, provider_id, pickup_at, pickup_location, dropoff_location, vehicle_class, flight_number, driver_name, driver_phone, extras, notes, guest_notes, transfer_type, distance_km')
    .eq('id', bookingId)
    .single();

  if (error || !b) {
    console.error('[transferConfirm] booking not found', bookingId, error?.message);
    return null;
  }

  const ref        = b.confirmation_code as string;
  const guestName  = (b.guest_name  as string | null) ?? 'Guest';
  const guestEmail = (b.guest_email as string | null) ?? null;

  // Resolve guest WhatsApp
  let guestPhone: string | null = null;
  if (b.guest_id) {
    const { data: g } = await supabase
      .from('guests').select('whatsapp_number').eq('id', b.guest_id as string).single();
    if (g?.whatsapp_number) guestPhone = g.whatsapp_number;
  }

  const pickupAt  = b.pickup_at as string | null;
  const pickupFmt = pickupAt
    ? new Date(pickupAt).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
  const pickupDateOnly = pickupAt
    ? new Date(pickupAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const pickupTimeOnly = pickupAt
    ? new Date(pickupAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const route      = `${b.pickup_location ?? '—'} → ${b.dropoff_location ?? '—'}`;
  const vehicle    = (b.vehicle_class as string | null) ?? '—';
  const pax        = (b.pax_count ?? b.pax ?? '—') as string | number;
  const luggage    = (b.luggage_count as number | null) ?? '—';
  const flight     = (b.flight_number as string | null) ?? null;
  const driverName = (b.driver_name  as string | null) ?? null;
  const driverPhone= (b.driver_phone as string | null) ?? null;
  const extrasArr  = (b.extras as string[] | null) ?? [];
  const notes      = ((b.notes ?? b.guest_notes) as string | null) ?? null;

  const tableRow = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top">${k}</td>` +
    `<td style="padding:6px 0;font-size:13px;font-weight:600;color:#111">${v}</td></tr>`;

  const waNumber = TEAM_WHATSAPP.replace(/\D/g, '');
  const resend   = new Resend(apiKey);

  // ── 1. Guest confirmation email ────────────────────────────────────────────
  if (guestEmail) {
    const driverRow = driverName
      ? tableRow('Driver', `${driverName}${driverPhone ? ` &mdash; ${driverPhone}` : ''}`)
      : tableRow('Driver', '<span style="color:#D97706">Your driver details will follow shortly</span>');

    const guestRows = [
      tableRow('Reference',  `<span style="font-family:monospace;font-size:15px;color:#1A8A7D">${ref}</span>`),
      tableRow('Route',      route),
      tableRow('Date & time', pickupFmt),
      tableRow('Vehicle',    vehicle),
      tableRow('Passengers', `${pax} passengers · ${luggage} bags`),
      driverRow,
      flight ? tableRow('Flight', flight) : '',
      extrasArr.length > 0 ? tableRow('Extras', extrasArr.join(', ')) : '',
      notes ? tableRow('Notes', notes) : '',
    ].join('');

    const guestHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <div style="background:#1A8A7D;border-radius:8px 8px 0 0;padding:24px;text-align:center">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
      <h1 style="margin:6px 0 4px;color:white;font-size:22px;font-weight:700">Transfer Confirmed!</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px">${route}</p>
    </div>
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151">Hi ${guestName}, your Island Key transfer is confirmed. Here are your full details.</p>
      <table style="width:100%;border-collapse:collapse">${guestRows}</table>
      <div style="margin-top:20px;padding:14px 16px;background:#FFFBEB;border-left:3px solid #D97706;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:12px;color:#92400E;font-weight:600">Cancellation policy</p>
        <p style="margin:4px 0 0;font-size:12px;color:#374151">Free cancellation up to 24h before pickup. Cancellations within 24h are non-refundable.</p>
      </div>
      <div style="margin-top:24px;text-align:center">
        <p style="margin:0 0 12px;font-size:13px;color:#6B7280">Questions? Message your Island Key curator on WhatsApp.</p>
        <a href="https://wa.me/${waNumber}" style="display:inline-block;padding:12px 28px;background:#25D366;color:white;font-size:14px;font-weight:700;border-radius:24px;text-decoration:none">
          Message us on WhatsApp
        </a>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
      Island Key &mdash; Crete &mdash; <a href="https://app.islandkey.gr" style="color:#9CA3AF">app.islandkey.gr</a>
    </p>
  </div>
</body>
</html>`;

    try {
      const { error: e } = await resend.emails.send({
        from: FROM, to: guestEmail,
        subject: `Your transfer is confirmed — ${ref}`,
        html: guestHtml,
      });
      if (e) throw e;
      console.log('[transferConfirm] guest email sent to', guestEmail, ref);
    } catch (e) {
      console.error('[transferConfirm] guest email failed:', e);
    }
  }

  // ── 2. Internal / Spyros email ─────────────────────────────────────────────
  const internalRows = [
    tableRow('Ref',       `<span style="font-family:monospace;color:#1A8A7D">${ref}</span>`),
    tableRow('Route',     route),
    tableRow('Pickup',    pickupFmt),
    tableRow('Vehicle',   vehicle),
    tableRow('Pax',       String(pax)),
    tableRow('Luggage',   String(luggage)),
    flight ? tableRow('Flight', flight) : '',
    extrasArr.length > 0 ? tableRow('Extras', extrasArr.join(', ')) : '',
    notes ? tableRow('Notes', notes) : '',
    tableRow('Guest',     guestName),
    guestEmail ? tableRow('Email', guestEmail) : '',
    guestPhone ? tableRow('WhatsApp', `<a href="https://wa.me/${guestPhone.replace(/\D/g,'')}" style="color:#25D366">${guestPhone}</a>`) : '',
    tableRow('Driver',    driverName ? `${driverName}${driverPhone ? ` · ${driverPhone}` : ''}` : '<span style="color:#D97706">⚠ Not yet assigned</span>'),
  ].join('');

  const driverAlert = !driverName
    ? `<div style="margin-top:20px;padding:14px 16px;background:#FFFBEB;border-left:3px solid #D97706;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#92400E;font-weight:600">Action: Assign driver &amp; message guest on WhatsApp</p>
        <p style="margin:4px 0 0;font-size:12px;color:#374151">No driver has been assigned yet. Once arranged, use the admin panel to assign and send the WhatsApp confirmation to the guest.</p>
      </div>`
    : `<div style="margin-top:20px;padding:14px 16px;background:#F0FDF4;border-left:3px solid #15803D;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#15803D;font-weight:600">Driver assigned: ${driverName}${driverPhone ? ` · ${driverPhone}` : ''}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#374151">Send the WhatsApp confirmation to the guest if not done yet.</p>
      </div>`;

  const internalHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1A8A7D;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key — Transfer Confirmed</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">${ref} — ${route}</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <table style="border-collapse:collapse;width:100%">${internalRows}</table>
    ${driverAlert}
    <div style="margin-top:20px">
      <a href="https://app.islandkey.gr/admin/transfer-bookings" style="display:inline-block;padding:10px 20px;background:#1B2D4F;color:white;font-size:13px;font-weight:700;border-radius:6px;text-decoration:none">
        View in Admin →
      </a>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

  try {
    const { error: e } = await resend.emails.send({
      from: FROM, to: INTERNAL_EMAIL,
      subject: `Transfer confirmed — ${ref}${!driverName ? ' — action needed' : ''}`,
      html: internalHtml,
    });
    if (e) throw e;
    console.log('[transferConfirm] internal email sent, ref', ref);
  } catch (e) {
    console.error('[transferConfirm] internal email failed:', e);
  }

  // ── 3. Host email ──────────────────────────────────────────────────────────
  if (b.property_id) {
    const { data: prop } = await supabase
      .from('properties')
      .select('name, host_name, host_email')
      .eq('id', b.property_id as string)
      .single();

    if (prop?.host_email) {
      const hostRows = [
        tableRow('Ref',       `<span style="font-family:monospace;color:#1A8A7D">${ref}</span>`),
        tableRow('Route',     route),
        tableRow('Pickup',    pickupFmt),
        tableRow('Vehicle',   vehicle),
        tableRow('Pax',       `${pax} passengers · ${luggage} bags`),
        tableRow('Guest',     guestName),
        driverName ? tableRow('Driver', `${driverName}${driverPhone ? ` · ${driverPhone}` : ''}`) : '',
        extrasArr.length > 0 ? tableRow('Extras', extrasArr.join(', ')) : '',
      ].join('');

      const hostHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1A8A7D;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">Transfer confirmed for your guest</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px;font-size:14px;color:#374151">A transfer has been confirmed for a guest staying at <strong>${prop.name}</strong>.</p>
    <table style="border-collapse:collapse;width:100%">${hostRows}</table>
    <div style="margin-top:20px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
      <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Island Key is managing this transfer.</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6B7280">No action needed from you unless you need to coordinate directly with the guest.</p>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

      try {
        const { error: e } = await resend.emails.send({
          from: FROM, to: prop.host_email,
          subject: `[IK Transfer] ${ref} confirmed — ${guestName} · ${prop.name}`,
          html: hostHtml,
        });
        if (e) throw e;
        console.log('[transferConfirm] host email sent to', prop.host_email);
      } catch (e) {
        console.error('[transferConfirm] host email failed:', e);
      }
    }
  }

  // ── 4. Provider email ──────────────────────────────────────────────────────
  if (b.provider_id) {
    const { data: prov } = await supabase
      .from('providers')
      .select('name, email')
      .eq('id', b.provider_id as string)
      .single();

    const providerEmail = (prov as Record<string, unknown> | null)?.email as string | null ?? null;

    if (providerEmail) {
      const provRows = [
        tableRow('Ref',      `<span style="font-family:monospace">${ref}</span>`),
        tableRow('Route',    route),
        tableRow('Pickup',   pickupFmt),
        tableRow('Vehicle',  vehicle),
        tableRow('Pax',      `${pax} passengers · ${luggage} bags`),
        flight ? tableRow('Flight', flight) : '',
        extrasArr.length > 0 ? tableRow('Extras', extrasArr.join(', ')) : '',
        notes ? tableRow('Notes', notes) : '',
      ].join('');

      const provHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1B2D4F;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">Transfer booking — ${ref}</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px;font-size:14px;color:#374151">A transfer has been confirmed through Island Key. Please prepare for the following.</p>
    <table style="border-collapse:collapse;width:100%">${provRows}</table>
    <div style="margin-top:20px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
      <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Island Key is the point of contact for this booking.</p>
      <p style="margin:6px 0 0;font-size:13px;color:#374151">
        WhatsApp: <a href="https://wa.me/${waNumber}" style="color:#25D366">+${waNumber}</a><br>
        Email: <a href="mailto:${INTERNAL_EMAIL}" style="color:#1B2D4F">${INTERNAL_EMAIL}</a>
      </p>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

      try {
        const { error: e } = await resend.emails.send({
          from: FROM, to: providerEmail,
          subject: `[Island Key Transfer] ${ref} — ${route} — ${pickupDateOnly}`,
          html: provHtml,
        });
        if (e) throw e;
        console.log('[transferConfirm] provider email sent to', providerEmail);
      } catch (e) {
        console.error('[transferConfirm] provider email failed:', e);
      }
    }
  }

  // ── 5. Build WhatsApp message for Spyros → guest ───────────────────────────
  const lines = [
    `Hi ${guestName}, your Island Key transfer is confirmed! 🎉`,
    ``,
    `📍 Route: ${route}`,
    `📅 Date: ${pickupDateOnly} at ${pickupTimeOnly}`,
    `🚗 Vehicle: ${vehicle}`,
    ...(driverName ? [`👤 Driver: ${driverName}${driverPhone ? `, ${driverPhone}` : ''}`] : []),
    `📋 Reference: ${ref}`,
    ``,
    `Free cancellation up to 24h before pickup.`,
    `Any questions? Reply here anytime. 🌿`,
  ];

  const waText = lines.join('\n');
  const waHref = guestPhone
    ? `https://wa.me/${guestPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return waHref;
}

// ─── Transfer enquiry emails ─────────────────────────────────────────────────
// Sends internal alert + guest receipt when a transfer enquiry is submitted.
export async function sendTransferEnquiryEmails(bookingId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('[transferEmails] RESEND_API_KEY not set — skipping');
    return;
  }

  const supabase = createServerClient();

  const { data: b, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_title, booking_date, booking_time, pax, pax_count, total_price, payment_method, guest_name, guest_email, guest_id, pickup_at, pickup_location, dropoff_location, vehicle_class, flight_number, luggage_count, distance_km, duration_min, extras, notes, guest_notes, transfer_type')
    .eq('id', bookingId)
    .single();

  if (error || !b) {
    console.error('[transferEmails] booking not found', bookingId, error?.message);
    return;
  }

  const ref       = b.confirmation_code as string;
  const guestName = (b.guest_name as string | null) ?? 'Guest';
  const guestEmail = (b.guest_email as string | null) ?? null;

  // Resolve phone from guest record
  let guestPhone: string | null = null;
  if (b.guest_id) {
    const { data: g } = await supabase
      .from('guests').select('first_name, whatsapp_number').eq('id', b.guest_id as string).single();
    if (g?.whatsapp_number) guestPhone = g.whatsapp_number;
  }

  const pickupAt   = b.pickup_at as string | null;
  const pickupFmt  = pickupAt
    ? new Date(pickupAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ((b.booking_date as string) ? new Date((b.booking_date as string) + 'T' + ((b.booking_time as string) ?? '00:00') + ':00').toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

  const route      = `${b.pickup_location ?? '—'} → ${b.dropoff_location ?? '—'}`;
  const vehicle    = (b.vehicle_class as string | null) ?? '—';
  const pax        = (b.pax_count ?? b.pax ?? '—') as string | number;
  const luggage    = (b.luggage_count as number | null) ?? '—';
  const flight     = (b.flight_number as string | null) ?? 'N/A';
  const extrasArr  = (b.extras as string[] | null) ?? [];
  const notes      = (b.notes ?? b.guest_notes) as string | null;
  const distKm     = b.distance_km as number | null;

  const tableRow = (k: string, v: string) =>
    `<tr><td style="padding:5px 12px 5px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top">${k}</td>` +
    `<td style="padding:5px 0;font-size:13px;font-weight:600;color:#111">${v}</td></tr>`;

  const resend = new Resend(apiKey);

  // ── 1. Internal email ──────────────────────────────────────────────────────
  const internalRows = [
    tableRow('Ref',       `<span style="font-family:monospace;color:#1A8A7D">${ref}</span>`),
    tableRow('Route',     route),
    tableRow('Pickup',    pickupFmt),
    tableRow('Vehicle',   vehicle),
    tableRow('Pax',       String(pax)),
    tableRow('Luggage',   String(luggage)),
    tableRow('Flight',    flight),
    extrasArr.length > 0 ? tableRow('Extras', extrasArr.join(', ')) : '',
    notes ? tableRow('Notes', notes) : '',
    distKm ? tableRow('Distance', `~${distKm} km`) : '',
    tableRow('Guest',     guestName),
    guestEmail ? tableRow('Email',   guestEmail) : '',
    guestPhone ? tableRow('WhatsApp', `<a href="https://wa.me/${guestPhone.replace(/\D/g,'')}" style="color:#25D366">${guestPhone}</a>`) : '',
  ].join('');

  const internalHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1B2D4F;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key — Transfer Enquiry</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">${route}</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <table style="border-collapse:collapse;width:100%">${internalRows}</table>
    <div style="margin-top:20px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
      <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Action required: assign a driver and confirm via WhatsApp.</p>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

  try {
    const { error: e } = await resend.emails.send({
      from: FROM,
      to:   INTERNAL_EMAIL,
      subject: `[IK Transfer] ${ref} — ${route} — ${guestName}`,
      html: internalHtml,
    });
    if (e) throw e;
    console.log('[transferEmails] internal sent, ref', ref);
  } catch (e) {
    console.error('[transferEmails] internal failed:', e);
  }

  // ── 2. Guest email ─────────────────────────────────────────────────────────
  if (guestEmail) {
    const guestRows = [
      tableRow('Reference', `<span style="font-family:monospace;font-size:15px;color:#1A8A7D">${ref}</span>`),
      tableRow('Route',     route),
      tableRow('Pickup',    pickupFmt),
      tableRow('Vehicle',   vehicle),
      tableRow('Passengers', String(pax)),
      tableRow('Payment',   'Via WhatsApp'),
    ].join('');

    const waNumber = TEAM_WHATSAPP.replace(/\D/g, '');
    const guestHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <div style="background:#1B2D4F;border-radius:8px 8px 0 0;padding:24px;text-align:center">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
      <h1 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">Transfer request received</h1>
    </div>
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151">Hi ${guestName}, we've received your transfer request! We'll confirm your driver and send full details via WhatsApp within 2 hours.</p>
      <table style="width:100%;border-collapse:collapse">${guestRows}</table>
      <div style="margin-top:24px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">We'll confirm your driver within 2 hours.</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280">Keep your reference number handy: <strong>${ref}</strong></p>
      </div>
      <div style="margin-top:24px;text-align:center">
        <a href="https://wa.me/${waNumber}" style="display:inline-block;padding:12px 28px;background:#25D366;color:white;font-size:14px;font-weight:700;border-radius:24px;text-decoration:none">
          Message us on WhatsApp
        </a>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
      Island Key &mdash; Crete &mdash; <a href="https://app.islandkey.gr" style="color:#9CA3AF">app.islandkey.gr</a>
    </p>
  </div>
</body>
</html>`;

    try {
      const { error: e } = await resend.emails.send({
        from: FROM,
        to:   guestEmail,
        subject: `Transfer request received — Ref: ${ref}`,
        html: guestHtml,
      });
      if (e) throw e;
      console.log('[transferEmails] guest sent to', guestEmail, 'ref', ref);
    } catch (e) {
      console.error('[transferEmails] guest failed:', e);
    }
  }
}

// ─── All-in-one confirmation email sender ────────────────────────────────────
// Sends to four parties: guest, internal (IK/Spyros), host, provider.
// Each send is wrapped in its own try/catch so one failure never blocks others.
// IMPORTANT: must be awaited by the caller — do NOT call fire-and-forget in
// serverless environments or emails after the first may be dropped.
export async function sendAllConfirmationEmails(bookingId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-api-key-here') {
    console.warn('[confirmEmails] RESEND_API_KEY not set — skipping');
    return;
  }

  const supabase = createServerClient();

  // ── Fetch booking ──
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, confirmation_code, item_type, item_id, item_title, booking_date, pax, total_price, payment_method, property_id, guest_id, guest_name, guest_email, guest_notes, action_token')
    .eq('id', bookingId)
    .single();

  if (bErr || !booking) {
    console.error('[confirmEmails] booking not found', bookingId, bErr?.message);
    return;
  }

  const ref        = booking.confirmation_code as string;
  const itemTitle  = booking.item_title as string;
  const bookingDate = booking.booking_date as string;
  const pax        = booking.pax as number;
  const guestNotes = (booking.guest_notes as string | null) ?? null;

  const formattedDate = new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Fetch property + host ──
  let propertyName = '—';
  let hostEmail:  string | null = null;
  let hostName:   string | null = null;
  let hostPhone:  string | null = null;
  if (booking.property_id) {
    const { data: prop } = await supabase
      .from('properties')
      .select('name, host_name, host_email, host_phone')
      .eq('id', booking.property_id)
      .single();
    if (prop) {
      propertyName = prop.name ?? '—';
      hostEmail    = (prop as Record<string, unknown>).host_email as string ?? null;
      hostName     = (prop as Record<string, unknown>).host_name  as string ?? null;
      hostPhone    = (prop as Record<string, unknown>).host_phone as string ?? null;
    }
  }

  // ── Resolve guest details ──
  let guestName  = (booking.guest_name  as string | null) ?? 'Guest';
  let guestEmail = (booking.guest_email as string | null) ?? null;
  let guestPhone: string | null = null;

  if (booking.guest_id) {
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name, whatsapp_number')
      .eq('id', booking.guest_id)
      .single();
    if (guest) {
      if (!guestName || guestName === 'Guest') guestName = guest.first_name ?? 'Guest';
      if (guest.whatsapp_number) guestPhone = guest.whatsapp_number;
    }
  }

  // ── Fetch activity details ──
  let providerId:       string | null   = null;
  let meetingPoint:     string | null   = null;
  let activityIncludes: string[] | null = null;

  if (booking.item_type === 'activity' && booking.item_id) {
    const { data: act } = await supabase
      .from('activities')
      .select('provider_id, meeting_point, includes')
      .eq('id', booking.item_id as string)
      .single();
    if (act) {
      providerId       = act.provider_id   ?? null;
      meetingPoint     = act.meeting_point ?? null;
      activityIncludes = act.includes      ?? null;
    }
  }

  // ── Fetch provider ──
  // Column is 'email', not 'contact_email'
  let providerEmail: string | null = null;
  let providerName:  string | null = null;
  let providerPhone: string | null = null;
  if (providerId) {
    const { data: prov } = await supabase
      .from('providers')
      .select('name, email, contact_phone')
      .eq('id', providerId)
      .single();
    if (prov) {
      providerName  = (prov as Record<string, unknown>).name          as string ?? null;
      providerEmail = (prov as Record<string, unknown>).email         as string ?? null;
      providerPhone = (prov as Record<string, unknown>).contact_phone as string ?? null;
    }
  }

  const resend  = new Resend(apiKey);
  const teamWa  = TEAM_WHATSAPP.replace(/\D/g, '');
  const adminUrl = 'https://app.islandkey.gr/admin/bookings';

  const tr = (k: string, v: string) =>
    `<tr><td style="padding:5px 12px 5px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top">${k}</td>` +
    `<td style="padding:5px 0;font-size:13px;font-weight:600;color:#111">${v}</td></tr>`;

  // ── 1. Guest confirmation email ────────────────────────────────────────────
  if (guestEmail) {
    try {
      await sendGuestBookingConfirmed({
        to: guestEmail,
        bookingId,
        guestName,
        itemTitle,
        bookingDate,
        pax,
        confirmationCode: ref,
        itemId: booking.item_type === 'activity' ? (booking.item_id as string) : null,
      });
      console.log('[confirmEmails] guest email sent to', guestEmail);
    } catch (e) {
      console.error('[confirmEmails] guest email failed:', e);
    }
  }

  // ── 2. Internal / Spyros email ─────────────────────────────────────────────
  // Full details: guest contacts, host contacts, provider contacts, notes.
  try {
    const internalRows = [
      tr('Ref',      `<span style="font-family:monospace;color:#1A8A7D">${ref}</span>`),
      tr('Activity', itemTitle),
      tr('Date',     formattedDate),
      tr('Guests',   `${pax} ${pax === 1 ? 'person' : 'people'}`),
      tr('Property', propertyName),
      hostName  ? tr('Host',       hostName + (hostPhone ? ` · ${hostPhone}` : '')) : '',
      hostEmail ? tr('Host email', `<a href="mailto:${hostEmail}" style="color:#1B2D4F">${hostEmail}</a>`) : '',
      tr('Guest',    guestName),
      guestEmail ? tr('Guest email', guestEmail) : '',
      guestPhone ? tr('Guest WA',    `<a href="https://wa.me/${guestPhone.replace(/\D/g,'')}" style="color:#25D366">${guestPhone}</a>`) : '',
      guestNotes ? tr('Notes',       guestNotes) : '',
      providerName  ? tr('Provider',       providerName + (providerPhone ? ` · ${providerPhone}` : '')) : '',
      providerEmail ? tr('Provider email', `<a href="mailto:${providerEmail}" style="color:#1B2D4F">${providerEmail}</a>`) : '',
    ].join('');

    const providerReminder = providerEmail
      ? `<div style="margin-top:16px;padding:12px 16px;background:#FFFBEB;border-left:3px solid #D97706;border-radius:0 6px 6px 0">
          <p style="margin:0;font-size:13px;color:#92400E;font-weight:600">Reminder: confirm with provider</p>
          <p style="margin:4px 0 0;font-size:12px;color:#374151">Verify ${providerName ?? 'the provider'} has the booking locked in if not done yet.</p>
        </div>`
      : '';

    const internalHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1A8A7D;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key — Booking Confirmed</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">CONFIRMED — ${ref}</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <table style="border-collapse:collapse;width:100%">${internalRows}</table>
    ${providerReminder}
    <div style="margin-top:20px">
      <a href="${adminUrl}" style="display:inline-block;padding:10px 20px;background:#1B2D4F;color:white;font-size:13px;font-weight:700;border-radius:6px;text-decoration:none">
        View in Admin →
      </a>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

    const { error } = await resend.emails.send({
      from: FROM, to: INTERNAL_EMAIL,
      subject: `CONFIRMED — ${ref} — ${itemTitle} — ${guestName}`,
      html: internalHtml,
    });
    if (error) throw error;
    console.log('[confirmEmails] internal email sent');
  } catch (e) {
    console.error('[confirmEmails] internal email failed:', e);
  }

  // ── 3. Host email ──────────────────────────────────────────────────────────
  // Guest info + commission note. No provider details.
  if (hostEmail) {
    try {
      const hostRows = [
        tr('Ref',      `<span style="font-family:monospace;color:#1A8A7D">${ref}</span>`),
        tr('Activity', itemTitle),
        tr('Date',     formattedDate),
        tr('Guests',   `${pax} ${pax === 1 ? 'person' : 'people'}`),
      ].join('');

      const hostHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1A8A7D;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">Guest booking confirmed — ${propertyName}</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px;font-size:14px;color:#374151"><strong>${guestName}</strong> has confirmed a booking through Island Key for your property <strong>${propertyName}</strong>.</p>
    <table style="border-collapse:collapse;width:100%">${hostRows}</table>
    <div style="margin-top:20px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
      <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Commission</p>
      <p style="margin:4px 0 0;font-size:12px;color:#374151">Your commission for this booking will be processed at the end of the month.</p>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#374151">Questions? Message Island Key: <a href="https://wa.me/${teamWa}" style="color:#25D366">+${teamWa}</a></p>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

      const { error } = await resend.emails.send({
        from: FROM, to: hostEmail,
        subject: `Guest booking confirmed — ${ref} — ${guestName} · ${propertyName}`,
        html: hostHtml,
      });
      if (error) throw error;
      console.log('[confirmEmails] host email sent to', hostEmail);
    } catch (e) {
      console.error('[confirmEmails] host email failed:', e);
    }
  } else {
    console.log('[confirmEmails] no host email for property', propertyName, '— skipping');
  }

  // ── 4. Provider email (activities only) ────────────────────────────────────
  // Operational details only. No guest surname, email, or accommodation address.
  if (providerEmail && booking.item_type === 'activity') {
    try {
      const guestFirstName = guestName.split(' ')[0];

      const includesHtml = activityIncludes && activityIncludes.length > 0
        ? `<p style="margin:16px 0 6px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px">What's included</p>
           <ul style="margin:0;padding-left:16px">${activityIncludes.map(i => `<li style="font-size:13px;color:#374151;padding:2px 0">${i}</li>`).join('')}</ul>`
        : '';

      const provRows = [
        tr('Ref',      `<span style="font-family:monospace">${ref}</span>`),
        tr('Activity', itemTitle),
        tr('Date',     formattedDate),
        tr('Guests',   `${pax} ${pax === 1 ? 'person' : 'people'}`),
        meetingPoint ? tr('Meeting point', meetingPoint) : '',
        tr('Guest',    guestFirstName),
        guestNotes ? tr('Notes', guestNotes) : '',
      ].join('');

      const provHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#F5F0E8">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#1B2D4F;border-radius:8px 8px 0 0;padding:20px 24px">
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
    <h1 style="margin:4px 0 0;color:white;font-size:17px;font-weight:700">Booking confirmed — please prepare</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px;font-size:14px;color:#374151">A booking has been confirmed through Island Key. Please prepare for the following group.</p>
    <table style="border-collapse:collapse;width:100%">${provRows}</table>
    ${includesHtml}
    <div style="margin-top:20px;padding:14px 16px;background:#F0FAF9;border-left:3px solid #1A8A7D;border-radius:0 6px 6px 0">
      <p style="margin:0;font-size:13px;color:#1A8A7D;font-weight:600">Island Key is the point of contact.</p>
      <p style="margin:6px 0 0;font-size:13px;color:#374151">
        WhatsApp: <a href="https://wa.me/${teamWa}" style="color:#25D366">+${teamWa}</a><br>
        Email: <a href="mailto:${INTERNAL_EMAIL}" style="color:#1B2D4F">${INTERNAL_EMAIL}</a>
      </p>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">Island Key &mdash; Crete</p>
</div></body></html>`;

      const { error } = await resend.emails.send({
        from: FROM, to: providerEmail,
        subject: `Booking confirmed — ${itemTitle} — ${formattedDate} — ${pax} guest${pax !== 1 ? 's' : ''}`,
        html: provHtml,
      });
      if (error) throw error;
      console.log('[confirmEmails] provider email sent to', providerEmail, providerName);
    } catch (e) {
      console.error('[confirmEmails] provider email failed:', e);
    }
  } else if (!providerEmail) {
    console.log('[confirmEmails] no provider email for booking', ref, '— skipping');
  }
}
