'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { getSession } from '@/lib/utils'
import { useFavourites } from '@/app/_components/favourites-provider'
import type { GuestSession } from '@/lib/types'

const ITEM_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  event: 'Event',
  deal: 'Deal',
  article: 'Article',
  rental: 'Rental',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  enquiry:   { bg: '#F1F5F9', text: '#64748B', label: 'Enquiry sent' },
  pending:   { bg: '#F1F5F9', text: '#64748B', label: 'Pending' },
  confirmed: { bg: '#E6F7F5', text: '#1A8A7D', label: 'Confirmed' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' },
  completed: { bg: '#EEF2FF', text: '#1B2D4F', label: 'Completed' },
  refunded:  { bg: '#FFF7ED', text: '#92400E', label: 'Refunded' },
}

interface BookingRow {
  id: string
  confirmation_code: string
  item_type: string
  item_title: string
  booking_date: string
  pax: number
  status: string
  created_at: string
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<GuestSession | null>(null)
  const { favourites, sessionId } = useFavourites()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/splash'); return }
    setSession(s)

    if (s.guest_id) {
      setBookingsLoading(true)
      fetch(`/api/bookings?guest_id=${encodeURIComponent(s.guest_id)}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setBookings(data) })
        .catch(() => {})
        .finally(() => setBookingsLoading(false))
    }
  }, [router])

  if (!session) return null

  const initial = session.first_name?.charAt(0).toUpperCase() ?? '?'

  function navigateToItem(fav: typeof favourites[0]) {
    const routes: Record<string, string> = {
      activity: `/activities/${fav.item_slug}`,
      event:    `/events/${fav.item_slug}`,
      deal:     `/deals`,
      article:  `/insights/${fav.item_slug}`,
      rental:   `/rentals`,
    }
    router.push(routes[fav.item_type] ?? '/')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-4 bg-white border-b border-border-light">
        <button onClick={() => window.history.length <= 1 ? router.push('/home') : router.back()}
          className="text-teal text-[12px] font-semibold mb-4 block">← Back</button>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center mb-3">
            <span className="text-2xl font-bold text-cream">{initial}</span>
          </div>
          <h1 className="font-display text-xl text-navy">{session.first_name}</h1>
          {session.property_name && (
            <p className="text-xs text-tx-light mt-0.5">{session.property_name}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Section 1 — Stay details */}
        <div className="mx-5 mt-4 mb-4 bg-white border border-border-light rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">Your Stay</h2>
            <button
              onClick={() => router.push('/onboard?edit=1')}
              className="text-[11px] font-semibold text-teal"
            >Edit</button>
          </div>
          <div className="divide-y divide-border-light">
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-[13px] text-tx-mid">Property</span>
              <span className="text-[13px] font-semibold text-navy">{session.property_name || '—'}</span>
            </div>
            {(session.check_in || session.check_out) && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[13px] text-tx-mid">Dates</span>
                <span className="text-[13px] font-semibold text-navy">
                  {session.check_in
                    ? new Date(session.check_in + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })
                    : '—'
                  }
                  {' → '}
                  {session.check_out
                    ? new Date(session.check_out + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })
                    : '—'
                  }
                </span>
              </div>
            )}
            {session.group_type && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[13px] text-tx-mid">Group</span>
                <span className="text-[13px] font-semibold text-navy capitalize">{session.group_type}</span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-[13px] text-tx-mid">Region</span>
              <span className="text-[13px] font-semibold text-navy capitalize">{session.region}</span>
            </div>
          </div>
        </div>

        {/* Section 2 — Saved items */}
        <div className="mx-5 mb-4">
          <h2 className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-3">Saved</h2>
          {favourites.length === 0 ? (
            <div className="bg-white border border-border-light rounded-sm px-4 py-6 text-center">
              <p className="text-2xl mb-2">♡</p>
              <p className="text-xs font-semibold text-navy mb-1">Nothing saved yet</p>
              <p className="text-[11px] text-tx-light">Tap the ♡ on any activity, event or deal to save it here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {favourites.map(fav => (
                <button
                  key={fav.id}
                  onClick={() => navigateToItem(fav)}
                  className="w-full flex gap-3 bg-white border border-border-light rounded-sm p-3 active:scale-[0.98] transition-transform text-left"
                >
                  {fav.item_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fav.item_image} alt={fav.item_title} className="w-16 h-12 object-cover rounded-sm flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-navy/10 rounded-sm flex-shrink-0 flex items-center justify-center">
                      <span className="text-lg">
                        {fav.item_type === 'activity' ? '🌊' : fav.item_type === 'event' ? '📅' : fav.item_type === 'deal' ? '🎁' : '📖'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold uppercase text-tx-light bg-sand px-1.5 py-0.5 rounded">
                        {ITEM_TYPE_LABELS[fav.item_type] ?? fav.item_type}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-navy line-clamp-2 leading-snug">{fav.item_title}</h4>
                    {fav.item_price && <p className="text-[11px] text-teal font-semibold mt-0.5">{fav.item_price}</p>}
                  </div>
                  <span className="text-[11px] text-teal self-center flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 3 — My Enquiries */}
        <div className="mx-5 mb-4">
          <h2 className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-3">My Enquiries</h2>
          {bookingsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-[72px] bg-white border border-border-light rounded-sm animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-border-light rounded-sm px-4 py-6 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-xs font-semibold text-navy mb-1">No enquiries yet</p>
              <p className="text-[11px] text-tx-light">Your booking enquiries will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookings.map(b => {
                const st = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending
                return (
                  <div key={b.id} className="bg-white border border-border-light rounded-sm p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-navy leading-snug flex-1">{b.item_title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-tx-light mb-1">{formatDate(b.booking_date)} · {b.pax} {b.pax === 1 ? 'person' : 'people'}</p>
                    {b.confirmation_code && (
                      <p className="text-[10px] text-tx-light font-mono">{b.confirmation_code}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 4 — My Details (collapsible) */}
        <div className="mx-5 mb-4">
          <button
            onClick={() => setDetailsOpen(o => !o)}
            className="w-full flex items-center justify-between py-2"
          >
            <h2 className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">My Details</h2>
            <span className="text-tx-light text-sm">{detailsOpen ? '▲' : '▼'}</span>
          </button>
          {detailsOpen && (
            <div className="bg-white border border-border-light rounded-sm overflow-hidden mt-1">
              <div className="divide-y divide-border-light">
                {session.whatsapp_number && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[13px] text-tx-mid">WhatsApp</span>
                    <span className="text-[13px] font-semibold text-navy">{session.whatsapp_number}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-[13px] text-tx-mid">Group type</span>
                  <span className="text-[13px] font-semibold text-navy capitalize">{session.group_type || '—'}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-[13px] text-tx-mid">Tier</span>
                  <span className="text-[13px] font-semibold text-navy">{session.tier}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
