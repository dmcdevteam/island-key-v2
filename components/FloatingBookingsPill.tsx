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
  luggage_count: number | null
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
    return `${from} → ${to}`
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
      {/* Pulsing dot keyframes */}
      <style>{`
        @keyframes ik-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .ik-pulse-dot { animation: ik-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Pill — centered, above bottom nav (nav ≈ 64px + 12px gap + 48px pill = 92px from bottom) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 px-4"
        style={{ bottom: 80, width: '100%', maxWidth: 480 }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 bg-white rounded-full shadow-lg active:opacity-90 transition-opacity"
          style={{
            height: 48,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 24,
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #1A8A7D',
          }}
        >
          {/* Live pulse dot */}
          <span
            className="ik-pulse-dot flex-shrink-0 w-2 h-2 rounded-full"
            style={{ background: '#1A8A7D' }}
          />
          {/* Label */}
          <span
            className="flex-1 text-sm font-semibold truncate text-left"
            style={{ color: '#1B2D4F' }}
          >
            {pillLabel(sorted)}
          </span>
          {/* Chevron */}
          <span className="flex-shrink-0 text-sm font-bold" style={{ color: '#1A8A7D' }}>›</span>
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom drawer — full screen width, flex column so cards area can scroll */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white z-50 transition-transform duration-300"
        style={{
          borderRadius: '20px 20px 0 0',
          maxHeight: '70vh',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle — fixed */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1 rounded-full" style={{ background: '#D1D5DB' }} />
        </div>

        {/* Header — fixed */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold" style={{ color: '#1B2D4F' }}>
            Your upcoming bookings
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Cards — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch' as const,
          }}
        >
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
            {sorted.map(b => {
              const isTransfer = b.item_type === 'transfer'
              const icon  = isTransfer ? '🚗' : '🏄'
              const title = isTransfer && b.pickup_location && b.dropoff_location
                ? `${b.pickup_location} → ${b.dropoff_location}`
                : b.item_title

              const subParts: string[] = []
              if (isTransfer) {
                if (b.vehicle_class) subParts.push(VEHICLE_LABELS[b.vehicle_class as VehicleSlug] ?? b.vehicle_class)
                subParts.push(`${b.pax_count ?? b.pax} pax`)
                if (b.luggage_count != null) subParts.push(`${b.luggage_count} bags`)
              } else {
                subParts.push(`${b.pax} pax`)
              }

              return (
                <button
                  key={b.id}
                  onClick={() => go(b)}
                  className="w-full text-left active:opacity-80 transition-opacity"
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  {/* Icon circle */}
                  <span
                    className="flex-shrink-0 flex items-center justify-center text-lg"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#E6F4F3',
                    }}
                  >
                    {icon}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-snug"
                      style={{
                        color: '#1B2D4F',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{formatWhen(b)}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{subParts.join(' · ')}</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0 flex items-start pt-0.5">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#E6F4F3', color: '#1A8A7D', whiteSpace: 'nowrap' }}
                    >
                      ● Confirmed
                    </span>
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
