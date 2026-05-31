'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { getSession, setSession } from '@/lib/utils'
import { useFavourites } from '@/app/_components/favourites-provider'
import { VEHICLE_LABELS, type VehicleSlug } from '@/lib/transfers'
import type { GuestSession } from '@/lib/types'
import { useEssentialsCart } from '@/lib/essentials-cart'
import { AccommodationInput } from '@/components/ui/accommodation-input'

type PlaceResult = { display_name: string; formatted_address: string; place_id: string; lat: number; lng: number }

const ITEM_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  event: 'Event',
  deal: 'Deal',
  article: 'Article',
  rental: 'Rental',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  enquiry:   { bg: '#FFF7ED', text: '#C2410C', label: 'Pending' },
  pending:   { bg: '#FFF7ED', text: '#C2410C', label: 'Pending' },
  confirmed: { bg: '#F2FBE8', text: '#3A6B00', label: 'Confirmed' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' },
  completed: { bg: '#F7F5F1', text: '#5C5A56', label: 'Completed' },
  refunded:  { bg: '#FFF7ED', text: '#92400E', label: 'Refunded' },
}

interface BookingRow {
  id: string
  confirmation_code: string
  item_type: string
  item_title: string
  booking_date: string
  booking_time: string | null
  pax: number
  pax_count: number | null
  status: string
  created_at: string
  activity_slug?: string
  pickup_at: string | null
  pickup_location: string | null
  dropoff_location: string | null
  vehicle_class: string | null
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPickup(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSessionState] = useState<GuestSession | null>(null)
  const { favourites, sessionId } = useFavourites()
  const { items: cartItems, cartCount, removeItem: removeCartItem } = useEssentialsCart()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [stayOpen, setStayOpen] = useState(false)
  const [staySaving, setStaySaving] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/splash'); return }
    setSessionState(s)

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

  async function handleAccommodationSelect(p: PlaceResult) {
    if (!session) return
    setStaySaving(true)
    const updated: GuestSession = {
      ...session,
      accommodation_name: p.display_name,
      accommodation_address: p.formatted_address,
      lat: p.lat,
      lng: p.lng,
      place_id: p.place_id,
    }
    setSession(updated)        // persist to localStorage
    setSessionState(updated)   // update React state
    if (session.guest_id) {
      await fetch(`/api/guests/${session.guest_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accommodation_name: p.display_name,
          accommodation_address: p.formatted_address,
          lat: p.lat,
          lng: p.lng,
          place_id: p.place_id,
        }),
      }).catch(() => {})
    }
    setStaySaving(false)
  }

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
    <div className="min-h-screen bg-white flex flex-col pb-[90px]">

      {/* Header */}
      <div className="px-5 pt-[52px] pb-7 flex flex-col items-center">
        {/* Avatar with lime ring */}
        <div className="relative mb-4">
          <div className="w-[72px] h-[72px] rounded-full bg-ink flex items-center justify-center">
            <span className="font-display text-[28px] font-light text-white">{initial}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-lime border-2 border-white" />
        </div>
        <h1 className="font-display text-[28px] font-light text-ink leading-none">{session.first_name}</h1>
        {session.property_name && (
          <p className="text-[13px] text-tx-mid mt-1">{session.property_name}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* YOUR STAY */}
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Your Stay</p>
        <div className="bg-white mx-5 rounded-2xl border border-border overflow-hidden mb-5">
          <div className="divide-y divide-border">
            <div className="flex justify-between items-center px-4 py-3.5">
              <span className="text-[14px] text-ink">Property</span>
              <span className="text-[13px] text-tx-mid">{session.property_name || '—'}</span>
            </div>
            {(session.check_in || session.check_out) && (
              <div className="flex justify-between items-center px-4 py-3.5">
                <span className="text-[14px] text-ink">Dates</span>
                <span className="text-[13px] text-tx-mid">
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
              <div className="flex justify-between items-center px-4 py-3.5">
                <span className="text-[14px] text-ink">Group</span>
                <span className="text-[13px] text-tx-mid capitalize">{session.group_type}</span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-3.5">
              <span className="text-[14px] text-ink">Region</span>
              <span className="text-[13px] text-tx-mid capitalize">{session.region}</span>
            </div>
            <button
              onClick={() => router.push('/onboard?edit=1')}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-[14px] font-semibold text-ink">Edit Stay Details</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* ACCOMMODATION */}
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Accommodation</p>
        <div className="bg-white mx-5 rounded-2xl border border-border overflow-hidden mb-5">
          <button
            onClick={() => setStayOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-[14px] text-ink">Update Location</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: stayOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          {stayOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-border space-y-2">
              <p className="text-[12px] text-tx-light">Update your address for accurate transfers and deliveries.</p>
              <AccommodationInput
                initialValue={session.accommodation_name ?? session.property_name ?? ''}
                onSelect={handleAccommodationSelect}
              />
              {staySaving && <p className="text-[12px] text-tx-mid">Saving…</p>}
              {session.accommodation_address && !staySaving && (
                <p className="text-[12px] text-tx-light flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{session.accommodation_address}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* SAVED */}
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Saved</p>
        <div className="mx-5 mb-5">
          {favourites.length === 0 ? (
            <div className="bg-mist rounded-2xl px-4 py-7 text-center">
              <p className="text-2xl mb-2">♡</p>
              <p className="text-[13px] font-semibold text-ink mb-1">Nothing saved yet</p>
              <p className="text-[12px] text-tx-light">Tap the ♡ on any activity, event or deal to save it here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {favourites.map(fav => (
                <button
                  key={fav.id}
                  onClick={() => navigateToItem(fav)}
                  className="w-full flex gap-3 bg-white border border-border rounded-2xl p-3 active:scale-[0.98] transition-transform text-left"
                >
                  {fav.item_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fav.item_image} alt={fav.item_title} className="w-16 h-12 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-mist rounded-xl flex-shrink-0 flex items-center justify-center">
                      <span className="text-lg">
                        {fav.item_type === 'activity' ? '🌊' : fav.item_type === 'event' ? '📅' : fav.item_type === 'deal' ? '🎁' : '📖'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold uppercase text-tx-light bg-mist px-1.5 py-0.5 rounded-full">
                        {ITEM_TYPE_LABELS[fav.item_type] ?? fav.item_type}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug">{fav.item_title}</h4>
                    {fav.item_price && <p className="text-[12px] font-semibold text-ink mt-0.5">{fav.item_price}</p>}
                  </div>
                  <svg className="self-center flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MY BOOKINGS */}
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">My Bookings</p>
        <div className="mx-5 mb-5">
          {bookingsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-[72px] skeleton rounded-2xl" />
              ))}
            </div>
          ) : bookings.filter(b => b.item_type !== 'essential').length === 0 ? (
            <div className="bg-mist rounded-2xl px-4 py-7 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-[13px] font-semibold text-ink mb-1">Your bookings will appear here</p>
              <p className="text-[12px] text-tx-light">Activities and transfers you&apos;ve booked show up here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookings.filter(b => b.item_type !== 'essential').map(b => {
                const isTransfer = b.item_type === 'transfer'
                const st   = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending
                const icon = isTransfer ? '🚗' : '🌊'
                const title = isTransfer
                  ? `${b.pickup_location ?? ''} → ${b.dropoff_location ?? ''}`.trim() || b.item_title
                  : b.item_title
                const dateStr = isTransfer && b.pickup_at
                  ? formatPickup(b.pickup_at)
                  : formatDate(b.booking_date) + (b.booking_time ? ` · ${b.booking_time.slice(0, 5)}` : '')
                const paxCount = isTransfer ? (b.pax_count ?? b.pax) : b.pax
                return (
                  <div
                    key={b.id}
                    className="w-full text-left bg-white border border-border rounded-2xl p-4 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-mist flex items-center justify-center flex-shrink-0 text-base mt-0.5">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[13px] font-semibold text-ink leading-snug flex-1">{title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: st.bg, color: st.text }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-tx-light">
                        {dateStr} · {paxCount} {paxCount === 1 ? 'passenger' : 'passengers'}
                      </p>
                      {isTransfer && b.vehicle_class && (
                        <p className="text-[12px] text-tx-light">
                          {VEHICLE_LABELS[b.vehicle_class as VehicleSlug] ?? b.vehicle_class}
                        </p>
                      )}
                      {b.confirmation_code && (
                        <p className="text-[11px] text-tx-xlight font-mono mt-1">{b.confirmation_code}</p>
                      )}
                    </div>
                    <Link
                      href={`/profile/bookings/${b.id}`}
                      className="text-[12px] font-semibold text-ink self-center flex-shrink-0 bg-mist rounded-full px-3 py-1"
                    >
                      View
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* VACATION ESSENTIALS CART */}
        {cartCount > 0 && (
          <>
            <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Vacation Essentials</p>
            <div className="mx-5 mb-5">
              <div className="flex flex-col gap-2">
                {cartItems.map(item => (
                  <div key={item.id} className="bg-white border border-border rounded-2xl p-3 flex items-center gap-3">
                    {item.image_wide ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_wide} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-mist flex items-center justify-center text-xl flex-shrink-0">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink line-clamp-1">{item.name}</p>
                      <p className="text-[12px] text-tx-light">Qty: {item.quantity} · €{(item.price_per_day * item.quantity).toFixed(0)}/day</p>
                    </div>
                    <button onClick={() => removeCartItem(item.id)}
                      className="text-[12px] text-ember flex-shrink-0">Remove</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/rentals/essentials/cart')}
                className="mt-3 w-full bg-lime text-ink text-sm font-semibold py-3 rounded-full"
              >
                Proceed to Enquiry ({cartCount})
              </button>
            </div>
          </>
        )}

        {/* ESSENTIALS ENQUIRIES */}
        {!bookingsLoading && bookings.filter(b => b.item_type === 'essential').length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Essentials Enquiries</p>
            <div className="mx-5 mb-5">
              <div className="flex flex-col gap-2.5">
                {bookings.filter(b => b.item_type === 'essential').map(b => {
                  const st = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending
                  return (
                    <div key={b.id} className="bg-white border border-border rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-mist flex items-center justify-center flex-shrink-0 text-base mt-0.5">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-[13px] font-semibold text-ink leading-snug flex-1">{b.item_title}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: st.bg, color: st.text }}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-tx-light">{formatDate(b.booking_date)}</p>
                        {b.confirmation_code && (
                          <p className="text-[11px] text-tx-xlight font-mono mt-1">{b.confirmation_code}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* SUPPORT */}
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Support</p>
        <div className="bg-white mx-5 rounded-2xl border border-border overflow-hidden mb-5">
          <div className="divide-y divide-border">
            <a
              href="https://wa.me/306974176759?text=Hi%2C%20I%20need%20help%20with%20my%20stay%20in%20Crete"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-[14px] text-ink">Chat on WhatsApp</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a
              href="mailto:islandkeygr@gmail.com"
              className="flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-[14px] text-ink">Email Us</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

        {/* ACCOUNT */}
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-widest px-5 pb-2">Account</p>
        <div className="bg-white mx-5 rounded-2xl border border-border overflow-hidden mb-8">
          <div className="divide-y divide-border">
            <button
              onClick={() => setDetailsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-[14px] text-ink">Personal Details</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: detailsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            {detailsOpen && (
              <div className="divide-y divide-border">
                {session.whatsapp_number && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-[13px] text-tx-mid">WhatsApp</span>
                    <span className="text-[13px] font-semibold text-ink">{session.whatsapp_number}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[13px] text-tx-mid">Group type</span>
                  <span className="text-[13px] font-semibold text-ink capitalize">{session.group_type || '—'}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[13px] text-tx-mid">Tier</span>
                  <span className="text-[13px] font-semibold text-ink">{session.tier}</span>
                </div>
              </div>
            )}
            <a
              href="/privacy"
              className="flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-[14px] text-ink">Privacy &amp; Terms</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
