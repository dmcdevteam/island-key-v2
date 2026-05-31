import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type BoatEnquiryBody = {
  boat_id: string
  boat_name: string
  port_name: string
  city: string
  start_date: string
  end_date: string
  duration_days: number
  checkin_time: string
  checkout_time: string
  with_skipper: boolean
  num_guests: number
  guest_name: string
  guest_email: string
  guest_phone: string
  grand_total: number
  notes?: string
}

function buildWhatsAppMessage(body: BoatEnquiryBody, ref: string, pricePerDay: number): string {
  return [
    `⛵ *Boat Rental Enquiry*`,
    `Ref: ${ref}`,
    `Boat: ${body.boat_name}`,
    `Port: ${body.port_name}, ${body.city}`,
    `Dates: ${body.start_date} → ${body.end_date} (${body.duration_days} days)`,
    `Check-in: ${body.checkin_time} | Check-out: ${body.checkout_time}`,
    `Skipper: ${body.with_skipper ? 'With skipper' : 'Without skipper'}`,
    `Guests: ${body.num_guests}`,
    `Est. Total: €${body.grand_total.toFixed(2)}`,
    `Guest: ${body.guest_name} · ${body.guest_email} · ${body.guest_phone}`,
    `Notes: ${body.notes || '—'}`,
  ].join('\n')
}

function buildGuestHtml(body: BoatEnquiryBody, ref: string): string {
  return `
    <h2>Your Boat Rental Enquiry — ${ref}</h2>
    <p>Hi ${body.guest_name.split(' ')[0]},</p>
    <p>We've received your enquiry for <strong>${body.boat_name}</strong> departing from ${body.port_name}, ${body.city}.</p>
    <table>
      <tr><td><strong>Dates</strong></td><td>${body.start_date} → ${body.end_date} (${body.duration_days} days)</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${body.checkin_time}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${body.checkout_time}</td></tr>
      <tr><td><strong>Skipper</strong></td><td>${body.with_skipper ? 'With skipper' : 'Without skipper'}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${body.num_guests}</td></tr>
      <tr><td><strong>Est. Total</strong></td><td>€${body.grand_total.toFixed(2)}</td></tr>
    </table>
    ${body.notes ? `<p><strong>Notes:</strong> ${body.notes}</p>` : ''}
    <p>We'll confirm availability within 2 hours.</p>
    <p>Island Key Team</p>
  `
}

function buildInternalHtml(body: BoatEnquiryBody, ref: string): string {
  return `
    <h2>New Boat Enquiry — ${ref}</h2>
    <table>
      <tr><td><strong>Boat</strong></td><td>${body.boat_name}</td></tr>
      <tr><td><strong>Port</strong></td><td>${body.port_name}, ${body.city}</td></tr>
      <tr><td><strong>Dates</strong></td><td>${body.start_date} → ${body.end_date} (${body.duration_days} days)</td></tr>
      <tr><td><strong>Check-in/out</strong></td><td>${body.checkin_time} / ${body.checkout_time}</td></tr>
      <tr><td><strong>Skipper</strong></td><td>${body.with_skipper ? 'Yes' : 'No'}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${body.num_guests}</td></tr>
      <tr><td><strong>Est. Total</strong></td><td>€${body.grand_total.toFixed(2)}</td></tr>
      <tr><td><strong>Guest</strong></td><td>${body.guest_name}</td></tr>
      <tr><td><strong>Email</strong></td><td>${body.guest_email}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${body.guest_phone}</td></tr>
      ${body.notes ? `<tr><td><strong>Notes</strong></td><td>${body.notes}</td></tr>` : ''}
    </table>
  `
}

export async function POST(request: Request) {
  const body: BoatEnquiryBody = await request.json()

  const supabase = createServerClient()

  // Server-side price check
  const { data: rental } = await supabase
    .from('rentals')
    .select('price_per_day')
    .eq('id', body.boat_id)
    .single()

  const pricePerDay = rental?.price_per_day ?? 0
  const serverTotal = pricePerDay * body.duration_days

  const reference_code = 'IKT-' + Date.now().toString(36).toUpperCase()

  // Insert booking
  await supabase.from('bookings').insert({
    confirmation_code: reference_code,
    item_type: 'boat_rental',
    item_id: body.boat_id,
    item_title: body.boat_name,
    booking_date: body.start_date,
    days: body.duration_days,
    pax: body.num_guests,
    unit_price: pricePerDay,
    total_price: serverTotal,
    currency: 'EUR',
    payment_method: 'whatsapp',
    status: 'pending',
    guest_name: body.guest_name,
    guest_email: body.guest_email,
    guest_notes: body.notes ?? null,
    pickup_location: body.port_name,
    commission_rate: 0,
  })

  const whatsapp_message = buildWhatsAppMessage(body, reference_code, pricePerDay)

  // Send emails via Resend if key is set
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM ?? 'Island Key <noreply@island-key.com>'
    const internalTo = process.env.RESEND_INTERNAL_TO ?? 'info@island-key.com'

    await Promise.allSettled([
      resend.emails.send({
        from,
        to: body.guest_email,
        subject: `Your Boat Enquiry — ${reference_code}`,
        html: buildGuestHtml(body, reference_code),
      }),
      resend.emails.send({
        from,
        to: internalTo,
        subject: `New Boat Enquiry — ${reference_code}`,
        html: buildInternalHtml(body, reference_code),
      }),
    ])
  }

  return NextResponse.json({ success: true, reference_code, whatsapp_message })
}
