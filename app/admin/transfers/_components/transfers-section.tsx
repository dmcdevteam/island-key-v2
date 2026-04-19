'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type VehicleType = {
  id: string; name: string; category: string; subcategory: string | null
  description: string | null; seats: number | null; icon: string | null
  is_active: boolean; sort_order: number; created_at: string
}

type TransferRoute = {
  id: string; from_location: string; to_location: string
  from_type: string | null; to_type: string | null
  distance_km: number | null; duration_minutes: number | null
  is_active: boolean; sort_order: number; created_at: string
}

type TransferPrice = {
  id: string; route_id: string; vehicle_type_id: string | null
  price: number; max_passengers: number | null; max_luggage: number | null
  notes: string | null; is_active: boolean
}

// Price row state for the modal (keyed by vehicle_type_id)
type PriceRow = {
  vehicle_type_id: string
  price: string
  max_passengers: string
  max_luggage: string
  notes: string
  is_active: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const TABS = ['Routes', 'Preview']

const LOCATION_TYPES = ['airport', 'port', 'hotel', 'city', 'custom']

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Drawer wrapper ─────────────────────────────────────────────────────────────

function Drawer({ title, onClose, onSave, saving, children }: {
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

// ── Route Form ─────────────────────────────────────────────────────────────────

type RouteFormData = {
  from_location: string; from_type: string
  to_location: string; to_type: string
  distance_km: string; duration_minutes: string
  sort_order: string; is_active: boolean
}
const ROUTE_DEFAULTS: RouteFormData = {
  from_location: '', from_type: 'airport',
  to_location: '', to_type: 'city',
  distance_km: '', duration_minutes: '',
  sort_order: '0', is_active: true,
}

function RouteForm({ initial, onClose, onSaved }: {
  initial: TransferRoute | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<RouteFormData>(() => {
    if (!initial) return ROUTE_DEFAULTS
    return {
      from_location: initial.from_location, from_type: initial.from_type ?? 'airport',
      to_location: initial.to_location, to_type: initial.to_type ?? 'city',
      distance_km: initial.distance_km != null ? String(initial.distance_km) : '',
      duration_minutes: initial.duration_minutes != null ? String(initial.duration_minutes) : '',
      sort_order: String(initial.sort_order), is_active: initial.is_active,
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof RouteFormData>(k: K, v: RouteFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      from_location: form.from_location, from_type: form.from_type,
      to_location: form.to_location, to_type: form.to_type,
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
    }
    const url = initial ? `/api/admin/transfers/${initial.id}` : '/api/admin/transfers'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Route' : 'Add Route'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>From Location</label>
          <input className={INPUT} value={form.from_location} onChange={e => set('from_location', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>From Type</label>
          <select className={SELECT} value={form.from_type} onChange={e => set('from_type', e.target.value)}>
            {LOCATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>To Location</label>
          <input className={INPUT} value={form.to_location} onChange={e => set('to_location', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>To Type</label>
          <select className={SELECT} value={form.to_type} onChange={e => set('to_type', e.target.value)}>
            {LOCATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Distance (km)</label>
          <input className={INPUT} type="number" min="0" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Duration (min)</label>
          <input className={INPUT} type="number" min="0" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Sort Order</label>
        <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>
    </Drawer>
  )
}

// ── Prices Modal ───────────────────────────────────────────────────────────────

function PricesModal({ route, vehicleTypes, onClose }: {
  route: TransferRoute
  vehicleTypes: VehicleType[]
  onClose: () => void
}) {
  const [rows, setRows] = useState<PriceRow[]>(
    vehicleTypes.map(vt => ({ vehicle_type_id: vt.id, price: '', max_passengers: '', max_luggage: '', notes: '', is_active: true }))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/transfers/${route.id}/prices`)
      .then(r => r.json())
      .then((prices: TransferPrice[]) => {
        setRows(vehicleTypes.map(vt => {
          const existing = prices.find(p => p.vehicle_type_id === vt.id)
          if (existing) {
            return {
              vehicle_type_id: vt.id,
              price: String(existing.price),
              max_passengers: existing.max_passengers != null ? String(existing.max_passengers) : '',
              max_luggage: existing.max_luggage != null ? String(existing.max_luggage) : '',
              notes: existing.notes ?? '',
              is_active: existing.is_active,
            }
          }
          return { vehicle_type_id: vt.id, price: '', max_passengers: '', max_luggage: '', notes: '', is_active: true }
        }))
        setLoading(false)
      })
  }, [route.id, vehicleTypes])

  function updateRow(vtId: string, field: keyof PriceRow, value: string | boolean) {
    setRows(prev => prev.map(r => r.vehicle_type_id === vtId ? { ...r, [field]: value } : r))
  }

  async function handleSave() {
    setSaving(true); setError('')
    const payload = rows.map(r => ({
      vehicle_type_id: r.vehicle_type_id,
      price: r.price ? Number(r.price) : 0,
      max_passengers: r.max_passengers ? Number(r.max_passengers) : null,
      max_luggage: r.max_luggage ? Number(r.max_luggage) : null,
      notes: r.notes || null,
      is_active: r.is_active,
    }))
    const res = await fetch(`/api/admin/transfers/${route.id}/prices`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">Prices: {route.from_location} → {route.to_location}</h2>
          <button onClick={onClose} className="text-tx-light hover:text-tx text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-tx-mid text-sm">Loading prices…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Vehicle Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price (€)</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Max Pax</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Max Luggage</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Notes</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.map(vt => {
                  const row = rows.find(r => r.vehicle_type_id === vt.id)!
                  return (
                    <tr key={vt.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-medium text-tx whitespace-nowrap">{vt.name}</td>
                      <td className="px-4 py-2.5">
                        <input className={INPUT} type="number" min="0" placeholder="0" value={row.price}
                          onChange={e => updateRow(vt.id, 'price', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input className={INPUT} type="number" min="0" placeholder="—" value={row.max_passengers}
                          onChange={e => updateRow(vt.id, 'max_passengers', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input className={INPUT} type="number" min="0" placeholder="—" value={row.max_luggage}
                          onChange={e => updateRow(vt.id, 'max_luggage', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input className={INPUT} type="text" placeholder="Notes…" value={row.notes}
                          onChange={e => updateRow(vt.id, 'notes', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Toggle checked={row.is_active} onChange={() => updateRow(vt.id, 'is_active', !row.is_active)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          {error && <p className="text-red-600 text-sm flex-1">{error}</p>}
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-sm text-sm font-medium text-tx hover:bg-sand">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Prices'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Section ───────────────────────────────────────────────────────────────

export function TransfersSection() {
  const [tab, setTab] = useState(0)
  const [routes, setRoutes] = useState<TransferRoute[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [priceCounts, setPriceCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [routeForm, setRouteForm] = useState<TransferRoute | null | 'new'>(null)
  const [pricesRoute, setPricesRoute] = useState<TransferRoute | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, vt] = await Promise.all([
      fetch('/api/admin/transfers').then(r => r.json()),
      fetch('/api/admin/vehicle-types').then(r => r.json()),
    ])
    const fetchedRoutes: TransferRoute[] = Array.isArray(r) ? r : []
    setRoutes(fetchedRoutes)
    setVehicleTypes(Array.isArray(vt) ? vt : [])

    // Fetch price counts for each route
    const counts: Record<string, number> = {}
    await Promise.all(
      fetchedRoutes.map(async route => {
        const res = await fetch(`/api/admin/transfers/${route.id}/prices`)
        if (res.ok) {
          const prices: TransferPrice[] = await res.json()
          counts[route.id] = prices.filter(p => p.price > 0).length
        }
      })
    )
    setPriceCounts(counts)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleToggleRoute(route: TransferRoute) {
    await fetch(`/api/admin/transfers/${route.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !route.is_active }),
    })
    fetchAll()
  }

  async function handleDeleteRoute(id: string) {
    if (!confirm('Delete this route?')) return
    await fetch(`/api/admin/transfers/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  // Fetch route prices for preview tab
  const [previewPrices, setPreviewPrices] = useState<Record<string, TransferPrice[]>>({})
  useEffect(() => {
    if (tab !== 1 || routes.length === 0) return
    Promise.all(
      routes.filter(r => r.is_active).map(async route => {
        const res = await fetch(`/api/admin/transfers/${route.id}/prices`)
        if (res.ok) {
          const prices: TransferPrice[] = await res.json()
          return { id: route.id, prices }
        }
        return { id: route.id, prices: [] }
      })
    ).then(results => {
      const map: Record<string, TransferPrice[]> = {}
      results.forEach(({ id, prices }) => { map[id] = prices })
      setPreviewPrices(map)
    })
  }, [tab, routes])

  function vtName(id: string | null) {
    if (!id) return '—'
    return vehicleTypes.find(vt => vt.id === id)?.name ?? '—'
  }

  const activeRoutes = routes.filter(r => r.is_active)

  return (
    <div>
      <div className="flex border-b border-border mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === i ? 'border-navy text-navy' : 'border-transparent text-tx-mid hover:text-tx'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-tx-mid text-sm">Loading…</p>}

      {/* ── Tab 0: Routes ── */}
      {!loading && tab === 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Transfer Routes</h2>
            <button onClick={() => setRouteForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Route</button>
          </div>
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Route</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">From Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">To Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Distance</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Duration</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Prices</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-tx-mid">No routes yet</td></tr>
                )}
                {routes.map(route => (
                  <tr key={route.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-tx">{route.from_location} → {route.to_location}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{route.from_type ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{route.to_type ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{route.distance_km != null ? `${route.distance_km} km` : '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{route.duration_minutes != null ? `${route.duration_minutes} min` : '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">
                      {priceCounts[route.id] ? `${priceCounts[route.id]} set` : 'none'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={route.is_active} onChange={() => handleToggleRoute(route)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPricesRoute(route)} className="text-xs text-teal hover:text-teal font-medium underline whitespace-nowrap">Prices</button>
                        <button onClick={() => setRouteForm(route)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                        <button onClick={() => handleDeleteRoute(route.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 1: Preview ── */}
      {!loading && tab === 1 && (
        <div>
          <h2 className="font-display text-xl text-navy mb-4">Active Routes Preview</h2>
          {activeRoutes.length === 0 && (
            <p className="text-tx-mid text-sm py-8 text-center">No active routes</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRoutes.map(route => {
              const prices = previewPrices[route.id] ?? []
              return (
                <div key={route.id} className="bg-white border border-border rounded-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-tx">{route.from_location} → {route.to_location}</h3>
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    {route.from_type && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{route.from_type}</span>
                    )}
                    {route.to_type && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{route.to_type}</span>
                    )}
                  </div>
                  <div className="text-xs text-tx-mid mb-3 flex gap-3">
                    {route.distance_km != null && <span>{route.distance_km} km</span>}
                    {route.duration_minutes != null && <span>{route.duration_minutes} min</span>}
                  </div>
                  {prices.length > 0 ? (
                    <ul className="space-y-1">
                      {prices.filter(p => p.price > 0).map(p => (
                        <li key={p.id} className="flex justify-between text-xs">
                          <span className="text-tx-mid">{vtName(p.vehicle_type_id)}</span>
                          <span className="font-medium text-tx">€{p.price}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-tx-mid italic">No prices set</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Route Form Drawer ── */}
      {routeForm !== null && (
        <RouteForm
          initial={routeForm === 'new' ? null : routeForm}
          onClose={() => setRouteForm(null)}
          onSaved={() => { setRouteForm(null); fetchAll() }}
        />
      )}

      {/* ── Prices Modal ── */}
      {pricesRoute !== null && (
        <PricesModal
          route={pricesRoute}
          vehicleTypes={vehicleTypes}
          onClose={() => { setPricesRoute(null); fetchAll() }}
        />
      )}
    </div>
  )
}
