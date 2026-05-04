'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FocalImage } from '@/components/FocalImage'
import type { CarEnquiryPayload, CarRental } from '@/lib/types'

const CAR_CLASS_LABELS: Record<string, string> = {
  small: 'Small Car', medium: 'Medium Car', compact: 'Compact Car',
  suv: 'SUV', convertible: 'Convertible', van: 'Van',
  luxury: 'Luxury Car', offroad: '4×4 Off-Road',
}

function formatDate(d: string): string {
  if (!d) return d
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function whatsappUrl(message: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '306900000000'
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

type EnquiryState = CarEnquiryPayload & { vehicle?: CarRental }

export default function ConfirmPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [state,      setState]      = useState<EnquiryState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [refCode,    setRefCode]    = useState('')
  const [waMessage,  setWaMessage]  = useState('')
  const [error,      setError]      = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('rental_enquiry')
    if (raw) {
      try { setState(JSON.parse(raw)) } catch { /* ignore */ }
    }
  }, [])

  if (!state) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3 px-5">
        <p className="text-tx-light text-sm text-center">No enquiry data found. Please start from the search.</p>
        <button onClick={() => router.push('/rentals')} className="text-teal text-sm font-semibold">← Back to Rentals</button>
      </div>
    )
  }

  const vehicle = state.vehicle
  const heroSrc = vehicle?.image_wide ?? vehicle?.images?.[0] ?? null

  async function handleSubmit() {
    if (!state) return
    setSubmitting(true)
    setError('')
    try {
      const res  = await fetch('/api/rentals/car-enquiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(state),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Submission failed')
      setRefCode(data.reference_code)
      setWaMessage(data.whatsapp_message ?? '')
      sessionStorage.removeItem('rental_enquiry')
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 pb-10 text-center">
        <div className="w-16 h-16 rounded-full bg-teal/10 border-2 border-teal flex items-center justify-center mb-4">
          <span className="text-teal text-2xl">✓</span>
        </div>
        <h2 className="font-display text-2xl text-navy mb-2">Enquiry Sent!</h2>
        <p className="text-sm text-tx-mid mb-1">We'll confirm your booking within 2 hours.</p>
        <p className="text-sm text-tx-mid mb-6">Check your email and WhatsApp.</p>
        {refCode && (
          <p className="text-[11px] text-tx-light mb-6">Reference: <span className="font-mono font-bold text-navy">{refCode}</span></p>
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
            className="w-full py-3 border border-border-light rounded-xl text-sm font-semibold text-tx-mid hover:border-navy hover:text-navy transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[100px]">
      {/* Header */}
      <div className="px-4 pt-[52px] pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-tx-mid">← Back</button>
        <h1 className="font-display text-lg text-navy">Confirm Enquiry</h1>
      </div>

      <div className="px-4 space-y-4">

        {/* Trip summary */}
        <div className="bg-white rounded-2xl border border-border-light p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-navy text-sm">Trip Summary</h3>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-[#D4854A] mt-0.5">📍</span>
            <div>
              <p className="text-navy font-medium">{state.pickup_location}</p>
              <p className="text-tx-light text-[11px]">{formatDate(state.pickup_date)} at {state.pickup_time}</p>
            </div>
          </div>
          {state.diff_dropoff && state.dropoff_location && (
            <div className="flex items-start gap-3 text-sm">
              <span className="text-navy mt-0.5">→</span>
              <div>
                <p className="text-navy font-medium">{state.dropoff_location}</p>
                <p className="text-tx-light text-[11px]">{formatDate(state.dropoff_date)} at {state.dropoff_time}</p>
              </div>
            </div>
          )}
          {!state.diff_dropoff && (
            <div className="flex items-center gap-3 text-sm text-tx-light">
              <span>→</span>
              <p>{formatDate(state.dropoff_date)} at {state.dropoff_time}</p>
            </div>
          )}
          <p className="text-[11px] text-tx-light border-t border-border-light pt-2">
            {state.duration_days} day{state.duration_days !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Vehicle card */}
        {vehicle && (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            {heroSrc ? (
              <FocalImage
                src={heroSrc}
                alt={vehicle.name}
                className="w-full aspect-video object-cover"
                focalPoint={vehicle.focal_x != null && vehicle.focal_y != null ? { x: vehicle.focal_x, y: vehicle.focal_y } : null}
              />
            ) : (
              <div className="w-full aspect-video bg-navy/10 flex items-center justify-center">
                <span className="text-4xl">🚗</span>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {vehicle.car_class && (
                  <span className="text-[10px] font-bold uppercase bg-sand px-2 py-0.5 rounded-full text-navy">
                    {CAR_CLASS_LABELS[vehicle.car_class] ?? vehicle.car_class}
                  </span>
                )}
              </div>
              <p className="font-display text-lg text-navy">{vehicle.name}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {vehicle.seats        && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">🪑 {vehicle.seats} seats</span>}
                {vehicle.doors        && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">🚪 {vehicle.doors} doors</span>}
                {vehicle.transmission && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">⚙️ {vehicle.transmission}</span>}
                {vehicle.fuel_type    && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">⛽ {vehicle.fuel_type}</span>}
                {vehicle.ac           && <span className="text-[11px] text-tx-mid bg-sand px-2 py-0.5 rounded-full">❄️ A/C</span>}
              </div>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl border border-border-light p-4 shadow-sm">
          <h3 className="font-semibold text-navy text-sm mb-3">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-tx-mid">
              <span>{state.duration_days} days × €{vehicle?.price_per_day ?? '—'}/day</span>
              <span>€{((vehicle?.price_per_day ?? 0) * state.duration_days).toFixed(2)}</span>
            </div>
            {(state.selected_extras ?? []).map((e, i) => (
              <div key={i} className="flex justify-between text-tx-mid">
                <span>{e.name}</span>
                <span>€{e.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border-light pt-2 flex justify-between font-bold text-navy text-base">
              <span>Total Estimate</span>
              <span>€{state.grand_total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-[11px] text-tx-light mt-2">
            Estimated total — exact pricing confirmed within 2 hours of enquiry submission.
          </p>
        </div>

        {/* Driver summary */}
        <div className="bg-white rounded-2xl border border-border-light p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy text-sm">Driver Details</h3>
            <button onClick={() => router.back()} className="text-xs text-teal font-semibold">Edit</button>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-tx-light">Name</span>
              <span className="text-navy font-medium">{state.driver_first_name} {state.driver_last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tx-light">Email</span>
              <span className="text-navy">{state.driver_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tx-light">Phone</span>
              <span className="text-navy">{state.driver_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tx-light">Country</span>
              <span className="text-navy">{state.driver_country}</span>
            </div>
            {state.flight_number && (
              <div className="flex justify-between">
                <span className="text-tx-light">Flight</span>
                <span className="text-navy">{state.flight_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-tx-light">Driver Age</span>
              <span className="text-navy">{state.driver_age}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border-light px-4 py-4 shadow-2xl">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {submitting ? 'Sending…' : 'Send Enquiry →'}
        </button>
      </div>
    </div>
  )
}
