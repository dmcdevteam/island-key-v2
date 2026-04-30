'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VEHICLE_LABELS, type VehicleSlug } from '@/lib/transfers'
import { useBookingCard } from '@/app/_components/booking-card-context'

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
  const { setDrawerOpen } = useBookingCard()
  const [open, setOpen] = useState(false)

  if (bookings.length === 0) return null

  const sorted = [...bookings].sort((a, b) => effectiveMs(a) - effectiveMs(b))

  function close() {
    setOpen(false)
    setDrawerOpen(false)
  }

  function go(b: UpcomingBooking) {
    close()
    if (b.item_type === 'transfer') router.push('/profile')
    else if (b.activity_slug)       router.push(`/activities/${b.activity_slug}`)
    else                            router.push('/profile')
  }

  return (
    <>
      <style>{`
        @keyframes ik-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .ik-pulse-dot { animation: ik-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Pill — z-index 49 so drawer (50/51) always renders on top */}
      <div style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        zIndex: 49,
        display: open ? 'none' : 'block',
      }}>
        <button
          onClick={() => { setOpen(true); setDrawerOpen(true) }}
          style={{
            width: '100%',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #1A8A7D',
            borderRadius: 24,
            paddingLeft: 16,
            paddingRight: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            cursor: 'pointer',
          }}
        >
          <span className="ik-pulse-dot" style={{
            flexShrink: 0,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#1A8A7D',
          }} />
          <span style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: '#1B2D4F',
            textAlign: 'left',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            {pillLabel(sorted)}
          </span>
          <span style={{ flexShrink: 0, fontSize: 16, fontWeight: 700, color: '#1A8A7D' }}>›</span>
        </button>
      </div>

      {open && (
        <>
          {/* Backdrop — z-index 50 */}
          <div
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 50,
            }}
          />

          {/* Drawer panel — z-index 51, fixed so no parent overflow can clip it */}
          <div style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 51,
            backgroundColor: 'white',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '75vh',
          }}>

            {/* Drag handle — never scrolls */}
            <div style={{
              flexShrink: 0,
              padding: '12px 0 4px',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E5E7EB',
              }} />
            </div>

            {/* Header — never scrolls */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 20px 12px',
              borderBottom: '1px solid #F3F4F6',
            }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1B2D4F' }}>
                Your upcoming bookings
              </span>
              <button
                onClick={close}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 18,
                  color: '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Cards — THE scrollable region */}
            <div style={{
              flex: 1,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              minHeight: 0,          // critical: lets flex child shrink below content size in Safari
              padding: '12px 16px 40px',
            }}>
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
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Icon circle */}
                    <span style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#E6F4F3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {icon}
                    </span>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1B2D4F',
                        lineHeight: 1.3,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {title}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0' }}>
                        {formatWhen(b)}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '1px 0 0' }}>
                        {subParts.join(' · ')}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#1A8A7D',
                      background: '#E6F4F3',
                      padding: '3px 8px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}>
                      ● Confirmed
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
