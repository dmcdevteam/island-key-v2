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

interface EditFields {
  guest_name: string
  guest_email: string
  guest_notes: string
  booking_date: string
  pax: number
  item_title: string
  status: BookingStatus
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

const ALL_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded']

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

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-[13px] font-medium transition-all ${
      type === 'success' ? 'bg-teal' : 'bg-red-600'
    }`}>
      {msg}
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">{body}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ booking, onClose, onStatusChange, onSave, onDeleteRequest }: {
  booking: BookingRow
  onClose: () => void
  onStatusChange: (id: string, status: string) => Promise<void>
  onSave: (id: string, fields: EditFields) => Promise<boolean>
  onDeleteRequest: (id: string, code: string) => void
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const [form, setForm] = useState<EditFields>({
    guest_name:   booking.guest_name   ?? '',
    guest_email:  booking.guest_email  ?? '',
    guest_notes:  booking.guest_notes  ?? '',
    booking_date: booking.booking_date ?? '',
    pax:          booking.pax          ?? 1,
    item_title:   booking.item_title   ?? '',
    status:       booking.status,
  })

  // Keep form in sync if booking prop changes (e.g. after status action)
  useEffect(() => {
    setForm({
      guest_name:   booking.guest_name   ?? '',
      guest_email:  booking.guest_email  ?? '',
      guest_notes:  booking.guest_notes  ?? '',
      booking_date: booking.booking_date ?? '',
      pax:          booking.pax          ?? 1,
      item_title:   booking.item_title   ?? '',
      status:       booking.status,
    })
  }, [booking])

  async function act(status: string) {
    setActionLoading(status)
    await onStatusChange(booking.id, status)
    setActionLoading(null)
  }

  async function handleSave() {
    setSaveLoading(true)
    const ok = await onSave(booking.id, form)
    setSaveLoading(false)
    if (ok) setIsEditing(false)
  }

  const field = (label: string, value: string | null | undefined) => value ? (
    <div className="flex gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-[12px] text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 break-all">{value}</span>
    </div>
  ) : null

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20"
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1"

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {isEditing ? 'Edit booking' : 'Booking detail'}
            </p>
            <p className="text-[15px] font-bold text-navy font-mono mt-0.5">{booking.confirmation_code}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-[12px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-900 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isEditing ? (
            /* ── Edit form ── */
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Activity / item name</label>
                <input className={inputCls} value={form.item_title}
                  onChange={e => setForm(f => ({ ...f, item_title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" className={inputCls} value={form.booking_date}
                    onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>People</label>
                  <input type="number" min={1} className={inputCls} value={form.pax}
                    onChange={e => setForm(f => ({ ...f, pax: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as BookingStatus }))}>
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Guest</p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input className={inputCls} value={form.guest_name}
                      onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" className={inputCls} value={form.guest_email}
                      onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea rows={3} className={inputCls + ' resize-none'} value={form.guest_notes}
                      onChange={e => setForm(f => ({ ...f, guest_notes: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Read-only fields in edit mode */}
              <div className="border-t border-gray-100 pt-4 space-y-1">
                {field('Reference', booking.confirmation_code)}
                {field('Created', fmtTs(booking.created_at))}
              </div>
            </div>
          ) : (
            /* ── Read-only view ── */
            <div className="space-y-5">
              {/* Status + quick actions */}
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
                      <button onClick={() => act('confirmed')} disabled={!!actionLoading}
                        className="px-3 py-1.5 bg-teal text-white text-[12px] font-semibold rounded hover:bg-teal/90 disabled:opacity-50 transition-colors">
                        {actionLoading === 'confirmed' ? 'Confirming…' : 'Confirm'}
                      </button>
                      <button onClick={() => act('cancelled')} disabled={!!actionLoading}
                        className="px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {actionLoading === 'cancelled' ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <button onClick={() => act('completed')} disabled={!!actionLoading}
                        className="px-3 py-1.5 bg-navy text-white text-[12px] font-semibold rounded hover:bg-navy/90 disabled:opacity-50 transition-colors">
                        {actionLoading === 'completed' ? 'Updating…' : 'Mark Complete'}
                      </button>
                      <button onClick={() => act('cancelled')} disabled={!!actionLoading}
                        className="px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {actionLoading === 'cancelled' ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Booking info */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Booking</p>
                {field('Experience', booking.item_title)}
                {field('Date', fmt(booking.booking_date))}
                {field('Guests', `${booking.pax} ${booking.pax === 1 ? 'person' : 'people'}`)}
                {field('Unit price', `€${booking.unit_price}`)}
                {field('Total', `€${booking.total_price}`)}
                {field('Payment', booking.payment_method)}
                {field('Type', booking.item_type)}
              </div>

              {/* Guest info */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Guest</p>
                {field('Name', booking.guest_name)}
                {field('Email', booking.guest_email)}
                {field('Property', booking.properties?.name)}
                {field('Notes', booking.guest_notes)}
              </div>

              {/* Meta */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meta</p>
                {field('Created', fmtTs(booking.created_at))}
                {field('Reference', booking.confirmation_code)}
              </div>

              {/* Delete */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => onDeleteRequest(booking.id, booking.confirmation_code)}
                  className="w-full py-2.5 text-[13px] font-semibold text-red-500 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  Delete booking
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only in edit mode */}
        {isEditing && (
          <div className="flex gap-3 px-5 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => { setIsEditing(false); setForm({
                guest_name:   booking.guest_name   ?? '',
                guest_email:  booking.guest_email  ?? '',
                guest_notes:  booking.guest_notes  ?? '',
                booking_date: booking.booking_date ?? '',
                pax:          booking.pax          ?? 1,
                item_title:   booking.item_title   ?? '',
                status:       booking.status,
              }) }}
              className="flex-1 py-2.5 text-[13px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel edit
            </button>
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-navy rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {saveLoading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function BookingsSection() {
  const [bookings, setBookings]       = useState<BookingRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]           = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [selected, setSelected]       = useState<BookingRow | null>(null)
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmDel, setConfirmDel]   = useState<{ ids: string[]; code?: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search)   params.set('search', search)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo)   params.set('to', dateTo)
    const res = await fetch(`/api/admin/bookings?${params}`)
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setSelectedIds(new Set())
    setLoading(false)
  }, [statusFilter, search, dateFrom, dateTo])

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

  async function handleSave(id: string, fields: EditFields): Promise<boolean> {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (res.ok) {
      const { booking } = await res.json()
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...booking } : b))
      setSelected(prev => prev?.id === id ? { ...prev, ...booking } : prev)
      showToast('Booking updated')
      return true
    }
    showToast('Failed to save', 'error')
    return false
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map(id =>
      fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
    ))
    setBookings(prev => prev.filter(b => !ids.includes(b.id)))
    if (selected && ids.includes(selected.id)) setSelected(null)
    setSelectedIds(new Set())
    setConfirmDel(null)
    showToast(ids.length === 1 ? 'Booking deleted' : `${ids.length} bookings deleted`)
  }

  function toggleRow(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === bookings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(bookings.map(b => b.id)))
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

  const allChecked = bookings.length > 0 && selectedIds.size === bookings.length
  const someChecked = selectedIds.size > 0

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {confirmDel && (
        <ConfirmDialog
          title={`Delete booking${confirmDel.ids.length > 1 ? 's' : ''}${confirmDel.code ? ` ${confirmDel.code}` : ` (${confirmDel.ids.length})`}?`}
          body={confirmDel.ids.length === 1
            ? 'This permanently removes the record and cannot be undone.'
            : `This permanently removes ${confirmDel.ids.length} records and cannot be undone.`}
          confirmLabel={`Delete${confirmDel.ids.length > 1 ? ` ${confirmDel.ids.length}` : ''}`}
          onConfirm={() => handleDelete(confirmDel.ids)}
          onCancel={() => setConfirmDel(null)}
        />
      )}

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
        <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                statusFilter === tab.value
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 p-4">
          <input
            type="text"
            placeholder="Search name, reference, email, activity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="flex-1 min-w-[130px] px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20" />
            <span className="text-gray-400 text-[12px]">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="flex-1 min-w-[130px] px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20" />
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
                  {/* Checkbox */}
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-navy focus:ring-navy/20 cursor-pointer"
                    />
                  </th>
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
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.has(b.id) ? 'bg-navy/5' : ''}`}
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(b.id)}
                        onChange={() => toggleRow(b.id)}
                        className="rounded border-gray-300 text-navy focus:ring-navy/20 cursor-pointer"
                      />
                    </td>
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
                            <button onClick={() => handleStatusChange(b.id, 'confirmed')}
                              className="px-2 py-1 text-[11px] font-semibold bg-teal/10 text-teal rounded hover:bg-teal/20 transition-colors whitespace-nowrap">
                              Confirm
                            </button>
                            <button onClick={() => handleStatusChange(b.id, 'cancelled')}
                              className="px-2 py-1 text-[11px] font-semibold bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors whitespace-nowrap">
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleStatusChange(b.id, 'completed')}
                            className="px-2 py-1 text-[11px] font-semibold bg-navy/10 text-navy rounded hover:bg-navy/20 transition-colors whitespace-nowrap">
                            Complete
                          </button>
                        )}
                        {/* Trash icon */}
                        <button
                          onClick={() => setConfirmDel({ ids: [b.id], code: b.confirmation_code })}
                          className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete booking"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk delete bar */}
      {someChecked && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl">
          <span className="text-[13px] font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => setConfirmDel({ ids: Array.from(selectedIds) })}
            className="px-4 py-1.5 text-[13px] font-semibold bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            Delete ({selectedIds.size})
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onSave={handleSave}
          onDeleteRequest={(id, code) => setConfirmDel({ ids: [id], code })}
        />
      )}
    </div>
  )
}
