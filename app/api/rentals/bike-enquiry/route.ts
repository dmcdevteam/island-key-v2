import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const FROM           = 'bookings@islandkey.gr'
const INTERNAL_EMAIL = 'islandkeygr@gmail.com'

type BikeEnquiryBody = {
  vehicle_id:        string
  vehicle_name:      string
  vehicle_class:     string
  delivery_address:  string
  delivery_place_id: string
  start_date:        string
  end_date:          string
  pickup_time:       string
  return_time:       string
  quantity:          number
  duration_days:     number
  selected_extras:   { name: string; price: number }[]
  extras_total:      number
  base_price:        number
  discount_total:    number
  grand_total:       number
  guest_name:        string
  guest_email:       string
  guest_phone:       string
  notes?:            string
}

function refCode(): string {
  return 'IKB-' + Date.now().toString(36).toUpperCase()
}

function formatDate(d: string): string {
  if (!d) return d
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function calcPrice(
  pricePerDay: number,
  durationDays: number,
  dayDiscounts: Record<string, number> | null,
  quantity: number
): { baseTotal: number; discountTotal: number; grandTotal: number } {
  const baseDays    = Math.min(durationDays, 3)
  let baseTotal     = pricePerDay * baseDays
  let discountTotal = 0

  if (dayDiscounts && durationDays > 3) {
    for (let day = 4; day <= durationDays; day++) {
      const key = day >= 7 ? '7plus' : String(day)
      const pct = dayDiscounts[key] ?? 0
      const dayPrice = pricePerDay * (1 - pct / 100)
      baseTotal     += dayPrice
      discountTotal += pricePerDay - dayPrice
    }
  } else if (durationDays > 3) {
    baseTotal += pricePerDay * (durationDays - 3)
  }

  return { baseTotal, discountTotal, grandTotal: (baseTotal + 0) * quantity }
}

function buildGuestHtml(b: BikeEnquiryBody & { reference_code: string; server_total: number }): string {
  const extrasRows = b.selected_extras.length
    ? b.selected_extras.map(e =>
        `<tr><td style="padding:6px 0;color:#555;font-size:13px;">${e.name}</td><td style="padding:6px 0;text-align:right;font-size:13px;">€${Number(e.price).toFixed(2)}</td></tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding:6px 0;color:#999;font-size:13px;">No extras selected</td></tr>'

  const [firstName] = b.guest_name.split(' ')

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:'Plus Jakarta Sans',sans-serif;background:#FDFCFA;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
  <div style="background:#1A8A7D;padding:28px 32px;">
    <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Island Key</p>
    <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">Bike Rental Enquiry Received</p>
  </div>
  <div style="padding:28px 32px;">
    <p style="font-size:15px;color:#1B2D4F;margin:0 0 20px;">Hi ${firstName}, we've received your bike rental enquiry and will confirm within 2 hours via email and WhatsApp.</p>
    <div style="background:#F7F6F2;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 12px;">Your Reference</p>
      <p style="font-size:20px;font-weight:700;color:#1B2D4F;margin:0;letter-spacing:.05em;">${b.reference_code}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:13px;color:#999;width:140px;">Bike</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;font-weight:600;">${b.vehicle_name}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#999;">Dates</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${formatDate(b.start_date)} – ${formatDate(b.end_date)} (${b.duration_days} day${b.duration_days !== 1 ? 's' : ''})</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#999;">Pickup</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${b.pickup_time}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#999;">Return</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${b.return_time}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#999;">Quantity</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${b.quantity} bike${b.quantity !== 1 ? 's' : ''}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#999;">Delivery to</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${b.delivery_address}</td></tr>
    </table>
    <div style="border-top:1px solid #eee;padding-top:16px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 10px;">Price Breakdown</p>
      <table style="width:100%;border-collapse:collapse;">
        ${extrasRows}
        <tr style="border-top:1px solid #eee;"><td style="padding:10px 0 4px;font-weight:700;color:#1B2D4F;font-size:13px;">Total estimate × ${b.quantity}</td><td style="padding:10px 0 4px;text-align:right;font-weight:700;color:#1B2D4F;font-size:16px;">€${b.server_total.toFixed(2)}</td></tr>
      </table>
      <p style="font-size:11px;color:#999;margin:8px 0 0;">Estimated total — exact pricing confirmed within 2 hours.</p>
    </div>
    <p style="font-size:13px;color:#555;margin:0;">Questions? Reply to this email or message us on WhatsApp.</p>
  </div>
</div>
</body></html>`
}

function buildInternalHtml(b: BikeEnquiryBody & { reference_code: string; server_total: number }): string {
  const extrasText = b.selected_extras.length
    ? b.selected_extras.map(e => `${e.name} (€${e.price})`).join(', ')
    : 'None'

  return `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#f5f5f5;">
<div style="max-width:600px;background:#fff;border-radius:8px;padding:24px;border:1px solid #ddd;">
  <h2 style="color:#1A8A7D;margin:0 0 16px;">🚲 New Bike Rental Enquiry — ${b.vehicle_name}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Ref</td><td style="padding:4px 0;font-weight:700;">${b.reference_code}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Bike</td><td style="padding:4px 0;">${b.vehicle_name} (${b.vehicle_class})</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Dates</td><td style="padding:4px 0;">${formatDate(b.start_date)} – ${formatDate(b.end_date)} (${b.duration_days} days)</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Times</td><td style="padding:4px 0;">Pickup ${b.pickup_time} / Return ${b.return_time}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Qty</td><td style="padding:4px 0;">${b.quantity}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Delivery</td><td style="padding:4px 0;">${b.delivery_address}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Guest</td><td style="padding:4px 0;">${b.guest_name}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Email</td><td style="padding:4px 0;">${b.guest_email}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Phone</td><td style="padding:4px 0;">${b.guest_phone}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Extras</td><td style="padding:4px 0;">${extrasText}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#999;">Notes</td><td style="padding:4px 0;">${b.notes || '—'}</td></tr>
    <tr style="border-top:2px solid #1A8A7D;"><td style="padding:8px 12px 4px 0;font-weight:700;">Est. Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;">€${b.server_total.toFixed(2)}</td></tr>
  </table>
</div>
</body></html>`
}

export async function POST(request: Request) {
  let body: BikeEnquiryBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const required = ['vehicle_id','vehicle_name','start_date','end_date','pickup_time','return_time',
    'quantity','duration_days','guest_name','guest_email','guest_phone']
  for (const field of required) {
    if (!body[field as keyof BikeEnquiryBody]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const supabase = createServerClient()

  // Server-side price recalculation — do not trust client total
  const { data: vehicle, error: vErr } = await supabase
    .from('rentals')
    .select('price_per_day, day_discounts')
    .eq('id', body.vehicle_id)
    .single()

  if (vErr || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  const pricePerDay  = Number(vehicle.price_per_day)
  const { baseTotal, discountTotal, grandTotal } = calcPrice(
    pricePerDay,
    Number(body.duration_days),
    (vehicle.day_discounts as Record<string, number> | null) ?? null,
    Number(body.quantity)
  )

  const extrasTotal  = (body.selected_extras ?? []).reduce((s, e) => s + Number(e.price), 0)
  const server_total = (grandTotal + extrasTotal * Number(body.quantity))

  const reference_code = refCode()

  const extrasNames = (body.selected_extras ?? []).map(e => `${e.name} (€${e.price})`).join(', ') || 'None'

  const waMessage = [
    `🚲 *Bike Rental Enquiry*`,
    `Ref: ${reference_code}`,
    `Vehicle: ${body.vehicle_name} (${body.vehicle_class ?? ''})`,
    `Dates: ${formatDate(body.start_date)} → ${formatDate(body.end_date)} (${body.duration_days} days)`,
    `Pickup time: ${body.pickup_time} | Return: ${body.return_time}`,
    `Qty: ${body.quantity}`,
    `Delivery to: ${body.delivery_address || '—'}`,
    `Extras: ${extrasNames}`,
    `Base: €${baseTotal.toFixed(2)} | Discount: -€${discountTotal.toFixed(2)} | Total: €${server_total.toFixed(2)}`,
    `Guest: ${body.guest_name} · ${body.guest_email} · ${body.guest_phone}`,
    `Notes: ${body.notes || '—'}`,
  ].join('\n')

  // Insert booking record
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      item_type:    'bike_rental',
      item_id:      body.vehicle_id,
      item_title:   body.vehicle_name,
      booking_date: body.start_date,
      booking_time: body.pickup_time,
      pax:          Number(body.quantity),
      days:         Number(body.duration_days),
      unit_price:   pricePerDay,
      total_price:  server_total,
      status:       'enquiry',
      guest_name:   body.guest_name,
      guest_email:  body.guest_email,
      guest_phone:  body.guest_phone ?? null,
      payment_method: 'whatsapp',
      notes: JSON.stringify({
        delivery_address:  body.delivery_address,
        delivery_place_id: body.delivery_place_id,
        start_date:        body.start_date,
        end_date:          body.end_date,
        pickup_time:       body.pickup_time,
        return_time:       body.return_time,
        quantity:          body.quantity,
        vehicle_class:     body.vehicle_class,
        selected_extras:   body.selected_extras ?? [],
        base_price:        baseTotal,
        discount_total:    discountTotal,
        reference_code,
      }),
      confirmation_code: reference_code,
    })
    .select('id')
    .single()

  if (bErr || !booking) {
    console.error('[bike-enquiry] insert failed:', bErr?.message)
    return NextResponse.json({ error: bErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  const enriched = { ...body, reference_code, server_total }
  const apiKey   = process.env.RESEND_API_KEY

  if (apiKey && apiKey !== 're_your-api-key-here') {
    const resend = new Resend(apiKey)

    try {
      await resend.emails.send({
        from:    FROM,
        to:      body.guest_email,
        subject: `Bike Rental Enquiry Received — ${body.vehicle_name} — ${formatDate(body.start_date)}`,
        html:    buildGuestHtml(enriched),
      })
    } catch (e) {
      console.error('[bike-enquiry] guest email failed:', e)
    }

    try {
      await resend.emails.send({
        from:    FROM,
        to:      INTERNAL_EMAIL,
        subject: `🚲 New Bike Rental Enquiry — ${body.vehicle_name} — ${formatDate(body.start_date)}`,
        html:    buildInternalHtml(enriched),
      })
    } catch (e) {
      console.error('[bike-enquiry] internal email failed:', e)
    }
  }

  return NextResponse.json({ success: true, reference_code, whatsapp_message: waMessage })
}
