'use client'

import { useCallback, useEffect, useState } from 'react'

type StatusTab = 'pending' | 'approved' | 'rejected'

interface ChangeRequest {
  id: string
  status: string
  notes: string
  admin_notes: string | null
  requested_date: string | null
  requested_time: string | null
  requested_pax: number | null
  requested_vehicle_class: string | null
  created_at: string
  resolved_at: string | null
  bookings: {
    id: string
    confirmation_code: string
    item_type: string
    item_title: string
    guest_name: string | null
    guest_email: string | null
    pickup_location: string | null
    dropoff_location: string | null
  } | null
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending:  { bg: '#FFF7ED', text: '#C2410C' },
  approved: { bg: '#F0FDF4', text: '#15803D' },
  rejected: { bg: '#FEF2F2', text: '#DC2626' },
}

export function ChangeRequestsSection() {
  const [tab,      setTab]      = useState<StatusTab>('pending')
  const [items,    setItems]    = useState<ChangeRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [resolving, setResolving] = useState<string | null>(null)

  const load = useCallback(async (status: StatusTab) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/change-requests?status=${status}`)
      const data = res.ok ? await res.json() : []
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  async function resolve(id: string, action: 'approve' | 'reject') {
    setResolving(id)
    try {
      await fetch(`/api/admin/change-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_notes: adminNotes || null }),
      })
      await load(tab)
      setExpanded(null)
      setAdminNotes('')
    } catch { /* noop */ }
    setResolving(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-navy mb-6">Change Requests</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected'] as StatusTab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpanded(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-navy text-white' : 'border border-gray-200 text-gray-600 hover:border-navy/30'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No {tab} requests</div>
      ) : (
        <div className="space-y-3">
          {items.map(cr => {
            const b = cr.bookings
            const st = STATUS_STYLES[cr.status] ?? STATUS_STYLES.pending
            const isTransfer = b?.item_type === 'transfer'
            const title = isTransfer
              ? `${b?.pickup_location ?? '—'} → ${b?.dropoff_location ?? '—'}`
              : (b?.item_title ?? '—')
            const isOpen = expanded === cr.id

            return (
              <div key={cr.id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : cr.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50/50 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-navy text-sm">{b?.guest_name ?? 'Unknown'}</p>
                      <span className="text-xs font-mono text-gray-400">{b?.confirmation_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: st.bg, color: st.text }}>
                        {cr.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(cr.created_at)}</p>
                  </div>
                  <span className="text-gray-400 text-sm flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 bg-white border-t border-gray-50 space-y-4">
                    {/* Requested changes */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Requested changes</p>
                      {cr.requested_date        && <p className="text-sm text-navy"><span className="text-gray-400 w-32 inline-block">New date</span>{cr.requested_date}</p>}
                      {cr.requested_time        && <p className="text-sm text-navy"><span className="text-gray-400 w-32 inline-block">New time</span>{cr.requested_time}</p>}
                      {cr.requested_pax         && <p className="text-sm text-navy"><span className="text-gray-400 w-32 inline-block">New pax</span>{cr.requested_pax}</p>}
                      {cr.requested_vehicle_class && <p className="text-sm text-navy"><span className="text-gray-400 w-32 inline-block">New vehicle</span>{cr.requested_vehicle_class}</p>}
                      <p className="text-sm text-navy pt-1 border-t border-gray-100 mt-2">
                        <span className="text-gray-400 w-32 inline-block align-top">Notes</span>
                        <span className="flex-1">{cr.notes}</span>
                      </p>
                    </div>

                    {/* Guest info */}
                    {b?.guest_email && (
                      <p className="text-xs text-gray-500">Guest email: <a href={`mailto:${b.guest_email}`} className="text-teal underline">{b.guest_email}</a></p>
                    )}

                    {/* Admin notes + actions (pending only) */}
                    {cr.status === 'pending' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Admin notes (optional — sent to guest)</label>
                          <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Reason for approval/rejection…"
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolve(cr.id, 'approve')}
                            disabled={resolving === cr.id}
                            className="flex-1 py-2.5 rounded-lg bg-teal text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {resolving === cr.id ? '…' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => resolve(cr.id, 'reject')}
                            disabled={resolving === cr.id}
                            className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-500 text-sm font-semibold disabled:opacity-50"
                          >
                            {resolving === cr.id ? '…' : '✕ Reject'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show admin notes if resolved */}
                    {cr.status !== 'pending' && cr.admin_notes && (
                      <p className="text-xs text-gray-500">Admin notes: {cr.admin_notes}</p>
                    )}
                    {cr.resolved_at && (
                      <p className="text-xs text-gray-400">Resolved: {formatDate(cr.resolved_at)}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
