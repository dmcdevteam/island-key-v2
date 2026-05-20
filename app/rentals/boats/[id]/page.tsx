'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { FocalImage } from '@/components/FocalImage'
import DateRangePicker, { toDate, fromDate } from '@/components/ui/date-range-picker'

// ─── Constants ───────────────────────────────────────────────────────────────

const EQUIPMENT_ICONS: Record<string, string> = {
  snorkelling:    '🤿',
  'bathing ladder': '🪜',
  usb:            '🔌',
  sundeck:        '☀️',
  cooler:         '🧊',
  anchor:         '⚓',
  'life jackets': '🦺',
}

function equipmentIcon(item: string): string {
  const key = item.toLowerCase()
  for (const [k, v] of Object.entries(EQUIPMENT_ICONS)) {
    if (key.includes(k)) return v
  }
  return '⚙️'
}

const INPUT = 'w-full px-3 py-2.5 border border-border-light rounded-xl text-sm text-navy bg-white outline-none focus:border-navy/40 transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-1.5'

type BoatPort = { id: string; name: string; area: string | null; lat: number | null; lng: number | null; google_maps_url: string | null }
type BoatFaq  = { question: string; answer: string }
type BoatRental = {
  id: string; name: string; car_class: string | null; description: string | null
  price_per_day: number; images: string[] | null; image_wide: string | null; image_square: string | null
  focal_x: number | null; focal_y: number | null
  features: Record<string, boolean> | null
  capacity: number | null; length_m: number | null; engine_power: number | null; year_built: number | null
  licence_required: boolean; with_skipper: boolean; fuel_included: boolean; min_rental_age: number | null
  checkin_time: string | null; checkout_time: string | null
  cancellation_policy: string | null; boat_equipment: string[] | null
  boat_faq: BoatFaq[] | null; port_id: string | null
  rental_ports: BoatPort | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function whatsappUrl(msg: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '306900000000'
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="border-t border-border-light py-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between text-left">
        <span className="font-semibold text-navy text-[15px] underline underline-offset-2">{title}</span>
        <span className="text-tx-mid text-sm ml-3 flex-shrink-0">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="mt-3 text-sm text-tx-mid leading-relaxed">{children}</div>}
    </div>
  )
}

// ─── FAQ Card (mini-accordion) ────────────────────────────────────────────────

function FaqCard({ faq }: { faq: BoatFaq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-blue-50 rounded-xl p-3">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between text-left gap-3">
        <span className="font-semibold text-navy text-[14px] leading-snug">{faq.question}</span>
        <span className="text-tx-mid text-sm flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">{faq.answer}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function BoatDetailContent() {
  const router = useRouter()
  const params = useParams()
  const sp     = useSearchParams()
  const id     = params.id as string

  const [boat,      setBoat]      = useState<BoatRental | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)

  // Booking state
  const [startDate,  setStartDate]  = useState(sp.get('start_date') ?? sp.get('pickup_date') ?? '')
  const [endDate,    setEndDate]    = useState(sp.get('end_date')   ?? sp.get('dropoff_date') ?? '')
  const [numGuests,  setNumGuests]  = useState(1)

  // Enquiry sheet
  const [sheetOpen,     setSheetOpen]     = useState(false)
  const [guestName,     setGuestName]     = useState('')
  const [guestEmail,    setGuestEmail]    = useState('')
  const [guestPhone,    setGuestPhone]    = useState('')
  const [notes,         setNotes]         = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [refCode,       setRefCode]       = useState('')
  const [waMsg,         setWaMsg]         = useState('')
  const [submitError,   setSubmitError]   = useState('')
  const [equipExpanded, setEquipExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/rentals/boats?id=${id}`)
      .then(r => r.json())
      .then(d => { setBoat(d.boat ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const duration     = startDate && endDate ? daysBetween(startDate, endDate) : 0
  const pricePerDay  = boat?.price_per_day ?? 0
  const grandTotal   = pricePerDay * duration

  function backUrl() {
    const p = new URLSearchParams(sp.toString())
    p.delete('boat_id')
    return `/rentals/boats/results?${p.toString()}`
  }

  async function handleSubmit() {
    if (!boat) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res  = await fetch('/api/rentals/boat-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boat_id:       boat.id,
          boat_name:     boat.name,
          port_name:     boat.rental_ports?.name ?? '',
          city:          boat.rental_ports?.area ?? sp.get('city') ?? '',
          start_date:    startDate,
          end_date:      endDate,
          duration_days: duration,
          checkin_time:  boat.checkin_time ?? '09:00',
          checkout_time: boat.checkout_time ?? '18:00',
          with_skipper:  boat.with_skipper,
          num_guests:    numGuests,
          guest_name:    guestName,
          guest_email:   guestEmail,
          guest_phone:   guestPhone,
          grand_total:   grandTotal,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Submission failed')
      setRefCode(data.reference_code)
      setWaMsg(data.whatsapp_message ?? '')
      setSuccess(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const canEnquire = !!startDate && !!endDate && !!guestName && !!guestEmail && !!guestPhone

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><p className="text-tx-light text-sm">Loading…</p></div>
  }
  if (!boat) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <p className="text-tx-light text-sm">Boat not found.</p>
        <button onClick={() => router.back()} className="text-teal text-sm font-semibold">← Go back</button>
      </div>
    )
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 pb-10 text-center">
        <div className="w-16 h-16 rounded-full bg-teal/10 border-2 border-teal flex items-center justify-center mb-4">
          <span className="text-teal text-2xl">✓</span>
        </div>
        <h2 className="font-display text-2xl text-navy mb-2">Enquiry Sent!</h2>
        <p className="text-sm text-tx-mid mb-1">We'll confirm within 2 hours.</p>
        {refCode && (
          <p className="text-[11px] text-tx-light mb-6">
            Reference: <span className="font-mono font-bold text-navy">{refCode}</span>
          </p>
        )}
        <div className="w-full max-w-[360px] space-y-3">
          {waMsg && (
            <a href={whatsappUrl(waMsg)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-semibold rounded-xl text-sm">
              💬 Message us on WhatsApp →
            </a>
          )}
          <button onClick={() => router.push('/')}
            className="w-full py-3 border border-border-light rounded-xl text-sm font-semibold text-tx-mid">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const images  = [boat.image_wide, ...(boat.images ?? [])].filter(Boolean) as string[]
  const heroSrc = images[heroIndex] ?? null
  const port    = boat.rental_ports
  const equipment = boat.boat_equipment ?? []
  const faqs      = boat.boat_faq ?? []

  return (
    <div className="min-h-screen bg-cream pb-28">

      {/* Hero */}
      <div className="relative">
        {heroSrc ? (
          <FocalImage
            src={heroSrc}
            alt={boat.name}
            className="w-full aspect-[4/3] object-cover"
            focalPoint={boat.focal_x != null && boat.focal_y != null ? { x: boat.focal_x, y: boat.focal_y } : null}
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-navy/10 flex items-center justify-center">
            <span className="text-7xl">⛵</span>
          </div>
        )}
        <button
          onClick={() => router.push(backUrl())}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md text-navy text-sm font-semibold"
        >←</button>

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === heroIndex ? 'bg-white w-4' : 'bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        {boat.car_class && <p className="text-gray-400 text-[13px] mb-1">{boat.car_class}</p>}
        <div className="flex items-baseline gap-2 mb-3">
          <h1 className="font-display text-[22px] text-navy font-semibold leading-tight">{boat.name}</h1>
          {boat.year_built && <span className="text-[16px] text-gray-400">({boat.year_built})</span>}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {!boat.licence_required
            ? <span className="text-[11px] px-2.5 py-1 rounded-full bg-teal/10 text-teal font-semibold">No licence</span>
            : <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold">Licence required</span>
          }
          {boat.with_skipper
            ? <span className="text-[11px] px-2.5 py-1 rounded-full bg-navy/10 text-navy font-semibold">Skipper included</span>
            : <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">No skipper</span>
          }
        </div>

        {/* Specs row */}
        <p className="text-[13px] text-gray-400">
          {[
            boat.capacity    ? `${boat.capacity} people` : null,
            boat.engine_power ? `${boat.engine_power} hp` : null,
            boat.length_m    ? `${boat.length_m} m` : null,
          ].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Booking card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-border-light p-4 space-y-4">
        <div>
          <p className="text-2xl font-bold text-navy">€{pricePerDay} <span className="text-base font-normal text-tx-light">/ day</span></p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Check-in: {boat.checkin_time ?? '09:00'} · Check-out: {boat.checkout_time ?? '18:00'}
          </p>
        </div>

        <div>
          <label className={LABEL}>Dates</label>
          <DateRangePicker
            startDate={toDate(startDate)}
            endDate={toDate(endDate)}
            onChange={(s, e) => { setStartDate(fromDate(s)); setEndDate(fromDate(e)) }}
            minDate={new Date()}
            placeholder="Check-in → Check-out"
            durationLabel="days"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className={LABEL}>Guests</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setNumGuests(n => Math.max(1, n - 1))}
              className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-navy font-semibold">−</button>
            <span className="text-navy font-semibold w-5 text-center">{numGuests}</span>
            <button onClick={() => setNumGuests(n => Math.min(20, n + 1))}
              className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-navy font-semibold">+</button>
          </div>
        </div>

        {/* Price summary */}
        {duration > 0 && (
          <div className="border-t border-border-light pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-tx-mid">
              <span>€{pricePerDay} × {duration} day{duration !== 1 ? 's' : ''}</span>
              <span>€{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-navy text-base border-t border-border-light pt-2">
              <span>Est. Total</span>
              <span>€{grandTotal.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-tx-light">Final price confirmed on enquiry</p>
          </div>
        )}

        <button
          onClick={() => setSheetOpen(true)}
          className="w-full py-4 rounded-xl bg-navy text-white font-semibold text-sm"
        >Check Availability →</button>
      </div>

      {/* Accordions */}
      <div className="px-4 mt-4">
        {boat.description && (
          <Accordion title="Description">
            <p className="whitespace-pre-line">{boat.description}</p>
          </Accordion>
        )}

        <Accordion title="Equipment">
          {equipment.length > 0 ? (
            <>
              <div className="space-y-1.5">
                {(equipExpanded ? equipment : equipment.slice(0, 4)).map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span>{equipmentIcon(item)}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {equipment.length > 4 && !equipExpanded && (
                <button onClick={() => setEquipExpanded(true)} className="mt-2 text-teal text-sm font-semibold">
                  View all ({equipment.length}) →
                </button>
              )}
            </>
          ) : (
            <p>Contact us for equipment details</p>
          )}
        </Accordion>

        <Accordion title="Location">
          {port ? (
            <>
              <p className="mb-3">Departure port: <strong>{port.name}</strong>{port.area ? `, ${port.area}` : ''}</p>
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(`${port.name} ${port.area ?? ''} Crete Greece`)}&zoom=12`}
                  width="100%"
                  height="220"
                  className="rounded-xl border-0 w-full"
                  allowFullScreen
                />
              )}
              {port.google_maps_url && (
                <a href={port.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-teal font-medium mt-2 inline-block">Open in Google Maps →</a>
              )}
            </>
          ) : (
            <p>Contact us for location details</p>
          )}
        </Accordion>

        <Accordion title="Conditions">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-navy text-[13px] mb-1">Cancellation policy</p>
              <p>{boat.cancellation_policy ?? 'Contact us for cancellation details'}</p>
            </div>
            <div className="border-t border-border-light pt-3">
              <p className="font-semibold text-navy text-[13px] mb-1">Check-in &amp; Check-out</p>
              <p>Check-in: {boat.checkin_time ?? '09:00'}</p>
              <p>Check-out: {boat.checkout_time ?? '18:00'}</p>
            </div>
          </div>
        </Accordion>

        <Accordion title="Boat Rules">
          <div className="space-y-2">
            {[
              { label: 'Fuel included in price', value: boat.fuel_included ? 'Yes' : 'No' },
              { label: 'Boat licence required', value: boat.licence_required ? 'Yes' : 'No' },
              { label: 'Minimum rental age', value: `${boat.min_rental_age ?? 18} years old` },
            ].map(row => (
              <div key={row.label} className="flex gap-2">
                <span className="text-gray-400 flex-shrink-0 w-[180px]">{row.label}</span>
                <span className="font-semibold text-navy">{row.value}</span>
              </div>
            ))}
          </div>
        </Accordion>

        {faqs.length > 0 && (
          <Accordion title="FAQ">
            <div className="space-y-2">
              {faqs.map((faq, i) => <FaqCard key={i} faq={faq} />)}
            </div>
          </Accordion>
        )}

        {faqs.length === 0 && (
          <Accordion title="FAQ">
            <p>No FAQs for this listing yet</p>
          </Accordion>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border-light px-4 py-3 flex items-center justify-between safe-bottom">
        <p className="text-[17px] font-bold text-navy">€{pricePerDay}<span className="text-[13px] font-normal text-tx-light"> / day</span></p>
        <button
          onClick={() => setSheetOpen(true)}
          className="px-5 py-2.5 bg-navy text-white font-semibold rounded-full text-sm"
        >Check Availability →</button>
      </div>

      {/* Enquiry bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setSheetOpen(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10 w-full max-w-[480px] mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* Boat summary */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-light">
              {heroSrc && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={heroSrc} alt={boat.name} className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-navy text-sm">{boat.name}</p>
                {port && <p className="text-[12px] text-tx-light">{port.name}{port.area ? `, ${port.area}` : ''}</p>}
                <p className="text-[12px] text-tx-light">€{pricePerDay}/day</p>
              </div>
            </div>

            {/* Dates + skipper summary */}
            {startDate && endDate && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-tx-mid space-y-0.5">
                <p>{startDate} → {endDate} · {duration} day{duration !== 1 ? 's' : ''}</p>
                <p>Check-in: {boat.checkin_time ?? '09:00'} · Check-out: {boat.checkout_time ?? '18:00'}</p>
                <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 ${
                  boat.with_skipper ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-500'
                }`}>
                  {boat.with_skipper ? 'With skipper' : 'Without skipper'}
                </span>
              </div>
            )}

            <div className="space-y-4">
              {/* Guest count */}
              <div className="flex items-center justify-between">
                <label className={LABEL}>Number of guests</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setNumGuests(n => Math.max(1, n - 1))}
                    className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-navy font-semibold">−</button>
                  <span className="text-navy font-semibold w-5 text-center">{numGuests}</span>
                  <button onClick={() => setNumGuests(n => Math.min(20, n + 1))}
                    className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-navy font-semibold">+</button>
                </div>
              </div>

              {/* Guest details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>First Name *</label>
                  <input className={INPUT} value={guestName.split(' ')[0] ?? ''} placeholder="Maria"
                    onChange={e => setGuestName(`${e.target.value} ${guestName.split(' ').slice(1).join(' ')}`.trim())} />
                </div>
                <div>
                  <label className={LABEL}>Last Name *</label>
                  <input className={INPUT} value={guestName.split(' ').slice(1).join(' ')} placeholder="Schmidt"
                    onChange={e => setGuestName(`${guestName.split(' ')[0] ?? ''} ${e.target.value}`.trim())} />
                </div>
              </div>

              <div>
                <label className={LABEL}>Email *</label>
                <input type="email" className={INPUT} value={guestEmail} placeholder="maria@example.com"
                  onChange={e => setGuestEmail(e.target.value)} />
              </div>

              <div>
                <label className={LABEL}>Phone *</label>
                <input type="tel" className={INPUT} value={guestPhone} placeholder="+44 7700 000000"
                  onChange={e => setGuestPhone(e.target.value)} />
              </div>

              {/* Price summary */}
              {duration > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className={LABEL}>Price Summary</p>
                  <div className="flex justify-between text-sm text-tx-mid">
                    <span>€{pricePerDay} × {duration} day{duration !== 1 ? 's' : ''}</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-navy text-sm border-t border-border-light pt-1 mt-1">
                    <span>ESTIMATED TOTAL</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-tx-light">Final price confirmed within 2 hours of enquiry</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className={LABEL}>Notes <span className="font-normal normal-case text-tx-light">(optional)</span></label>
                <textarea className={`${INPUT} resize-none`} rows={3} value={notes}
                  onChange={e => setNotes(e.target.value)} placeholder="Special requests?" />
              </div>

              {submitError && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{submitError}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canEnquire || submitting}
                className="w-full py-3.5 rounded-xl bg-teal text-white font-semibold text-sm disabled:opacity-40"
              >
                {submitting ? 'Sending…' : 'Enquire via WhatsApp →'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canEnquire || submitting}
                className="w-full py-3 rounded-xl border border-border-light text-tx-mid font-semibold text-sm disabled:opacity-40"
              >
                {submitting ? 'Sending…' : 'Send Enquiry by Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BoatDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <BoatDetailContent />
    </Suspense>
  )
}
