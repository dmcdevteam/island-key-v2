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
