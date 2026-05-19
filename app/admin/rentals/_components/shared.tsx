'use client'

import React from 'react'

// ── Style constants ─────────────────────────────────────────────────────────

export const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
export const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
export const SELECT = `${INPUT} cursor-pointer`

export const REGIONS = ['chania', 'rethymno', 'heraklion', 'lasithi']
export const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
export const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif',
}

export function getEffectiveMime(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Toggle ──────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Drawer ──────────────────────────────────────────────────────────────────

export function Drawer({ title, onClose, onSave, saving, children }: {
  title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">{title}</h2>
          <button onClick={onClose} className="text-tx-light hover:text-tx text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-sm text-sm font-medium text-tx hover:bg-sand">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex-1 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TabBar ──────────────────────────────────────────────────────────────────

export function TabBar({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex border-b border-border mb-6 overflow-x-auto">
      {tabs.map((t, i) => (
        <button key={t} onClick={() => onChange(i)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${active === i ? 'border-navy text-navy' : 'border-transparent text-tx-mid hover:text-tx'}`}>
          {t}
        </button>
      ))}
    </div>
  )
}

// ── EnquiriesTab ─────────────────────────────────────────────────────────────
// Generic enquiry list used by Cars, ATVs, Boats — pass item_type to filter

export function EnquiriesTab({ itemType, title = 'Enquiries' }: { itemType: string; title?: string }) {
  const [enquiries, setEnquiries] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchEnquiries = React.useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/bookings?item_type=${itemType}`)
    if (res.ok) {
      const data = await res.json()
      setEnquiries(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }, [itemType])

  React.useEffect(() => { fetchEnquiries() }, [fetchEnquiries])

  const STATUS_COLORS: Record<string, string> = {
    enquiry: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-teal/10 text-teal',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-gray-100 text-gray-600',
  }

  if (loading) return <p className="text-tx-mid text-sm">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-navy">{title}</h2>
        <button onClick={fetchEnquiries} className="px-3 py-1.5 border border-border rounded-sm text-xs text-tx-mid hover:bg-sand">Refresh</button>
      </div>
      {enquiries.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No enquiries yet</p>}
      <div className="space-y-2">
        {enquiries.map((enq: any) => {
          const notes = (() => { try { return typeof enq.guest_notes === 'string' ? JSON.parse(enq.guest_notes) : (enq.guest_notes ?? {}) } catch { return {} } })()
          const isExpanded = expanded === enq.id
          return (
            <div key={enq.id} className="bg-white border border-border rounded-sm overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : enq.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${STATUS_COLORS[enq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {enq.status}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-tx">{enq.guest_name ?? '—'}</p>
                    <p className="text-[11px] text-tx-light">{enq.item_title} · {enq.confirmation_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-tx-light">{new Date(enq.created_at).toLocaleDateString('en-GB')}</span>
                  <span className="text-tx-light text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div><span className="text-tx-light text-xs">Email</span><p className="text-tx">{enq.guest_email ?? '—'}</p></div>
                    <div><span className="text-tx-light text-xs">Reference</span><p className="text-tx font-mono font-bold">{enq.confirmation_code}</p></div>
                    {notes.pickup_location && <div><span className="text-tx-light text-xs">Pickup</span><p className="text-tx">{notes.pickup_location}</p></div>}
                    {notes.pickup_date && <div><span className="text-tx-light text-xs">Dates</span><p className="text-tx">{notes.pickup_date} → {notes.dropoff_date}</p></div>}
                    {notes.duration_days && <div><span className="text-tx-light text-xs">Duration</span><p className="text-tx">{notes.duration_days} days</p></div>}
                    {notes.start_date && <div><span className="text-tx-light text-xs">Dates</span><p className="text-tx">{notes.start_date} → {notes.end_date}</p></div>}
                    {notes.duration_days && <div><span className="text-tx-light text-xs">Duration</span><p className="text-tx">{notes.duration_days} days</p></div>}
                    {notes.driver_age && <div><span className="text-tx-light text-xs">Driver Age</span><p className="text-tx">{notes.driver_age}</p></div>}
                    {notes.driver_country && <div><span className="text-tx-light text-xs">Country</span><p className="text-tx">{notes.driver_country}</p></div>}
                    {notes.flight_number && <div><span className="text-tx-light text-xs">Flight</span><p className="text-tx">{notes.flight_number}</p></div>}
                    {notes.num_guests && <div><span className="text-tx-light text-xs">Guests</span><p className="text-tx">{notes.num_guests}</p></div>}
                    {notes.port_name && <div><span className="text-tx-light text-xs">Port</span><p className="text-tx">{notes.port_name}</p></div>}
                    {(notes.grand_total != null || enq.total_price != null) && (
                      <div><span className="text-tx-light text-xs">Total</span><p className="text-tx font-semibold">€{Number(notes.grand_total ?? enq.total_price).toFixed(2)}</p></div>
                    )}
                  </div>
                  {Array.isArray(notes.selected_extras) && notes.selected_extras.length > 0 && (
                    <div>
                      <p className="text-xs text-tx-light mb-1">Extras</p>
                      <div className="flex flex-wrap gap-1.5">
                        {notes.selected_extras.map((e: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-sand text-tx text-xs rounded">{e.name} — €{e.price}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(enq.status === 'enquiry' || enq.status === 'pending') && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={async () => {
                        await fetch(`/api/admin/bookings/${enq.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) })
                        showToast('Booking confirmed'); fetchEnquiries()
                      }} className="px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-sm hover:opacity-90">Confirm</button>
                      <button onClick={async () => {
                        if (!confirm('Cancel this enquiry?')) return
                        await fetch(`/api/admin/bookings/${enq.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
                        showToast('Booking cancelled'); fetchEnquiries()
                      }} className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-sm hover:bg-red-50">Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white text-sm font-medium px-4 py-2 rounded-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
