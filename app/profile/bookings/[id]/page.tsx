'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VEHICLE_LABELS, VEHICLE_ORDER, formatTransferDate, generateTimeSlots, type VehicleSlug } from '@/lib/transfers'
import { getSession } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  enquiry:   { bg: '#FFF7ED', text: '#C2410C', label: 'Pending' },
  pending:   { bg: '#FFF7ED', text: '#C2410C', label: 'Pending' },
  confirmed: { bg: '#F0FDF4', text: '#15803D', label: 'Confirmed' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' },
  completed: { bg: '#EEF2FF', text: '#1B2D4F', label: 'Completed' },
  refunded:  { bg: '#FFF7ED', text: '#92400E', label: 'Refunded' },
}

interface ActivityDetail {
  slug: string
  description: string | null
  includes: string[] | null
  good_to_know: string | null
  duration: string | null
  meeting_point: string | null
  images: string[] | null
}

interface BookingDetail {
  id: string
  item_id: string | null
  confirmation_code: string
  item_type: string
  item_title: string
  activity_slug: string | null
  booking_date: string
  booking_time: string | null
  pax: number
  pax_count: number | null
  luggage_count: number | null
  status: string
  created_at: string
  pickup_at: string | null
  pickup_location: string | null
  dropoff_location: string | null
  vehicle_class: string | null
  flight_number: string | null
  extras: string[] | null
  notes: string | null
  guest_notes: string | null
  unit_price: number
  total_price: number
  payment_method: string | null
  transfer_type: string | null
  distance_km: number | null
  duration_min: number | null
  group_ref: string | null
  guest_id: string | null
  driver_name: string | null
  driver_phone: string | null
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border-light last:border-0">
      <span className="text-[12px] text-tx-light flex-shrink-0 w-28">{label}</span>
      <span className="text-[13px] text-navy font-medium text-right flex-1">{children}</span>
    </div>
  )
}

function formatPickupFull(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateFull(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [booking, setBooking]   = useState<BookingDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Change request sheet
  const [showChangeSheet, setShowChangeSheet] = useState(false)
  const [crDate,    setCrDate]    = useState('')
  const [crTime,    setCrTime]    = useState('')
  const [crPax,     setCrPax]     = useState('')
  const [crVehicle, setCrVehicle] = useState('')
  const [crNotes,   setCrNotes]   = useState('')
  const [crSending, setCrSending] = useState(false)
  const [crDone,    setCrDone]    = useState(false)

  const slots = generateTimeSlots()

  // Cancel confirmation sheet
  const [showCancelSheet,  setShowCancelSheet]  = useState(false)
  const [cancelling,       setCancelling]       = useState(false)
  const [cancelDone,       setCancelDone]       = useState(false)

  // Activity detail
  const [activity,      setActivity]      = useState<ActivityDetail | null>(null)
  const [descExpanded,  setDescExpanded]  = useState(false)
  const [mapImgError,   setMapImgError]   = useState(false)
  // Transfer route map
  const [routeMapError, setRouteMapError] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/splash'); return }

    fetch(`/api/bookings/${encodeURIComponent(id)}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        // Basic ownership check
        if (data.guest_id && session.guest_id && data.guest_id !== session.guest_id) {
          setNotFound(true)
        } else {
          setBooking(data)
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id, router])

  useEffect(() => {
    if (!booking || booking.item_type === 'transfer' || !booking.item_id) return
    const supabase = createClient()
    supabase
      .from('activities')
      .select('slug, description, includes, good_to_know, duration, meeting_point, images')
      .eq('id', booking.item_id)
      .single()
      .then(({ data }) => { if (data) setActivity(data as ActivityDetail) }, () => {})
  }, [booking])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-sm text-tx-light">Loading…</p>
      </div>
    )
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 text-center gap-4">
        <p className="text-3xl">🔍</p>
        <p className="text-sm font-semibold text-navy">Booking not found</p>
        <button onClick={() => router.push('/profile')} className="text-sm text-teal underline">
          Back to profile
        </button>
      </div>
    )
  }

  const st = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending
  const isTransfer = booking.item_type === 'transfer'
  const paxCount = isTransfer ? (booking.pax_count ?? booking.pax) : booking.pax

  const canChange   = booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'enquiry'
  const canBookAgain = booking.status === 'completed' || booking.status === 'cancelled'

  async function submitChangeRequest() {
    if (!crNotes.trim() || crSending || !booking) return
    setCrSending(true)
    try {
      const session = getSession()
      await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id:              booking.id,
          guest_id:                session?.guest_id ?? null,
          notes:                   crNotes,
          requested_date:          crDate   || null,
          requested_time:          crTime   || null,
          requested_pax:           crPax    ? parseInt(crPax)  : null,
          requested_vehicle_class: crVehicle || null,
        }),
      })
      setCrDone(true)
    } catch { /* silent */ }
    setCrSending(false)
  }

  async function submitCancellation() {
    if (cancelling || !booking) return
    setCancelling(true)
    try {
      // Use change request as a cancellation note
      await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          notes: 'Guest has requested cancellation of this booking.',
        }),
      })
      setCancelDone(true)
    } catch { /* silent */ }
    setCancelling(false)
  }

  function handleBookAgain() {
    if (isTransfer) {
      router.push('/transfers')
    } else if (booking!.activity_slug) {
      router.push(`/activities/${booking!.activity_slug}`)
    } else {
      router.push('/activities')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-10">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-4 bg-white border-b border-border-light">
        <button onClick={() => router.back()} className="text-teal text-[12px] font-semibold mb-4 block">← Back</button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-navy">
              {isTransfer ? 'Transfer' : 'Booking'} Details
            </h1>
            <p className="text-xs text-tx-light font-mono mt-0.5">{booking.confirmation_code}</p>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: st.bg, color: st.text }}
          >
            {st.label}
          </span>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">

        {/* ══ TRANSFER TRIP REMINDER LAYOUT ══ */}
        {isTransfer && (() => {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          const origin = encodeURIComponent(booking.pickup_location ?? '')
          const dest   = encodeURIComponent(booking.dropoff_location ?? '')
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
          const staticRouteMapUrl = apiKey && !routeMapError && booking.pickup_location && booking.dropoff_location
            ? `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&markers=color:0x1A8A7D%7Clabel:A%7C${origin}&markers=color:0x1B2D4F%7Clabel:B%7C${dest}&key=${apiKey}`
            : null
          const pickupDt = booking.pickup_at
            ? new Date(booking.pickup_at)
            : booking.booking_date
              ? new Date(`${booking.booking_date}T${booking.booking_time ?? '00:00'}:00`)
              : null
          const pickupDay  = pickupDt ? pickupDt.toLocaleDateString('en', { weekday: 'long' }) : ''
          const pickupDate = pickupDt ? pickupDt.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
          const pickupTime = pickupDt
            ? pickupDt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            : (booking.booking_time?.slice(0, 5) ?? '')
          const vehicleLabel = booking.vehicle_class
            ? (VEHICLE_LABELS[booking.vehicle_class as VehicleSlug] ?? booking.vehicle_class)
            : '—'
          const durationStr = booking.duration_min
            ? booking.duration_min >= 60
              ? `~${Math.floor(booking.duration_min / 60)}h ${booking.duration_min % 60}min`
              : `~${booking.duration_min}min`
            : null
          const EXTRAS_LABELS: Record<string, string> = {
            child_seat: 'Child seat', name_board: 'Name board',
            welcome_pack: 'Welcome pack', extra_luggage: 'Extra luggage space',
          }

          return (
            <>
              {/* S1 — Trip header card */}
              <div style={{ background: '#1B2D4F', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Your transfer
                  </p>
                  <span style={{ background: '#1A8A7D', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>
                    {st.label}
                  </span>
                </div>
                {/* Route */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1A8A7D', flexShrink: 0 }} />
                    <div style={{ width: 1, flex: 1, minHeight: 20, borderLeft: '2px dashed rgba(255,255,255,0.2)', margin: '4px 0' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: 14, color: 'white', fontWeight: 600, lineHeight: 1.3 }}>{booking.pickup_location}</p>
                    {(durationStr || booking.distance_km) && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '2px 0' }}>
                        {[durationStr, booking.distance_km ? `~${booking.distance_km} km` : null].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p style={{ fontSize: 14, color: 'white', fontWeight: 600, lineHeight: 1.3 }}>{booking.dropoff_location}</p>
                  </div>
                </div>
                {/* Date + time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12, marginBottom: 8 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    {pickupDay}{pickupDate ? `, ${pickupDate}` : ''}
                  </p>
                  <p style={{ fontSize: 18, color: '#1A8A7D', fontWeight: 700 }}>{pickupTime}</p>
                </div>
                {/* Vehicle · pax · luggage */}
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  {vehicleLabel}{paxCount ? ` · ${paxCount} 👤` : ''}{booking.luggage_count != null ? ` · ${booking.luggage_count} 🧳` : ''}
                </p>
              </div>

              {/* S2 — Route map */}
              {booking.pickup_location && booking.dropoff_location && (
                <div>
                  {staticRouteMapUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={staticRouteMapUrl}
                      alt="Route map"
                      onError={() => setRouteMapError(true)}
                      style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 8 }}
                    />
                  )}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, borderRadius: 10, background: 'white', border: '1px solid #E5E7EB', paddingLeft: 12, paddingRight: 12, textDecoration: 'none' }}
                  >
                    <span style={{ color: '#1A8A7D', fontSize: 16, flexShrink: 0 }}>📍</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#1A8A7D', fontWeight: 600 }}>Open route in Google Maps</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A8A7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>
              )}

              {/* S3 — Flight info */}
              {booking.flight_number && (
                <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, marginBottom: 8 }}>
                    ✈ Flight details
                  </p>
                  <p style={{ fontSize: 16, color: '#1B2D4F', fontWeight: 700, marginBottom: 4 }}>{booking.flight_number}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>We monitor delays and adjust if needed.</p>
                </div>
              )}

              {/* S4 — Driver info */}
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, marginBottom: 10 }}>
                  🚗 {booking.driver_name ? 'Your driver' : 'Driver'}
                </p>
                {booking.driver_name ? (
                  <>
                    <p style={{ fontSize: 15, color: '#1B2D4F', fontWeight: 600, marginBottom: 4 }}>{booking.driver_name}</p>
                    {booking.driver_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <p style={{ fontSize: 13, color: '#6B7280' }}>{booking.driver_phone}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={`tel:${booking.driver_phone}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'white', border: '1px solid #1B2D4F', fontSize: 12, color: '#1B2D4F', fontWeight: 600, textDecoration: 'none' }}>
                            📞 Call
                          </a>
                          <a href={`https://wa.me/${booking.driver_phone.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#1A8A7D', color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            💬 WhatsApp
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                    Your driver will be assigned and you&apos;ll be notified within 2 hours of pickup.
                  </p>
                )}
              </div>

              {/* S5 — Extras */}
              {booking.extras && booking.extras.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, marginBottom: 10 }}>
                    ✓ Included extras
                  </p>
                  <div className="space-y-2">
                    {booking.extras.map(ex => (
                      <div key={ex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#1A8A7D', fontWeight: 700, fontSize: 13 }}>✓</span>
                        <span style={{ fontSize: 13, color: '#1B2D4F', lineHeight: 1.8 }}>
                          {EXTRAS_LABELS[ex] ?? ex.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* S6 — Trip reminders */}
              <div style={{ background: '#FDFCFA', borderLeft: '4px solid #1A8A7D', borderRadius: '0 12px 12px 0', padding: 16 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, marginBottom: 10 }}>
                  💡 Good to know
                </p>
                <div className="space-y-2">
                  {[
                    'Your driver will meet you at the pickup point with a name board',
                    'Please be ready 5 minutes before your pickup time',
                    'Free cancellation up to 24h before pickup',
                    'Flight delayed? We monitor and adjust — no need to call',
                  ].map(tip => (
                    <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#1A8A7D', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* S7 — Reference + price */}
              <div className="bg-white border border-border-light rounded-xl px-4">
                <DetailRow label="Reference">
                  <span className="font-mono text-sm">{booking.confirmation_code}</span>
                </DetailRow>
                <DetailRow label="Total paid">
                  {booking.total_price > 0 ? `€${booking.total_price}` : 'Price on enquiry'}
                </DetailRow>
                <DetailRow label="Booked on">
                  {new Date(booking.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                </DetailRow>
                {booking.group_ref && (
                  <DetailRow label="Group ref">
                    <span className="font-mono text-xs">{booking.group_ref}</span>
                  </DetailRow>
                )}
              </div>
              {booking.group_ref && (
                <p style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: -8 }}>
                  ↔ This is part of a return trip booking.
                </p>
              )}
            </>
          )
        })()}

        {/* Activity detail card */}
        {!isTransfer && (
          <div className="bg-white border border-border-light rounded-2xl overflow-hidden">
            <div className="bg-navy px-4 py-3 flex items-center gap-3">
              <span className="text-white text-xl">🌊</span>
              <p className="text-white text-sm font-semibold">{booking.item_title}</p>
            </div>
            <div className="px-4">
              <DetailRow label="Date">
                {formatDateFull(booking.booking_date)}{booking.booking_time ? ` · ${booking.booking_time.slice(0, 5)}` : ''}
              </DetailRow>
              <DetailRow label="Passengers">{paxCount} {paxCount === 1 ? 'person' : 'people'}</DetailRow>
              {(booking.notes || booking.guest_notes) && (
                <DetailRow label="Notes">{booking.notes ?? booking.guest_notes}</DetailRow>
              )}
            </div>
          </div>
        )}

        {/* Pricing card — activities only (transfers have S7 above) */}
        {!isTransfer && <div className="bg-white border border-border-light rounded-2xl px-4">
          <DetailRow label="Total paid">
            {booking.total_price > 0 ? `€${booking.total_price}` : 'Price on enquiry'}
          </DetailRow>
          {booking.payment_method && (
            <DetailRow label="Via">
              <span className="capitalize">{booking.payment_method.replace(/_/g, ' ')}</span>
            </DetailRow>
          )}
          <DetailRow label="Booked on">
            {new Date(booking.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
          </DetailRow>
          {booking.group_ref && (
            <DetailRow label="Group ref">
              <span className="font-mono text-xs">{booking.group_ref}</span>
            </DetailRow>
          )}
        </div>}

        {/* About this experience */}
        {!isTransfer && activity && (
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, marginBottom: 12 }}>
              About this experience
            </p>
            <div className="bg-white border border-border-light rounded-2xl overflow-hidden">
              <div className="p-4 space-y-4">

                {/* Hero image */}
                {activity.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activity.images[0]}
                    alt={booking.item_title}
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 12, display: 'block' }}
                  />
                )}

                {/* Description */}
                {activity.description && (
                  <div>
                    <p style={{
                      fontSize: 13, color: '#4B5563', lineHeight: 1.5,
                      ...(descExpanded ? {} : {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }),
                    }}>
                      {activity.description}
                    </p>
                    <button
                      onClick={() => setDescExpanded(v => !v)}
                      style={{ fontSize: 13, color: '#1A8A7D', marginTop: 4 }}
                    >
                      {descExpanded ? 'Show less ↑' : 'Read more →'}
                    </button>
                  </div>
                )}

                {/* What's included */}
                {activity.includes && activity.includes.length > 0 && (
                  <div className="border-t border-border-light pt-4">
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, marginBottom: 8 }}>
                      ✓ What&apos;s included
                    </p>
                    <div className="space-y-1.5">
                      {activity.includes.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span style={{ color: '#1A8A7D', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span style={{ fontSize: 13, color: '#1B2D4F' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Good to know */}
                {activity.good_to_know && (
                  <div className="border-t border-border-light pt-4">
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>
                      📋 Good to know
                    </p>
                    <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{activity.good_to_know}</p>
                  </div>
                )}

                {/* Meeting point */}
                {activity.meeting_point && (
                  <div className="border-t border-border-light pt-4">
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>
                      📍 Meeting point
                    </p>
                    <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{activity.meeting_point}</p>
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !mapImgError && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(activity.meeting_point)}&zoom=15&size=600x200&markers=color:0x1A8A7D%7C${encodeURIComponent(activity.meeting_point)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                        alt="Meeting point map"
                        onError={() => setMapImgError(true)}
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginTop: 12, display: 'block' }}
                      />
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.meeting_point)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#1A8A7D', marginTop: 8, textDecorationLine: 'underline' }}
                    >
                      📍 Open in Google Maps
                    </a>
                  </div>
                )}

                {/* Duration */}
                {activity.duration && (
                  <div className="border-t border-border-light pt-4">
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>
                      ⏱ Duration
                    </p>
                    <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{activity.duration}</p>
                  </div>
                )}

                {/* See full activity details */}
                <div className="border-t border-border-light pt-4">
                  <button
                    onClick={() => router.push(`/activities/${activity.slug}`)}
                    style={{
                      width: '100%', height: 48, borderRadius: 10,
                      background: 'white', border: '1px solid #E5E7EB',
                      display: 'flex', alignItems: 'center', gap: 10,
                      paddingLeft: 12, paddingRight: 12, cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#1A8A7D', fontSize: 18, flexShrink: 0 }}>🔍</span>
                    <span style={{ flex: 1, fontSize: 14, color: '#1B2D4F', fontWeight: 600, textAlign: 'left' }}>See full activity details</span>
                    <span style={{ color: '#1A8A7D', fontWeight: 600 }}>→</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        {canChange && (
          <div className="space-y-2">
            <button
              onClick={() => setShowChangeSheet(true)}
              className="w-full py-3 rounded-xl border-2 border-navy text-navy text-sm font-semibold"
            >
              Request changes
            </button>
            <button
              onClick={() => setShowCancelSheet(true)}
              className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium"
            >
              Cancel booking
            </button>
          </div>
        )}
        {canBookAgain && (
          <button
            onClick={handleBookAgain}
            className="w-full py-3 rounded-xl bg-teal text-white text-sm font-semibold"
          >
            {isTransfer ? 'Book another transfer →' : 'Book again →'}
          </button>
        )}

        <p className="text-center text-xs text-tx-light pb-4">
          Questions? Message us on{' '}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '306974176759'}?text=Hi, I have a question about booking ${booking.confirmation_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] font-medium"
          >
            WhatsApp
          </a>
        </p>
      </div>

      {/* Change Request Bottom Sheet */}
      {showChangeSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !crSending && setShowChangeSheet(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            {crDone ? (
              <div className="py-8 text-center space-y-3">
                <div className="text-4xl">✓</div>
                <p className="text-base font-semibold text-navy">Request sent!</p>
                <p className="text-sm text-tx-light">We'll review it and get back to you via WhatsApp.</p>
                <button onClick={() => { setShowChangeSheet(false); setCrDone(false); }} className="text-sm text-teal underline">Close</button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg text-navy mb-4">Request changes</h2>
                <p className="text-xs text-tx-light mb-4">Fill in only what you'd like to change. Notes are required.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-tx-light mb-1">New date</label>
                    <input type="date" value={crDate} onChange={e => setCrDate(e.target.value)}
                      className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40" />
                  </div>
                  <div>
                    <label className="block text-xs text-tx-light mb-1">New time</label>
                    <select value={crTime} onChange={e => setCrTime(e.target.value)}
                      className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40">
                      <option value="">— no change —</option>
                      {slots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-tx-light mb-1">New passenger count</label>
                    <input type="number" min="1" max="16" value={crPax} onChange={e => setCrPax(e.target.value)}
                      placeholder="— no change —"
                      className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40" />
                  </div>
                  {isTransfer && (
                    <div>
                      <label className="block text-xs text-tx-light mb-1">New vehicle class</label>
                      <select value={crVehicle} onChange={e => setCrVehicle(e.target.value)}
                        className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40">
                        <option value="">— no change —</option>
                        {VEHICLE_ORDER.map(v => <option key={v} value={v}>{VEHICLE_LABELS[v]}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-tx-light mb-1">Notes *</label>
                    <textarea value={crNotes} onChange={e => setCrNotes(e.target.value)}
                      placeholder="Describe the change you need…"
                      rows={3}
                      className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-navy/40 resize-none" />
                  </div>
                  <button
                    onClick={submitChangeRequest}
                    disabled={!crNotes.trim() || crSending}
                    className="w-full py-3.5 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-40"
                  >
                    {crSending ? 'Sending…' : 'Send change request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Bottom Sheet */}
      {showCancelSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !cancelling && setShowCancelSheet(false)} />
          <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            {cancelDone ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-base font-semibold text-navy">Cancellation request sent</p>
                <p className="text-sm text-tx-light">We'll process it and confirm via WhatsApp.</p>
                <button onClick={() => { setShowCancelSheet(false); setCancelDone(false); }} className="text-sm text-teal underline">Close</button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg text-navy mb-2">Cancel booking?</h2>
                <p className="text-sm text-tx-light mb-5">
                  This will send a cancellation request to our team. Your booking remains active until we confirm.
                  Free cancellation applies up to 24h before the booking.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={submitCancellation}
                    disabled={cancelling}
                    className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-40"
                  >
                    {cancelling ? 'Sending…' : 'Request cancellation'}
                  </button>
                  <button onClick={() => setShowCancelSheet(false)} className="w-full py-3 text-sm text-tx-light">
                    Keep booking
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
