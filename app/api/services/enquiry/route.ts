import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'

const SUBCATEGORY_LABELS: Record<string, string> = {
  wellness_health:        'Wellness & Health',
  family_care:            'Family & Care',
  food_dining:            'Food & Dining',
  villa_lifestyle:        'Villa & Lifestyle',
  private_experiences:    'Private Experiences',
  beach_dining_nightlife: 'Beach, Dining & Nightlife',
  lifestyle_shopping:     'Lifestyle & Shopping',
  events_access:          'Events & Access',
}

export async function POST(request: Request) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    service_id, service_title, subcategory,
    guest_name, guest_email, guest_phone,
    preferred_date, preferred_time,
    num_guests, notes, property_name,
  } = body

  const reference_code    = 'IKS-' + Date.now().toString(36).toUpperCase()
  const subcategory_label = SUBCATEGORY_LABELS[subcategory] ?? subcategory

  // 1. Insert into bookings
  const supabase = createServerClient()
  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      item_type:         'service',
      item_id:           service_id ?? null,
      item_title:        service_title ?? '',
      booking_date:      preferred_date ?? null,
      pax:               Number(num_guests) || 1,
      days:              1,
      unit_price:        0,
      total_price:       0,
      payment_method:    'whatsapp',
      status:            'enquiry',
      guest_name:        guest_name ?? null,
      guest_email:       guest_email ?? null,
      notes:             JSON.stringify({ subcategory, preferred_time, notes, property_name, guest_phone }),
      confirmation_code: reference_code,
    })
    .select('id, confirmation_code')
    .single()

  if (insertError) {
    console.error('[POST /api/services/enquiry] insert failed:', insertError.message)
    // Non-blocking — WA flow still continues
  }

  const usedRef = booking?.confirmation_code ?? reference_code

  // 2. Emails via Resend
  const resend  = new Resend(process.env.RESEND_API_KEY)
  const FROM    = 'bookings@islandkey.gr'
  const SPYROS  = process.env.ADMIN_EMAIL ?? 'islandkeygr@gmail.com'

  const detailRows = [
    `<b>Service:</b> ${service_title} (${subcategory_label})`,
    `<b>Date:</b> ${preferred_date || '—'} at ${preferred_time || '—'}`,
    `<b>Guests:</b> ${num_guests || '1'}`,
    `<b>Guest:</b> ${guest_name || '—'} · ${guest_email || '—'} · ${guest_phone || '—'}`,
    `<b>Property:</b> ${property_name || '—'}`,
    `<b>Notes:</b> ${notes || '—'}`,
    `<b>Ref:</b> ${usedRef}`,
  ].join('<br>')

  const internalHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#F5F0E8">
    <div style="max-width:520px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
      <div style="background:#1B2D4F;padding:20px;text-align:center">
        <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
        <h2 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">New Service Enquiry</h2>
      </div>
      <div style="padding:24px"><p>${detailRows}</p></div>
    </div>
  </body></html>`

  resend.emails.send({
    from: FROM, to: SPYROS,
    subject: `Service Enquiry — ${service_title} — ${preferred_date || 'TBD'}`,
    html: internalHtml,
  }).catch(e => console.error('[services/enquiry] internal email:', e))

  if (guest_email) {
    resend.emails.send({
      from: FROM, to: guest_email,
      subject: `Your Island Key Service Enquiry — ${service_title}`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#F5F0E8">
        <div style="max-width:520px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
          <div style="background:#1B2D4F;padding:20px;text-align:center">
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Island Key</p>
            <h2 style="margin:6px 0 0;color:white;font-size:18px;font-weight:600">Enquiry Received</h2>
          </div>
          <div style="padding:24px">
            <p style="font-size:14px;color:#374151">Thank you, ${guest_name || 'Guest'}! We've received your enquiry for <b>${service_title}</b> on <b>${preferred_date || 'your preferred date'}</b>.</p>
            <p style="font-size:14px;color:#374151">Our team will confirm availability via WhatsApp shortly.</p>
            <p style="font-size:12px;color:#9CA3AF;margin-top:20px">Reference: ${usedRef}</p>
          </div>
        </div>
      </body></html>`,
    }).catch(e => console.error('[services/enquiry] guest email:', e))
  }

  // 3. WhatsApp message text (returned to client for deeplink)
  const whatsapp_message = [
    `🛎️ *New Service Enquiry*`,
    `Service: ${service_title} (${subcategory_label})`,
    `Date: ${preferred_date || '—'} at ${preferred_time || '—'}`,
    `Guests: ${num_guests || '1'}`,
    `Guest: ${guest_name || '—'} · ${guest_email || '—'} · ${guest_phone || '—'}`,
    `Property: ${property_name || '—'}`,
    `Notes: ${notes || '—'}`,
    `Ref: ${usedRef}`,
  ].join('\n')

  return NextResponse.json({ success: true, reference_code: usedRef, whatsapp_message })
}
