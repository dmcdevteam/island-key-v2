import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'
import type { CarEnquiryPayload } from '@/lib/types'

const FROM           = 'bookings@islandkey.gr'
const INTERNAL_EMAIL = 'islandkeygr@gmail.com'

function refCode(): string {
  return 'IK-' + Date.now().toString(36).toUpperCase()
}

function formatDate(d: string): string {
  if (!d) return d
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function buildGuestHtml(p: CarEnquiryPayload & { reference_code: string; server_total: number }): string {
  const extrasRows = p.selected_extras.length
    ? p.selected_extras.map(e =>
        `<tr><td style="padding:6px 0;color:#555;">${e.name}</td><td style="padding:6px 0;text-align:right;">€${e.price.toFixed(2)}</td></tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding:6px 0;color:#999;">No extras selected</td></tr>'

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:'Plus Jakarta Sans',sans-serif;background:#FDFCFA;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
    <div style="background:#1B2D4F;padding:28px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Island Key</p>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">Car Rental Enquiry Received</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#1B2D4F;margin:0 0 20px;">Hi ${p.driver_first_name}, we've received your rental enquiry and will confirm within 2 hours via email and WhatsApp.</p>

      <div style="background:#F7F6F2;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 12px;">Your Reference</p>
        <p style="font-size:20px;font-weight:700;color:#1B2D4F;margin:0;letter-spacing:.05em;">${p.reference_code}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:6px 0;font-size:13px;color:#999;width:140px;">Vehicle</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;font-weight:600;">${p.vehicle_name}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#999;">Pick-up</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${p.pickup_location}<br><span style="color:#555;">${formatDate(p.pickup_date)} at ${p.pickup_time}</span></td></tr>
        ${p.diff_dropoff && p.dropoff_location ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Drop-off</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${p.dropoff_location}<br><span style="color:#555;">${formatDate(p.dropoff_date)} at ${p.dropoff_time}</span></td></tr>` : `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Drop-off</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${formatDate(p.dropoff_date)} at ${p.dropoff_time}</td></tr>`}
        <tr><td style="padding:6px 0;font-size:13px;color:#999;">Duration</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${p.duration_days} day${p.duration_days !== 1 ? 's' : ''}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#999;">Driver age</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${p.driver_age}</td></tr>
        ${p.flight_number ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Flight</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${p.flight_number}</td></tr>` : ''}
      </table>

      <div style="border-top:1px solid #eee;padding-top:16px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 10px;">Price Breakdown</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#555;font-size:13px;">${p.duration_days} days × €${(p.server_total - p.extras_total) / p.duration_days > 0 ? ((p.server_total - p.extras_total) / p.duration_days).toFixed(2) : '—'}/day</td><td style="padding:6px 0;text-align:right;font-size:13px;">€${(p.server_total - p.extras_total).toFixed(2)}</td></tr>
          ${extrasRows}
          <tr style="border-top:1px solid #eee;"><td style="padding:10px 0 4px;font-weight:700;color:#1B2D4F;">Total estimate</td><td style="padding:10px 0 4px;text-align:right;font-weight:700;color:#1B2D4F;font-size:16px;">€${p.server_total.toFixed(2)}</td></tr>
        </table>
        <p style="font-size:11px;color:#999;margin:8px 0 0;">Estimated total — exact pricing confirmed within 2 hours of enquiry.</p>
      </div>

      <p style="font-size:13px;color:#555;margin:0;">Questions? Reply to this email or message us on WhatsApp.</p>
    </div>
  </div>
</body></html>`
}

function buildInternalHtml(p: CarEnquiryPayload & { reference_code: string; server_total: number }): string {
  const extrasText = p.selected_extras.length
    ? p.selected_extras.map(e => `${e.name} (€${e.price}/${e.price_type})`).join(', ')
    : 'None'

  return `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#f5f5f5;">
  <div style="max-width:600px;background:#fff;border-radius:8px;padding:24px;border:1px solid #ddd;">
    <h2 style="color:#1B2D4F;margin:0 0 16px;">🚗 New Rental Enquiry — ${p.vehicle_name}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 12px 4px 0;color:#999;white-space:nowrap;">Ref</td><td style="padding:4px 0;font-weight:700;">${p.reference_code}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Vehicle</td><td style="padding:4px 0;">${p.vehicle_name} (${p.car_class})</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Pick-up</td><td style="padding:4px 0;">${p.pickup_location} — ${formatDate(p.pickup_date)} ${p.pickup_time}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Drop-off</td><td style="padding:4px 0;">${p.diff_dropoff && p.dropoff_location ? p.dropoff_location + ' — ' : ''}${formatDate(p.dropoff_date)} ${p.dropoff_time}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Duration</td><td style="padding:4px 0;">${p.duration_days} days</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Driver</td><td style="padding:4px 0;">${p.driver_first_name} ${p.driver_last_name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Email</td><td style="padding:4px 0;">${p.driver_email}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Phone</td><td style="padding:4px 0;">${p.driver_phone}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Country</td><td style="padding:4px 0;">${p.driver_country}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Age</td><td style="padding:4px 0;">${p.driver_age}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Flight</td><td style="padding:4px 0;">${p.flight_number || '—'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Extras</td><td style="padding:4px 0;">${extrasText}</td></tr>
      <tr style="border-top:2px solid #1B2D4F;"><td style="padding:8px 12px 4px 0;font-weight:700;">Est. Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;">€${p.server_total.toFixed(2)}</td></tr>
    </table>
  </div>
</body></html>`
}

export async function POST(request: Request) {
  let body: CarEnquiryPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  const required = ['vehicle_id', 'vehicle_name', 'car_class', 'pickup_location', 'pickup_place_id',
    'pickup_date', 'dropoff_date', 'pickup_time', 'dropoff_time', 'duration_days',
    'driver_first_name', 'driver_last_name', 'driver_email', 'driver_phone',
    'driver_country', 'driver_age']
  for (const field of required) {
    if (!body[field as keyof CarEnquiryPayload]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const supabase = createServerClient()

  // Server-side price calculation — do not trust client total
  const { data: vehicle, error: vErr } = await supabase
    .from('rentals')
    .select('price_per_day')
    .eq('id', body.vehicle_id)
    .single()

  if (vErr || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  const base_price   = Number(vehicle.price_per_day) * Number(body.duration_days)
  const extras_total = (body.selected_extras ?? []).reduce((sum, e) => {
    const price = Number(e.price)
    return sum + (e.price_type === 'per_day' ? price * Number(body.duration_days) : price)
  }, 0)
  const server_total = base_price + extras_total

  const reference_code = refCode()

  const extrasNames = (body.selected_extras ?? []).map(e => e.name).join(', ') || 'None'

  const waMessage = [
    `🚗 *New Rental Enquiry*`,
    `Vehicle: ${body.vehicle_name} (${body.car_class})`,
    `Dates: ${formatDate(body.pickup_date)} ${body.pickup_time} → ${formatDate(body.dropoff_date)} ${body.dropoff_time}`,
    `Pick-up: ${body.pickup_location}`,
    body.diff_dropoff && body.dropoff_location ? `Drop-off: ${body.dropoff_location}` : null,
    `Duration: ${body.duration_days} days`,
    `Driver: ${body.driver_first_name} ${body.driver_last_name}`,
    `Age: ${body.driver_age} | Country: ${body.driver_country}`,
    `Flight: ${body.flight_number || '—'}`,
    `Extras: ${extrasNames}`,
    `Est. Total: €${server_total.toFixed(2)}`,
    `Ref: ${reference_code}`,
  ].filter(Boolean).join('\n')

  // Insert booking
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      item_type:    'rental',
      item_id:      body.vehicle_id,
      item_title:   body.vehicle_name,
      booking_date: body.pickup_date,
      booking_time: body.pickup_time,
      pax:          1,
      days:         body.duration_days,
      unit_price:   Number(vehicle.price_per_day),
      total_price:  server_total,
      status:       'enquiry',
      guest_name:   `${body.driver_first_name} ${body.driver_last_name}`,
      guest_email:  body.driver_email,
      guest_phone:  body.driver_phone ?? null,
      payment_method: 'whatsapp',
      notes: JSON.stringify({
        pickup_location:  body.pickup_location,
        dropoff_location: body.dropoff_location ?? null,
        pickup_date:      body.pickup_date,
        dropoff_date:     body.dropoff_date,
        pickup_time:      body.pickup_time,
        dropoff_time:     body.dropoff_time,
        driver_country:   body.driver_country,
        driver_age:       body.driver_age,
        flight_number:    body.flight_number ?? null,
        selected_extras:  body.selected_extras ?? [],
        car_class:        body.car_class,
        reference_code,
      }),
      confirmation_code: reference_code,
    })
    .select('id, confirmation_code')
    .single()

  if (bErr || !booking) {
    console.error('[car-enquiry] insert failed:', bErr?.message)
    return NextResponse.json({ error: bErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  const enriched = { ...body, reference_code, server_total }
  const apiKey   = process.env.RESEND_API_KEY

  if (apiKey && apiKey !== 're_your-api-key-here') {
    const resend = new Resend(apiKey)

    // Guest confirmation
    try {
      await resend.emails.send({
        from:    FROM,
        to:      body.driver_email,
        subject: `Rental Enquiry Received — ${body.vehicle_name} — ${formatDate(body.pickup_date)}`,
        html:    buildGuestHtml(enriched),
      })
    } catch (e) {
      console.error('[car-enquiry] guest email failed:', e)
    }

    // Internal notification
    try {
      await resend.emails.send({
        from:    FROM,
        to:      INTERNAL_EMAIL,
        subject: `🚗 New Rental Enquiry — ${body.vehicle_name} — ${formatDate(body.pickup_date)}`,
        html:    buildInternalHtml(enriched),
      })
    } catch (e) {
      console.error('[car-enquiry] internal email failed:', e)
    }
  }

  return NextResponse.json({ success: true, reference_code, whatsapp_message: waMessage })
}
