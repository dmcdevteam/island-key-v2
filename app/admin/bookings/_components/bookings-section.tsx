'use client'

import { useState, useEffect, useCallback } from 'react'

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded'

interface BookingRow {
  id: string
  confirmation_code: string
  item_type: string
  item_title: string
  booking_date: string
  pax: number
  unit_price: number
  total_price: number
  payment_method: string
  status: BookingStatus
  guest_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_notes: string | null
  action_token: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  created_at: string
  properties: { name: string } | null
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_BADGE: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Pending' },
  confirmed: { bg: 'bg-teal-100',   text: 'text-teal-800',   label: 'Confirmed' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled' },
  completed: { bg: 'bg-navy/10',    text: 'text-navy',       label: 'Completed' },
  refunded:  { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Refunded' },
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTs(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function DetailPanel({ booking, onClose, onStatusChange }: {
  booking: BookingRow
  onClose: () => void
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function act(status: string) {
    setLoading(status)
    await onStatusChange(booking.id, status)
    setLoading(null)
  }

  const row = (label: string, value: string | null | undefined) => value ? (
    <div className="flex gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-[12px] text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 break-all">{value}</span>
    </div>
  ) : null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Booking detail</p>
            <p className="text-[15px] font-bold text-navy font-mono mt-0.5">{booking.confirmation_code}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status + actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={booking.status} />
              {booking.confirmed_at && (
                <span className="text-[11px] text-gray-400">Confirmed {fmtTs(booking.confirmed_at)}</span>
              )}
              {booking.cancelled_at && (
                <span className="text-[11px] text-gray-400">Cancelled {fmtTs(booking.cancelled_at)}</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => act('confirmed')}
                    disabled={!!loading}
                    className="px-3 py-1.5 bg-teal text-white text-[12px] font-semibold rounded hover:bg-teal/90 disabled:opacity-50 transition-colors"
                  >
                    {loading === 'confirmed' ? 'Confirming…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => act('cancelled')}
                    disabled={!!loading}
                    className="px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading === 'cancelled' ? 'Cancelling…' : 'Cancel'}
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => act('completed')}
                    disabled={!!loading}
                    className="px-3 py-1.5 bg-navy text-white text-[12px] font-semibold rounded hover:bg-navy/90 disabled:opacity-50 transition-colors"
                  >
                    {loading === 'completed' ? 'Updating…' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => act('cancelled')}
                    disabled={!!loading}
                    className="px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading === 'cancelled' ? 'Cancelling…' : 'Cancel'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Booking info */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Booking</p>
            {row('Experience', booking.item_title)}
            {row('Date', fmt(booking.booking_date))}
            {row('Guests', `${booking.pax} ${booking.pax === 1 ? 'person' : 'people'}`)}
            {row('Unit price', `€${booking.unit_price}`)}
            {row('Total', `€${booking.total_price}`)}
            {row('Payment', booking.payment_method)}
            {row('Type', booking.item_type)}
          </div>

          {/* Guest info */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Guest</p>
            {row('Name', booking.guest_name)}
            {row('Email', booking.guest_email)}
            {row('Property', booking.properties?.name)}
            {row('Notes', booking.guest_notes)}
          </div>

          {/* Meta */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meta</p>
            {row('Created', fmtTs(booking.created_at))}
            {row('Reference', booking.confirmation_code)}
          </div>
        </div>
      </div>
    </>
  )
}

export function BookingsSection() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('all')
  const [search, setSearch]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [selected, setSelected] = useState<BookingRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (search)   params.set('search', search)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo)   params.set('to', dateTo)
    const res = await fetch(`/api/admin/bookings?${params}`)
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [status, search, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const { booking } = await res.json()
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...booking } : b))
      setSelected(prev => prev?.id === id ? { ...prev, ...booking } : prev)
    }
  }

  // Stats
  const total     = bookings.length
  const pending   = bookings.filter(b => b.status === 'pending').length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const thisWeek  = bookings.filter(b => {
    const created = new Date(b.created_at)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return created >= weekAgo
  }).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-navy">Bookings</h1>
        <button
          onClick={load}
          className="text-[12px] font-medium text-gray-500 hover:text-navy transition-colors px-3 py-1.5 border border-gray-200 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total enquiries', value: total },
          { label: 'Pending',         value: pending },
          { label: 'Confirmed',       value: confirmed },
          { label: 'This week',       value: thisWeek },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
            <p className="text-[24px] font-bold text-navy mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        {/* Status tabs */}
        <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                status === tab.value
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + date range */}
        <div className="flex flex-col gap-3 p-4">
          <input
            type="text"
            placeholder="Search name, reference, email, activity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="flex-1 min-w-[130px] px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <span className="text-gray-400 text-[12px]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="flex-1 min-w-[130px] px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Reference', 'Guest', 'Experience', 'Date', 'Property', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-teal font-semibold whitespace-nowrap">
                      {b.confirmation_code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-gray-900 whitespace-nowrap">{b.guest_name ?? '—'}</p>
                      {b.guest_email && (
                        <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{b.guest_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[180px]">
                      <p className="truncate">{b.item_title}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{b.item_type} · {b.pax}p</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                      {fmt(b.booking_date)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                      {b.properties?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(b.id, 'confirmed')}
                              className="px-2 py-1 text-[11px] font-semibold bg-teal/10 text-teal rounded hover:bg-teal/20 transition-colors whitespace-nowrap"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusChange(b.id, 'cancelled')}
                              className="px-2 py-1 text-[11px] font-semibold bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(b.id, 'completed')}
                            className="px-2 py-1 text-[11px] font-semibold bg-navy/10 text-navy rounded hover:bg-navy/20 transition-colors whitespace-nowrap"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
