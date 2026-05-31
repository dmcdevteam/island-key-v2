'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GuestAdmin } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  chania: 'Chania', rethymno: 'Rethymno',
  heraklion: 'Heraklion', lasithi: 'Lasithi',
}

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  M: { bg: 'bg-gray-100',        text: 'text-gray-600' },
  L: { bg: 'bg-teal/15',         text: 'text-teal-700' },
  P: { bg: 'bg-navy text-white', text: 'text-white' },
  V: { bg: 'bg-amber-100',       text: 'text-amber-800' },
}

const GROUP_STYLES: Record<string, string> = {
  couple:  'bg-pink-50 text-pink-700',
  family:  'bg-blue-50 text-blue-700',
  friends: 'bg-purple-50 text-purple-700',
  solo:    'bg-gray-100 text-gray-600',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(s: string | null) {
  if (!s) return null
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtTs(s: string) {
  return new Date(s).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function relTime(s: string) {
  const diff = Date.now() - new Date(s).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)    return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)     return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)    return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function nights(ci: string | null, co: string | null) {
  if (!ci || !co) return null
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}

function stayStatus(g: GuestAdmin): 'now' | 'past' | 'future' | 'none' {
  if (!g.check_in || !g.check_out) return 'none'
  const t = today()
  if (g.check_in <= t && g.check_out >= t) return 'now'
  if (g.check_out < t)  return 'past'
  return 'future'
}

interface PropertyOption { id: string; name: string }

interface BookingRow {
  id: string
  confirmation_code: string
  item_type: string
  item_title: string
  booking_date: string
  status: string
}

// ─── Expanded row ─────────────────────────────────────────────────────────────

function ExpandedRow({ guest, colSpan }: { guest: GuestAdmin; colSpan: number }) {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`/api/admin/bookings?guest_id=${guest.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBookings(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [guest.id])

  const STATUS_PILL: Record<string, string> = {
    enquiry:   'bg-amber-100 text-amber-800',
    pending:   'bg-amber-100 text-amber-800',
    confirmed: 'bg-teal-100 text-teal-800',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-navy/10 text-navy',
    refunded:  'bg-gray-100 text-gray-600',
  }

  return (
    <tr className="bg-sand/40">
      <td colSpan={colSpan} className="px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Left — guest meta */}
          <div className="space-y-2 text-[12px]">
            {guest.whatsapp_number && (
              <div className="flex gap-2">
                <span className="text-tx-light w-28 shrink-0">WhatsApp</span>
                <a href={`https://wa.me/${guest.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                  className="text-teal font-medium hover:underline">
                  +{guest.whatsapp_number}
                </a>
              </div>
            )}
            {guest.group_type === 'family' && (
              <div className="flex gap-2">
                <span className="text-tx-light w-28 shrink-0">Composition</span>
                <span className="text-navy">
                  {guest.adults ?? '?'} adults · {guest.children ?? 0} children
                </span>
              </div>
            )}
            {guest.group_size && (
              <div className="flex gap-2">
                <span className="text-tx-light w-28 shrink-0">Group size</span>
                <span className="text-navy">{guest.group_size}</span>
              </div>
            )}
            {guest.user_agent && (
              <div className="flex gap-2 items-start">
                <span className="text-tx-light w-28 shrink-0 mt-px">Device</span>
                <span className="text-tx-light text-[11px] break-all leading-snug">{guest.user_agent}</span>
              </div>
            )}
          </div>

          {/* Right — bookings */}
          <div>
            <p className="text-[10px] font-bold text-tx-light uppercase tracking-wider mb-2">Bookings</p>
            {loading && <p className="text-[12px] text-tx-light">Loading…</p>}
            {!loading && bookings.length === 0 && (
              <p className="text-[12px] text-tx-light">No bookings found.</p>
            )}
            {bookings.map(b => (
              <a key={b.id} href="/admin/bookings"
                className="flex items-center gap-2 py-1.5 border-b border-border-light last:border-0 hover:bg-white/60 rounded px-1 -mx-1 transition-colors">
                <span className="font-mono text-[11px] text-teal font-semibold w-24 shrink-0">{b.confirmation_code}</span>
                <span className="text-[11px] text-tx-mid capitalize flex-1">{b.item_type} · {b.item_title}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_PILL[b.status] ?? STATUS_PILL.pending}`}>
                  {b.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GuestsSection() {
  const [guests, setGuests]           = useState<GuestAdmin[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [properties, setProperties]   = useState<PropertyOption[]>([])
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Filters
  const [propFilter, setPropFilter]       = useState('')
  const [checkInFrom, setCheckInFrom]     = useState('')
  const [checkInTo, setCheckInTo]         = useState('')
  const [groupFilter, setGroupFilter]     = useState('')
  const [regionFilter, setRegionFilter]   = useState('')
  const [waFilter, setWaFilter]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (propFilter)   params.set('property_id', propFilter)
    if (checkInFrom)  params.set('check_in_from', checkInFrom)
    if (checkInTo)    params.set('check_in_to', checkInTo)
    if (groupFilter)  params.set('group_type', groupFilter)
    if (regionFilter) params.set('region', regionFilter)
    if (waFilter)     params.set('whatsapp_opted_in', waFilter)

    try {
      const res = await fetch(`/api/admin/guests?${params}`)
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      setGuests(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [propFilter, checkInFrom, checkInTo, groupFilter, regionFilter, waFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/admin/guests/properties')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProperties(d) })
      .catch(() => {})
  }, [])

  function clearFilters() {
    setPropFilter(''); setCheckInFrom(''); setCheckInTo('')
    setGroupFilter(''); setRegionFilter(''); setWaFilter('')
  }

  const hasFilters = !!(propFilter || checkInFrom || checkInTo || groupFilter || regionFilter || waFilter)

  // Stats
  const t = today()
  const totalGuests    = guests.length
  const stayingNow     = guests.filter(g => g.check_in && g.check_out && g.check_in <= t && g.check_out >= t).length
  const thisWeek       = guests.filter(g => {
    if (!g.check_in) return false
    const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    return g.check_in >= t && g.check_in <= weekAhead
  }).length
  const waOptedIn      = guests.filter(g => g.whatsapp_opted_in).length

  const TIER_CLS = (tier: string | null) => {
    const s = TIER_STYLES[tier ?? ''] ?? TIER_STYLES.M
    return `${s.bg} ${s.text}`
  }

  const INPUT = 'px-3 py-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white'
  const SELECT = `${INPUT} cursor-pointer`

  const CHIP = (active: boolean) =>
    `px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors cursor-pointer ${
      active ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
    }`

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-navy">Guests</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">All guests who have completed onboarding</p>
        </div>
        <button onClick={load}
          className="text-[12px] font-medium text-gray-500 hover:text-navy transition-colors px-3 py-1.5 border border-gray-200 rounded flex-shrink-0">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Guests',        value: totalGuests },
          { label: 'Staying Now',         value: stayingNow },
          { label: 'Arriving This Week',  value: thisWeek },
          { label: 'WhatsApp Opted In',   value: waOptedIn },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-[13px] text-gray-500">{s.label}</p>
            <p className="font-display text-[28px] font-bold text-navy mt-0.5 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4 p-4 space-y-3">
        {/* Row 1 */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Property dropdown */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Property</label>
            <select className={SELECT + ' w-full'} value={propFilter} onChange={e => setPropFilter(e.target.value)}>
              <option value="">All Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Check-in window */}
          <div className="flex items-end gap-2 flex-1 min-w-[220px]">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in from</label>
              <input type="date" className={INPUT + ' w-full'} value={checkInFrom} onChange={e => setCheckInFrom(e.target.value)} />
            </div>
            <span className="text-gray-400 text-[12px] pb-2">→</span>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in to</label>
              <input type="date" className={INPUT + ' w-full'} value={checkInTo} onChange={e => setCheckInTo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Group type chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Group</span>
          {['', 'couple', 'family', 'friends', 'solo'].map(v => (
            <button key={v} onClick={() => setGroupFilter(v)} className={CHIP(groupFilter === v)}>
              {v === '' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* More filters toggle */}
        <div>
          <button
            onClick={() => setShowMoreFilters(f => !f)}
            className="text-[12px] font-semibold text-teal hover:text-navy transition-colors"
          >
            {showMoreFilters ? '▲ Fewer filters' : '▼ More filters'}
          </button>
        </div>

        {showMoreFilters && (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            {/* Region chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Region</span>
              {['', 'chania', 'rethymno', 'heraklion', 'lasithi'].map(v => (
                <button key={v} onClick={() => setRegionFilter(v)} className={CHIP(regionFilter === v)}>
                  {v === '' ? 'All' : REGION_LABELS[v]}
                </button>
              ))}
            </div>

            {/* WhatsApp chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">WhatsApp</span>
              {[['', 'All'], ['true', 'Opted in'], ['false', 'Opted out']].map(([v, label]) => (
                <button key={v} onClick={() => setWaFilter(v)} className={CHIP(waFilter === v)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[13px] text-gray-500 font-medium">
            {loading ? 'Loading…' : `${guests.length} guest${guests.length !== 1 ? 's' : ''}`}
          </span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-[12px] font-semibold text-red-500 hover:text-red-700">
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-600 mb-4">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Loading…</div>
        ) : guests.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">No guests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Guest', 'Property', 'Stay', 'Group', 'WhatsApp', 'Region', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map(g => {
                  const status = stayStatus(g)
                  const n      = nights(g.check_in, g.check_out)
                  const isOpen = expandedId === g.id
                  const tierS  = TIER_STYLES[g.tier ?? ''] ?? TIER_STYLES.M

                  const stayTextCls =
                    status === 'now'    ? 'text-teal font-medium' :
                    status === 'past'   ? 'text-gray-400' :
                    status === 'future' ? 'text-navy' : 'text-gray-400'

                  const rowBorderCls = status === 'now' ? 'border-l-2 border-l-teal' : ''

                  return (
                    <>
                      <tr key={g.id}
                        className={`hover:bg-gray-50 transition-colors ${rowBorderCls} ${isOpen ? 'bg-sand/30' : ''}`}>

                        {/* Guest */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-navy">{g.first_name ?? '—'}</p>
                          {g.tier && (
                            <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${tierS.bg} ${tierS.text}`}>
                              {g.tier}
                            </span>
                          )}
                        </td>

                        {/* Property */}
                        <td className="px-4 py-3">
                          {g.property_name ? (
                            <>
                              <p className="text-navy font-medium whitespace-nowrap">{g.property_name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{g.property_slug}</p>
                            </>
                          ) : g.accommodation_name ? (
                            <>
                              <p className="text-navy font-medium whitespace-nowrap">{g.accommodation_name}</p>
                              <p className="text-[11px] text-gray-400 italic">manual entry</p>
                            </>
                          ) : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Stay */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {g.check_in ? (
                            <>
                              <p className={stayTextCls}>
                                {fmtDate(g.check_in)} → {fmtDate(g.check_out)}
                              </p>
                              {n !== null && (
                                <p className="text-[11px] text-gray-400">{n} night{n !== 1 ? 's' : ''}</p>
                              )}
                            </>
                          ) : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Group */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {g.group_type ? (
                            <>
                              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${GROUP_STYLES[g.group_type] ?? 'bg-gray-100 text-gray-600'}`}>
                                {g.group_type}
                              </span>
                              {g.group_type === 'family' && g.group_size && (
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {g.adults ?? '?'}+{g.children ?? 0}
                                </p>
                              )}
                              {g.group_type !== 'family' && g.group_size && (
                                <p className="text-[11px] text-gray-400 mt-0.5">{g.group_size} people</p>
                              )}
                            </>
                          ) : <span className="text-gray-400">—</span>}
                        </td>

                        {/* WhatsApp */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {g.whatsapp_opted_in && g.whatsapp_number ? (
                            <a href={`https://wa.me/${g.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[12px] text-teal font-medium hover:underline">
                              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                              +{g.whatsapp_number}
                            </a>
                          ) : g.whatsapp_opted_in ? (
                            <span className="text-[12px] text-gray-400">Opted in · no number</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                              Opted out
                            </span>
                          )}
                        </td>

                        {/* Region */}
                        <td className="px-4 py-3 whitespace-nowrap text-[13px] text-gray-600">
                          {REGION_LABELS[g.region ?? ''] ?? g.region ?? '—'}
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-[12px] text-gray-700">{fmtTs(g.created_at)}</p>
                          <p className="text-[11px] text-gray-400">{relTime(g.created_at)}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedId(isOpen ? null : g.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              {isOpen ? 'Close' : 'View'}
                            </button>
                            {g.whatsapp_opted_in && g.whatsapp_number && (
                              <a
                                href={`https://wa.me/${g.whatsapp_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 text-[11px] font-semibold bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                              >
                                Message
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isOpen && <ExpandedRow guest={g} colSpan={8} />}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
