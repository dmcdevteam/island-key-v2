'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VEHICLE_LABELS, type VehicleSlug } from '@/lib/transfers'

export interface UpcomingBooking {
  id: string
  item_type: string
  item_title: string
  status: string
  booking_date: string
  booking_time: string | null
  pickup_at: string | null
  pickup_location: string | null
  dropoff_location: string | null
  vehicle_class: string | null
  pax_count: number | null
  pax: number
  activity_slug?: string
  confirmation_code: string
}

function effectiveMs(b: UpcomingBooking): number {
  if (b.item_type === 'transfer' && b.pickup_at) return new Date(b.pickup_at).getTime()
  return new Date(b.booking_date + 'T' + (b.booking_time ?? '00:00') + ':00').getTime()
}

function formatWhen(b: UpcomingBooking): string {
  const d      = new Date(effectiveMs(b))
  const today  = new Date().toISOString().slice(0, 10)
  const tmrw   = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const dayStr = d.toISOString().slice(0, 10)
  const prefix = dayStr === today  ? 'Today'
               : dayStr === tmrw   ? 'Tomorrow'
               : d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
  const time   = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${prefix} · ${time}`
}

function pillLabel(sorted: UpcomingBooking[]): string {
  if (sorted.length >= 2) return `${sorted.length} upcoming bookings`
  const b = sorted[0]
  if (b.item_type === 'transfer' && b.pickup_location && b.dropoff_location) {
    const from = b.pickup_location.split(',')[0].trim()
    const to   = b.dropoff_location.split(',')[0].trim()
    return `${from} → ${to} · ${formatWhen(b)}`
  }
  return b.item_title
}

export function FloatingBookingsPill({ bookings }: { bookings: UpcomingBooking[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (bookings.length === 0) return null

  const sorted = [...bookings].sort((a, b) => effectiveMs(a) - effectiveMs(b))

  function go(b: UpcomingBooking) {
    setOpen(false)
    if (b.item_type === 'transfer') router.push('/profile')
    else if (b.activity_slug)       router.push(`/activities/${b.activity_slug}`)
    else                            router.push('/profile')
  }

  return (
    <>
      {/* Collapsed pill — sits above BottomNav */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4" style={{ bottom: 86 }}>
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 bg-navy text-white rounded-full px-4 py-3 shadow-lg border-l-4 border-teal active:opacity-90 transition-opacity"
        >
          <span className="text-base flex-shrink-0">🗓</span>
          <span className="flex-1 text-sm font-semibold truncate text-left">{pillLabel(sorted)}</span>
          <span className="text-teal font-bold flex-shrink-0">→</span>
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setOpen(false)} />
      )}

      {/* Bottom drawer */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300"
        style={{
          maxHeight: '70vh',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h2 className="font-display text-base font-semibold text-navy">Your upcoming bookings</h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-tx-light rounded-full hover:bg-navy/5 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Cards */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 65px)' }}>
          <div className="p-4 space-y-3">
            {sorted.map(b => {
              const isTransfer = b.item_type === 'transfer'
              const icon  = isTransfer ? '🚗' : '🌊'
              const title = isTransfer && b.pickup_location && b.dropoff_location
                ? `${b.pickup_location} → ${b.dropoff_location}`
                : b.item_title
              const sub   = isTransfer
                ? [
                    b.vehicle_class ? (VEHICLE_LABELS[b.vehicle_class as VehicleSlug] ?? b.vehicle_class) : null,
                    `${b.pax_count ?? b.pax} pax`,
                  ].filter(Boolean).join(' · ')
                : `${b.pax} pax`

              return (
                <button
                  key={b.id}
                  onClick={() => go(b)}
                  className="w-full flex items-start gap-3 bg-cream border border-border-light rounded-xl p-3.5 text-left active:bg-sand transition-colors"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy leading-snug truncate">{title}</p>
                    <p className="text-xs text-tx-light mt-0.5">{formatWhen(b)}</p>
                    <p className="text-xs text-tx-light">{sub}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700">Confirmed ●</span>
                    <span className="text-[11px] text-teal font-semibold">→</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
