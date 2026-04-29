'use client'

import { useCallback, useEffect, useState } from 'react'
import { VEHICLE_LABELS, type VehicleSlug } from '@/lib/transfers'
import type { Booking } from '@/lib/types'

type Filter = 'today' | 'upcoming' | 'all'

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-gray-100   text-gray-500',   // enquiry
  confirmed: 'bg-teal/10   text-teal',
  completed: 'bg-navy/10   text-navy',
  cancelled: 'bg-red-100    text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Enquiry',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const VEHICLE_FILTER: { slug: string; label: string }[] = [
  { slug: 'all',         label: 'All' },
  { slug: 'sedan',       label: 'Sedan' },
  { slug: 'minivan',     label: 'Minivan' },
  { slug: 'minibus',     label: 'Minibus' },
  { slug: 'premium_suv', label: 'Premium SUV' },
]

function formatPickupAt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildDriverTemplate(b: Booking & { luggage_count?: number | null; notes?: string | null }): string {
  const vehicleLabel = b.vehicle_class
    ? (VEHICLE_LABELS[b.vehicle_class as VehicleSlug] ?? b.vehicle_class)
    : '—'
  return [
    `[ISLAND KEY TRANSFER]`,
    `Guest: ${b.guest_name ?? '—'}`,
    `Pickup: ${b.pickup_at ? new Date(b.pickup_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}, ${b.pickup_at ? new Date(b.pickup_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`,
    `From: ${b.pickup_location ?? '—'}`,
    `To: ${b.dropoff_location ?? '—'}`,
    `Vehicle: ${vehicleLabel}`,
    `Pax: ${b.pax_count ?? b.pax} · Luggage: ${b.luggage_count ?? '—'}`,
    `Flight: ${b.flight_number ?? 'N/A'}`,
    `Extras: ${b.extras?.length ? b.extras.join(', ') : 'None'}`,
    `Distance: ~${b.distance_km ?? '?'} km`,
    `Notes: ${b.notes ?? b.guest_notes ?? 'None'}`,
    `Reference: ${b.confirmation_code}`,
    ``,
    `Reply ACCEPT to confirm or DECLINE.`,
  ].join('\n')
}

function DriverModal({
  booking,
  onSave,
  onClose,
}: {
  booking: Booking
  onSave:  (name: string, phone: string) => void
  onClose: () => void
}) {
  const [name,  setName]  = useState(booking.driver_name  ?? '')
  const [phone, setPhone] = useState(booking.driver_phone ?? '')
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold text-navy">Assign Driver</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Driver name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Nikos Papadakis" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Driver phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="+30 6900 000 000" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
          <button onClick={() => onSave(name, phone)} className="flex-1 px-4 py-2 text-sm bg-navy text-white rounded-lg font-medium">Save</button>
        </div>
      </div>
    </div>
  )
}

export function TransferBookingsSection() {
  const [filter,       setFilter]       = useState<Filter>('today')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [bookings,     setBookings]     = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [driverModal,  setDriverModal]  = useState<Booking | null>(null)
  const [copied,       setCopied]       = useState<string | null>(null)
  const [waLinks,      setWaLinks]      = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/admin/transfer-bookings?filter=${filter}`)
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function patch(id: string, payload: Record<string, unknown>) {
    const res  = await fetch(`/api/admin/transfer-bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (json.waLink) setWaLinks(prev => ({ ...prev, [id]: json.waLink }))
    load()
  }

  function copyTemplate(b: Booking) {
    navigator.clipboard.writeText(buildDriverTemplate(b as any))
    setCopied(b.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const visible = vehicleFilter === 'all'
    ? bookings
    : bookings.filter(b => b.vehicle_class === vehicleFilter)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-navy">Transfer Bookings</h1>
        <button onClick={load} className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-navy/30">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['today','upcoming','all'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-navy text-white' : 'border border-gray-200 text-gray-600 hover:border-navy/30'}`}>
            {f === 'today' ? 'Today' : f === 'upcoming' ? 'Upcoming' : 'All'}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1" />
        {VEHICLE_FILTER.map(v => (
          <button key={v.slug} onClick={() => setVehicleFilter(v.slug)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${vehicleFilter === v.slug ? 'bg-teal text-white' : 'border border-gray-200 text-gray-600 hover:border-teal/30'}`}>
            {v.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No transfer bookings {filter === 'today' ? 'today' : filter === 'upcoming' ? 'upcoming' : 'found'}.
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((b: any) => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{b.confirmation_code}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                    {b.vehicle_class && (
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        {VEHICLE_LABELS[b.vehicle_class as VehicleSlug] ?? b.vehicle_class}
                      </span>
                    )}
                    {b.transfer_type && (
                      <span className="text-[11px] bg-navy/5 text-navy px-2 py-0.5 rounded-full font-medium capitalize">
                        {b.transfer_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-navy">
                    {b.pickup_location ?? '—'} → {b.dropoff_location ?? '—'}
                  </p>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    <span>{formatPickupAt(b.pickup_at)}</span>
                    <span>· {b.pax_count ?? b.pax} pax</span>
                    {b.luggage_count != null && <span>· {b.luggage_count} bags</span>}
                    {b.distance_km && <span>· ~{b.distance_km} km</span>}
                    {b.flight_number && <span>· ✈ {b.flight_number}</span>}
                  </div>
                  {b.extras?.length > 0 && (
                    <p className="text-xs text-gray-400">Extras: {b.extras.join(', ')}</p>
                  )}
                  {(b.notes || b.guest_notes) && (
                    <p className="text-xs text-gray-400">Notes: {b.notes ?? b.guest_notes}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {b.guest_name  && <span>{b.guest_name}</span>}
                    {b.guest_email && <span>· {b.guest_email}</span>}
                  </div>
                  {b.driver_name && (
                    <p className="text-xs text-teal font-medium">
                      Driver: {b.driver_name}{b.driver_phone ? ` · ${b.driver_phone}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-navy">€{b.total_price}</p>
                  <p className="text-xs text-gray-400">{b.payment_method}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => setDriverModal(b)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-navy/40 text-gray-600">
                  {b.driver_name ? 'Edit driver' : 'Assign driver'}
                </button>
                {b.status === 'pending' && (
                  <button onClick={() => patch(b.id, { status: 'confirmed' })}
                    className="text-xs px-3 py-1.5 bg-teal/10 border border-teal/30 text-teal rounded-lg hover:bg-teal/20">
                    Mark confirmed
                  </button>
                )}
                {waLinks[b.id] && (
                  <a href={waLinks[b.id]} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 bg-[#25D366] text-white rounded-lg hover:bg-green-700 font-medium">
                    Message guest →
                  </a>
                )}
                {b.status === 'confirmed' && (
                  <button onClick={() => patch(b.id, { status: 'completed' })}
                    className="text-xs px-3 py-1.5 bg-navy/10 border border-navy/20 text-navy rounded-lg hover:bg-navy/20">
                    Mark completed
                  </button>
                )}
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button onClick={() => patch(b.id, { status: 'cancelled' })}
                    className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100">
                    Cancel
                  </button>
                )}
                <button onClick={() => copyTemplate(b)}
                  className="text-xs px-3 py-1.5 bg-[#25D366] text-white rounded-lg hover:bg-green-700">
                  {copied === b.id ? 'Copied!' : 'Copy driver msg'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {driverModal && (
        <DriverModal
          booking={driverModal}
          onClose={() => setDriverModal(null)}
          onSave={(name, phone) => {
            patch(driverModal.id, { driver_name: name, driver_phone: phone })
            setDriverModal(null)
          }}
        />
      )}
    </div>
  )
}
