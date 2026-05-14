import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'

const FROM           = 'bookings@islandkey.gr'
const INTERNAL_EMAIL = process.env.ADMIN_EMAIL ?? 'dmcdevteam@gmail.com'

function refCode(): string {
  return 'IKE-' + Date.now().toString(36).toUpperCase()
}

function formatDate(d: string): string {
  if (!d) return d
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

type EnquiryItem = {
  id: string
  name: string
  price_per_day: number
  quantity: number
  days: number
}

type EnquiryPayload = {
  items:          EnquiryItem[]
  guest_name:     string
  guest_email:    string
  guest_phone?:   string
  property_name?: string
  check_in?:      string
  check_out?:     string
  notes?:         string
}

function buildGuestHtml(p: EnquiryPayload & { reference_code: string; total: number }): string {
  const itemRows = p.items.map(it =>
    `<tr><td style="padding:6px 0;color:#555;font-size:13px;">${it.name} × ${it.quantity} (${it.days} day${it.days !== 1 ? 's' : ''})</td><td style="padding:6px 0;text-align:right;font-size:13px;">€${(it.price_per_day * it.quantity * it.days).toFixed(2)}</td></tr>`
  ).join('')

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:'Plus Jakarta Sans',sans-serif;background:#FDFCFA;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
    <div style="background:#1B2D4F;padding:28px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Island Key</p>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">Vacation Essentials Enquiry Received</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#1B2D4F;margin:0 0 20px;">Hi ${p.guest_name.split(' ')[0]}, we've received your essentials enquiry and will confirm availability within 2 hours via email and WhatsApp.</p>

      <div style="background:#F7F6F2;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 12px;">Your Reference</p>
        <p style="font-size:20px;font-weight:700;color:#1B2D4F;margin:0;letter-spacing:.05em;">${p.reference_code}</p>
      </div>

      ${p.property_name || p.check_in ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${p.property_name ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;width:140px;">Property</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;font-weight:600;">${p.property_name}</td></tr>` : ''}
        ${p.check_in ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Check-in</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${formatDate(p.check_in)}</td></tr>` : ''}
        ${p.check_out ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Check-out</td><td style="padding:6px 0;font-size:13px;color:#1B2D4F;">${formatDate(p.check_out)}</td></tr>` : ''}
      </table>` : ''}

      <div style="border-top:1px solid #eee;padding-top:16px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.08em;margin:0 0 10px;">Items Ordered</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
          <tr style="border-top:1px solid #eee;"><td style="padding:10px 0 4px;font-weight:700;color:#1B2D4F;font-size:13px;">Total estimate</td><td style="padding:10px 0 4px;text-align:right;font-weight:700;color:#1B2D4F;font-size:16px;">€${p.total.toFixed(2)}</td></tr>
        </table>
        <p style="font-size:11px;color:#999;margin:8px 0 0;">Estimated total — exact pricing confirmed within 2 hours.</p>
      </div>

      <p style="font-size:13px;color:#555;margin:0;">Questions? Reply to this email or message us on WhatsApp.</p>
    </div>
  </div>
</body></html>`
}

function buildInternalHtml(p: EnquiryPayload & { reference_code: string; total: number }): string {
  const itemLines = p.items.map(it =>
    `${it.name} × ${it.quantity} (${it.days}d) = €${(it.price_per_day * it.quantity * it.days).toFixed(2)}`
  ).join(', ')

  return `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#f5f5f5;">
  <div style="max-width:600px;background:#fff;border-radius:8px;padding:24px;border:1px solid #ddd;">
    <h2 style="color:#1B2D4F;margin:0 0 16px;">🛖 New Essentials Enquiry</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 12px 4px 0;color:#999;white-space:nowrap;">Ref</td><td style="padding:4px 0;font-weight:700;">${p.reference_code}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Guest</td><td style="padding:4px 0;">${p.guest_name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Email</td><td style="padding:4px 0;">${p.guest_email}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Phone</td><td style="padding:4px 0;">${p.guest_phone || '—'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Property</td><td style="padding:4px 0;">${p.property_name || '—'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Check-in</td><td style="padding:4px 0;">${p.check_in ? formatDate(p.check_in) : '—'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Check-out</td><td style="padding:4px 0;">${p.check_out ? formatDate(p.check_out) : '—'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Items</td><td style="padding:4px 0;">${itemLines}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#999;">Notes</td><td style="padding:4px 0;">${p.notes || '—'}</td></tr>
      <tr style="border-top:2px solid #1B2D4F;"><td style="padding:8px 12px 4px 0;font-weight:700;">Est. Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;">€${p.total.toFixed(2)}</td></tr>
    </table>
  </div>
</body></html>`
}

export async function POST(request: Request) {
  let body: EnquiryPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.items?.length || !body.guest_name || !body.guest_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Server-side total calculation
  const total = body.items.reduce((sum, it) => sum + it.price_per_day * it.quantity * it.days, 0)
  const reference_code = refCode()
  const supabase = createServerClient()

  const itemsSummary = body.items.map(it => `${it.name} ×${it.quantity}`).join(', ')

  const waMessage = [
    `🛖 *New Essentials Enquiry*`,
    `Ref: ${reference_code}`,
    `Guest: ${body.guest_name}`,
    body.property_name ? `Property: ${body.property_name}` : null,
    body.check_in ? `Check-in: ${formatDate(body.check_in)}` : null,
    body.check_out ? `Check-out: ${formatDate(body.check_out)}` : null,
    `Items: ${itemsSummary}`,
    `Est. Total: €${total.toFixed(2)}`,
    body.notes ? `Notes: ${body.notes}` : null,
  ].filter(Boolean).join('\n')

  // Save to bookings
  const { error: bErr } = await supabase
    .from('bookings')
    .insert({
      item_type:    'essential',
      item_id:      body.items[0].id,
      item_title:   `Essentials: ${itemsSummary}`,
      booking_date: body.check_in ?? null,
      pax:          1,
      total_price:  total,
      status:       'enquiry',
      guest_name:   body.guest_name,
      guest_email:  body.guest_email,
      guest_phone:  body.guest_phone ?? null,
      payment_method: 'whatsapp',
      notes: JSON.stringify({
        items:         body.items,
        property_name: body.property_name,
        check_in:      body.check_in,
        check_out:     body.check_out,
        notes:         body.notes,
        reference_code,
      }),
      confirmation_code: reference_code,
    })

  if (bErr) {
    console.error('[essentials-enquiry] insert failed:', bErr.message)
  }

  const enriched = { ...body, reference_code, total }
  const apiKey = process.env.RESEND_API_KEY

  if (apiKey && apiKey !== 're_your-api-key-here') {
    const resend = new Resend(apiKey)

    try {
      await resend.emails.send({
        from:    FROM,
        to:      body.guest_email,
        subject: `Essentials Enquiry Received — ${reference_code}`,
        html:    buildGuestHtml(enriched),
      })
    } catch (e) { console.error('[essentials-enquiry] guest email:', e) }

    try {
      await resend.emails.send({
        from:    FROM,
        to:      INTERNAL_EMAIL,
        subject: `🛖 New Essentials Enquiry — ${reference_code}`,
        html:    buildInternalHtml(enriched),
      })
    } catch (e) { console.error('[essentials-enquiry] internal email:', e) }
  }

  return NextResponse.json({ success: true, reference_code, whatsapp_message: waMessage })
}
