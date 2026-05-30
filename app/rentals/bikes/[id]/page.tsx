'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { FocalImage } from '@/components/FocalImage'
import DateRangePicker, { toDate, fromDate } from '@/components/ui/date-range-picker'
import type { CarRental, BikeRentalExtra } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const VEHICLE_CLASS_LABELS: Record<string, string> = {
  city_bike:     'City Bike',
  ebike:         'E-Bike',
  mountain_bike: 'Mountain Bike',
  atv:           'ATV / Quad',
  motorbike:     'Motorbike',
  scooter:       'Scooter',
}

const DEFAULT_BIKE_TCS = `All rentals include: Helmet, Pump, Lock, Bottle holder, Repair set.

Rental Conditions:
The LEASER received the bike having verified that it is in perfect condition in every respect. The LEASER takes responsibility for the return of the bicycle or bicycles in the same condition as when he/she received them, taking into account normal wear and tear.

The LEASER is responsible for any damage, loss or theft of the bicycle during the rental period. The LEASER must keep the bicycle locked when not in use and must not leave it unattended for extended periods.

In the event of an accident, theft or damage, the LEASER must notify Island Key immediately. The LEASER is responsible for all costs related to repairs or replacement.

The bicycle must be used in accordance with traffic laws and regulations. The LEASER must wear the provided helmet at all times while riding.

Island Key reserves the right to refuse rental to any person deemed unfit to operate a bicycle safely.

Rental fees are non-refundable once the rental period has commenced, except in cases of mechanical failure attributable to Island Key.`

const INPUT  = 'w-full px-3 py-2.5 border border-border-light rounded-xl text-sm text-navy bg-white outline-none focus:border-navy/40 transition-colors'
const LABEL  = 'block text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-1.5'

type Suggestion  = { place_id: string; description: string; types: string[] }
type PlaceResult = { display_name: string; place_id: string; lat: number; lng: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function generateTimeSlots(from = '08:00', to = '20:00'): string[] {
  const slots: string[] = []
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  for (let h = fh; h <= th; h++) {
    for (const m of [0, 30]) {
      if (h === fh && m < fm) continue
      if (h === th && m > tm) continue
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function calcBikePrice(
  pricePerDay: number,
  days: number,
  dayDiscounts: Record<string, number> | null,
) {
  const baseDays  = Math.min(days, 3)
  let base        = pricePerDay * baseDays
  let discount    = 0
  const breakdown: { label: string; price: number; pct: number }[] = []

  if (days > 3) {
    for (let d = 4; d <= days; d++) {
      const key = d >= 7 ? '7plus' : String(d)
      const pct = dayDiscounts?.[key] ?? 0
      const dp  = pricePerDay * (1 - pct / 100)
      base     += dp
      discount += pricePerDay - dp
      breakdown.push({ label: `Day ${d >= 7 && d === 7 ? '7+' : d}`, price: dp, pct })
    }
  }

  return { base, discount, breakdown }
}

// ─── PlacesInput (delivery address) ─────────────────────────────────────────

function PlacesInput({
  placeholder, value, onSelect, onClear,
}: {
  placeholder: string; value: PlaceResult | null
  onSelect: (p: PlaceResult) => void; onClear: () => void
}) {
  const [text, setText] = useState(value?.display_name ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchSuggestions(input: string) {
    if (input.length < 2) { setSuggestions([]); return }
    try {
      const res  = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
      const data = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
    } catch { setSuggestions([]) }
  }

  function handleChange(v: string) {
    setText(v); onClear()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fetchSuggestions(v).then(() => setOpen(true)), 300)
  }

  async function selectSuggestion(s: Suggestion) {
    setOpen(false); setSuggestions([]); setText(s.description)
    try {
      const res  = await fetch(`/api/places/details?place_id=${encodeURIComponent(s.place_id)}`)
      const data = await res.json()
      if (!data.error) {
        onSelect({ display_name: data.name || s.description, place_id: data.place_id, lat: data.lat, lng: data.lng })
        setText(data.name || s.description)
      }
    } catch { /* keep typed text */ }
  }

  return (
    <div className="relative">
      <div className={`${INPUT} flex items-center gap-2`}>
        <span style={{ color: '#D4854A', fontSize: 14, flexShrink: 0 }}>📍</span>
        <input
          value={text}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 outline-none bg-transparent text-sm text-navy placeholder-gray-400"
        />
        {text && (
          <button
            onMouseDown={() => { setText(''); onClear(); setSuggestions([]); setOpen(false) }}
            className="text-gray-300 text-lg leading-none flex-shrink-0"
          >×</button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border-light rounded-xl shadow-xl z-50 overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.place_id}
              onMouseDown={() => selectSuggestion(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
            >
              <span className="text-gray-400 flex-shrink-0 mt-px">📍</span>
              <span className="truncate">{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-border-light py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-navy text-[15px] underline underline-offset-2">{title}</span>
        <span className="text-tx-mid text-sm ml-3 flex-shrink-0">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="mt-3 text-sm text-tx-mid leading-relaxed whitespace-pre-line">{children}</div>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function BikeDetailContent() {
  const router = useRouter()
  const params = useParams()
  const sp     = useSearchParams()
  const id     = params.id as string

  const [vehicle,  setVehicle]  = useState<CarRental | null>(null)
  const [extras,   setExtras]   = useState<BikeRentalExtra[]>([])
  const [loading,  setLoading]  = useState(true)

  // Booking state
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [pickupTime,   setPickupTime]   = useState('09:00')
  const [returnTime,   setReturnTime]   = useState('09:00')
  const [quantity,     setQuantity]     = useState(1)
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({})

  // Enquiry sheet
  const [sheetOpen,    setSheetOpen]    = useState(false)
  const [guestName,    setGuestName]    = useState('')
  const [guestEmail,   setGuestEmail]   = useState('')
  const [guestPhone,   setGuestPhone]   = useState('')
  const [deliveryPlace,setDeliveryPlace]= useState<PlaceResult | null>(null)
  const [notes,        setNotes]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [refCode,      setRefCode]      = useState('')
  const [waMessage,    setWaMessage]    = useState('')
  const [submitError,  setSubmitError]  = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/rentals/vehicles?id=${id}`).then(r => r.json()),
      fetch('/api/rentals/bike-extras').then(r => r.json()),
    ]).then(([vData, eData]) => {
      setVehicle(vData.rental ?? null)
      setExtras(Array.isArray(eData.extras) ? eData.extras : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const duration = startDate && endDate ? daysBetween(startDate, endDate) : 0
  const discounts = vehicle?.day_discounts ?? null
  const pricePerDay = vehicle?.price_per_day ?? 0

  const { base, discount, breakdown } = duration > 0
    ? calcBikePrice(pricePerDay, duration, discounts)
    : { base: 0, discount: 0, breakdown: [] }

  const selectedExtrasList = extras.filter(e => selectedExtras[e.id])
  const extrasTotal        = selectedExtrasList.reduce((s, e) => s + (e.price ?? 0), 0)
  const grandTotal         = (base + extrasTotal) * quantity

  function backUrl() {
    const p = new URLSearchParams(sp.toString())
    p.set('category', 'bike_ebike')
    p.delete('rental_id')
    return `/rentals/cars/results?${p.toString()}`
  }

  async function handleSubmit() {
    if (!vehicle) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res  = await fetch('/api/rentals/bike-enquiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id:        vehicle.id,
          vehicle_name:      vehicle.name,
          vehicle_class:     vehicle.car_class ?? '',
          delivery_address:  deliveryPlace?.display_name ?? '',
          delivery_place_id: deliveryPlace?.place_id ?? '',
          start_date:        startDate,
          end_date:          endDate,
          pickup_time:       pickupTime,
          return_time:       returnTime,
          quantity,
          duration_days:     duration,
          selected_extras:   selectedExtrasList.map(e => ({ name: e.name, price: e.price ?? 0 })),
          extras_total:      extrasTotal,
          base_price:        base,
          discount_total:    discount,
          grand_total:       grandTotal,
          guest_name:        guestName,
          guest_email:       guestEmail,
          guest_phone:       guestPhone,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Submission failed')
      setRefCode(data.reference_code)
      setWaMessage(data.whatsapp_message ?? '')
      setSuccess(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canEnquire = !!startDate && !!endDate && !!guestName && !!guestEmail && !!guestPhone

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-tx-light text-sm">Loading…</p>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <p className="text-tx-light text-sm">Bike not found.</p>
        <button onClick={() => router.back()} className="text-teal text-sm font-semibold">← Go back</button>
      </div>
    )
  }

  const heroSrc   = vehicle.image_wide ?? vehicle.images?.[0] ?? null
  const features  = (vehicle.features ?? {}) as Record<string, boolean>
  const includes  = vehicle.bike_includes ?? ['Helmet', 'Pump', 'Lock', 'Bottle holder', 'Repair set']
  const classLabel = vehicle.car_class ? (VEHICLE_CLASS_LABELS[vehicle.car_class] ?? vehicle.car_class) : null

  function whatsappUrl(msg: string) {
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '306900000000'
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 pb-10 text-center">
        <div className="w-16 h-16 rounded-full bg-teal/10 border-2 border-teal flex items-center justify-center mb-4">
          <span className="text-teal text-2xl">✓</span>
        </div>
        <h2 className="font-display text-2xl text-navy mb-2">Enquiry Sent!</h2>
        <p className="text-sm text-tx-mid mb-1">We'll be in touch within 2 hours.</p>
        <p className="text-sm text-tx-mid mb-6">Check your email and WhatsApp.</p>
        {refCode && (
          <p className="text-[11px] text-tx-light mb-6">
            Reference: <span className="font-mono font-bold text-navy">{refCode}</span>
          </p>
        )}
        <div className="w-full max-w-[360px] space-y-3">
          {waMessage && (
            <a
              href={whatsappUrl(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-semibold rounded-xl text-sm"
            >
              <span>💬</span> Message us on WhatsApp →
            </a>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 border border-border-light rounded-xl text-sm font-semibold text-tx-mid"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-8">

      {/* Hero photo */}
      <div className="relative">
        {heroSrc ? (
          <FocalImage
            src={heroSrc}
            alt={vehicle.name}
            className="w-full aspect-[4/3] object-cover"
            focalPoint={vehicle.focal_x != null && vehicle.focal_y != null ? { x: vehicle.focal_x, y: vehicle.focal_y } : null}
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-teal/20 flex items-center justify-center">
            <span className="text-6xl">🚲</span>
          </div>
        )}
        <button
          onClick={() => router.push(backUrl())}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md text-navy text-sm font-semibold"
        >←</button>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        {classLabel && <p className="text-gray-400 text-[13px] mb-1">{classLabel}</p>}
        <h1 className="font-display text-[22px] text-navy font-semibold leading-tight mb-3">{vehicle.name}</h1>

        <div className="flex flex-wrap gap-2">
          {vehicle.availability_note && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-teal text-white font-semibold">{vehicle.availability_note}</span>
          )}
          {vehicle.delivery_area && (
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-500">📍 {vehicle.delivery_area}</span>
          )}
          {vehicle.features?.free_cancellation && (
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-teal text-teal">✓ Free Cancellation</span>
          )}
        </div>
      </div>

      {/* Booking card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-border-light p-4 space-y-4">

        {/* Price */}
        <div>
          <p className="text-2xl font-bold text-navy">
            €{pricePerDay} <span className="text-base font-normal text-tx-light">/ day</span>
          </p>
          {discounts && Object.keys(discounts).length > 0 && (
            <p className="text-[12px] text-teal mt-0.5">Discounts apply from day 4 onwards</p>
          )}
        </div>

        {/* Dates */}
        <div>
          <label className={LABEL}>When</label>
          <DateRangePicker
            startDate={toDate(startDate)}
            endDate={toDate(endDate)}
            onChange={(s, e) => { setStartDate(fromDate(s)); setEndDate(fromDate(e)) }}
            minDate={new Date()}
            placeholder="Pick-up → Return"
            durationLabel="days"
          />
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Pickup Time</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <span style={{ color: '#D4854A', fontSize: 13 }}>🕐</span>
              <select value={pickupTime} onChange={e => setPickupTime(e.target.value)}
                className="flex-1 text-sm text-navy outline-none bg-transparent">
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Return Time</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <span style={{ color: '#D4854A', fontSize: 13 }}>🕐</span>
              <select value={returnTime} onChange={e => setReturnTime(e.target.value)}
                className="flex-1 text-sm text-navy outline-none bg-transparent">
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between">
          <label className={LABEL}>Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-navy font-semibold"
            >−</button>
            <span className="text-navy font-semibold w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(10, q + 1))}
              className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-navy font-semibold"
            >+</button>
          </div>
        </div>

        {/* Price breakdown */}
        {duration > 0 && (
          <div className="border-t border-border-light pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-tx-mid">
              <span>€{pricePerDay} × {Math.min(duration, 3)} day{Math.min(duration, 3) !== 1 ? 's' : ''}</span>
              <span>€{(pricePerDay * Math.min(duration, 3)).toFixed(2)}</span>
            </div>
            {breakdown.map((b, i) => (
              <div key={i} className="flex justify-between text-tx-mid">
                <span>{b.label}: {b.pct > 0 ? `${b.pct}% off` : 'standard rate'}</span>
                <span>€{b.price.toFixed(2)}</span>
              </div>
            ))}
            {discount > 0 && (
              <div className="flex justify-between text-teal font-semibold">
                <span>Discount</span>
                <span>−€{discount.toFixed(2)}</span>
              </div>
            )}
            {selectedExtrasList.length > 0 && selectedExtrasList.map(e => (
              <div key={e.id} className="flex justify-between text-tx-mid">
                <span>{e.name}</span>
                <span>€{(e.price ?? 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border-light pt-2 flex justify-between font-bold text-navy text-base">
              <span>Total × {quantity}</span>
              <span>€{grandTotal.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-tx-light">Estimated total — confirmed on enquiry</p>
          </div>
        )}

        {/* Extras */}
        {extras.length > 0 && (
          <div className="border-t border-border-light pt-4">
            <p className={`${LABEL} mb-3`}>Add to your rental</p>
            <div className="space-y-3">
              {extras.map(extra => (
                <div key={extra.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">{extra.name}</p>
                    {extra.price != null && (
                      <p className="text-[11px] text-tx-light">€{extra.price.toFixed(2)}/rental</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExtras(prev => ({ ...prev, [extra.id]: !prev[extra.id] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      selectedExtras[extra.id] ? 'bg-teal' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      selectedExtras[extra.id] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full py-4 rounded-xl bg-navy text-white font-semibold text-sm"
        >
          Check Availability →
        </button>
      </div>

      {/* Specs */}
      {(vehicle.rider_height || vehicle.max_speed || vehicle.motor_power || vehicle.autonomy || vehicle.gears) && (
        <div className="px-4 mt-6">
          <h2 className="font-semibold text-navy text-[16px] mb-3">Specifications</h2>
          <div className="space-y-2">
            {[
              { label: "Rider's Height",  value: vehicle.rider_height },
              { label: 'Max Speed',       value: vehicle.max_speed },
              { label: 'Motor',           value: vehicle.motor_power },
              { label: 'Range',           value: vehicle.autonomy },
              { label: 'Gears',           value: vehicle.gears },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex gap-2 text-[13px]">
                <span className="text-gray-400 w-[120px] flex-shrink-0">{row.label}</span>
                <span className="text-gray-300">·</span>
                <span className="text-navy">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Includes */}
      <div className="px-4 mt-6">
        <h2 className="font-semibold text-navy text-[16px] mb-3">All rentals include</h2>
        <div className="space-y-1.5">
          {includes.map(item => (
            <div key={item} className="flex items-center gap-2 text-[13px]">
              <span className="text-teal font-bold flex-shrink-0">✓</span>
              <span className="text-navy">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion sections */}
      <div className="px-4 mt-4">
        {vehicle.description && (
          <Accordion title="Description">
            {vehicle.description}
          </Accordion>
        )}

        <Accordion title="Rental Terms & Conditions">
          {vehicle.bike_tcs ?? DEFAULT_BIKE_TCS}
        </Accordion>

        {/* Delivery info */}
        <div className="border-t border-border-light py-4">
          <h3 className="font-semibold text-navy text-[15px] mb-2">Delivery Information</h3>
          <p className="text-[13px] text-tx-mid leading-relaxed">
            Free delivery for rentals up to 3 days or up to 3 bicycles. Delivery time: 18:00–21:00 daily.
            Delivery area: Kolymbari to Platanias &amp; Kolymbari to Kissamos.
          </p>
          {vehicle.delivery_area && (
            <p className="text-[12px] text-teal mt-2">Delivery area for this bike: {vehicle.delivery_area}</p>
          )}
        </div>

        {/* Contextual WhatsApp help */}
        <div className="border-t border-border-light mt-4 pt-4 pb-2 text-center">
          <p className="text-[13px] text-gray-400 mb-2">Questions about your rental?</p>
          <a
            href="https://wa.me/306974176759?text=Hi%2C%20I%20need%20help%20with%20a%20bike%20rental%20in%20Crete"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-teal"
          >
            <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.84.742 5.508 2.043 7.824L0 32l8.385-2.199A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.283 13.283 0 01-6.766-1.848l-.485-.288-5.016 1.315 1.339-4.884-.316-.501A13.261 13.261 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667c7.364 0 13.333 5.969 13.333 13.333 0 7.364-5.969 13.333-13.333 13.333zm7.307-9.98c-.4-.2-2.368-1.168-2.735-1.3-.367-.132-.634-.2-.9.2-.267.4-1.033 1.3-1.267 1.568-.233.267-.467.3-.867.1-.4-.2-1.688-.623-3.217-1.984-1.189-1.06-1.99-2.37-2.224-2.77-.233-.4-.025-.617.175-.816.18-.178.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.168-1.233-2.968-.325-.78-.655-.674-.9-.686-.233-.012-.5-.015-.767-.015-.267 0-.7.1-1.067.5-.367.4-1.4 1.368-1.4 3.334s1.434 3.868 1.634 4.134c.2.267 2.82 4.305 6.831 6.036.955.413 1.7.659 2.282.844.958.305 1.83.262 2.519.159.768-.115 2.368-.967 2.702-1.901.333-.933.333-1.734.233-1.901-.1-.167-.367-.267-.767-.467z"/>
            </svg>
            Chat with us on WhatsApp
          </a>
        </div>
      </div>

      {/* Enquiry bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setSheetOpen(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10 w-full max-w-[480px] mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* Vehicle summary */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-light">
              {heroSrc && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={heroSrc} alt={vehicle.name} className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-navy text-sm">{vehicle.name}</p>
                <p className="text-[12px] text-tx-light">€{pricePerDay}/day</p>
              </div>
            </div>

            <div className="space-y-4">
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

              {/* Delivery address */}
              <div>
                <label className={LABEL}>Delivery Address *</label>
                <PlacesInput
                  placeholder="Your villa or hotel address"
                  value={deliveryPlace}
                  onSelect={setDeliveryPlace}
                  onClear={() => setDeliveryPlace(null)}
                />
              </div>

              {/* Selected extras summary */}
              {selectedExtrasList.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className={LABEL}>Selected Extras</p>
                  {selectedExtrasList.map(e => (
                    <div key={e.id} className="flex justify-between text-sm text-tx-mid">
                      <span>{e.name}</span>
                      <span>€{(e.price ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price summary */}
              {duration > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className={LABEL}>Price Summary</p>
                  <div className="flex justify-between text-sm text-tx-mid">
                    <span>Base ({duration} days × {quantity} bike{quantity !== 1 ? 's' : ''})</span>
                    <span>€{(base * quantity).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-teal">
                      <span>Discount</span>
                      <span>−€{(discount * quantity).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-navy text-sm border-t border-border-light pt-1 mt-1">
                    <span>ESTIMATED TOTAL</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-tx-light">Final price confirmed on enquiry</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className={LABEL}>Notes <span className="font-normal normal-case text-tx-light">(optional)</span></label>
                <textarea
                  className={`${INPUT} resize-none`}
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any questions or special requests?"
                />
              </div>

              {submitError && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{submitError}</div>
              )}

              {/* CTAs */}
              <button
                onClick={handleSubmit}
                disabled={!canEnquire || submitting}
                className="w-full py-3.5 rounded-xl bg-teal text-white font-semibold text-sm disabled:opacity-40"
              >
                {submitting ? 'Sending…' : 'Enquire via WhatsApp →'}
              </button>

              {waMessage && (
                <a
                  href={whatsappUrl(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl border border-teal text-teal font-semibold text-sm text-center"
                >
                  Open WhatsApp →
                </a>
              )}

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

export default function BikeDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <BikeDetailContent />
    </Suspense>
  )
}
