'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  VEHICLE_LABELS, VEHICLE_ORDER, HARDCODED_FORMULAS,
  calculateP2PPrice, parseDbFormulas, type VehicleSlug, type VehicleFormula,
} from '@/lib/transfers'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PresetRoute {
  id: string
  from_location: string
  to_location: string
  slug: string | null
  is_active: boolean
  sort_order: number
}

interface RoutePrice {
  vehicle_type_id: string
  price: number
  vehicle_types?: { slug: string; name: string }
}

type Tab = 'preset' | 'formula'

// ─── Preset Routes Tab ───────────────────────────────────────────────────────

function PresetTab() {
  const [routes,  setRoutes]  = useState<PresetRoute[]>([])
  const [prices,  setPrices]  = useState<Record<string, Record<string, number>>>({}) // routeId → slug → price
  const [vtypes,  setVtypes]  = useState<{ id: string; slug: string | null; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ routeId: string; slug: string } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving,  setSaving]  = useState(false)

  const transferSlugs: VehicleSlug[] = VEHICLE_ORDER

  const load = useCallback(async () => {
    setLoading(true)
    const [rRes, vtRes] = await Promise.all([
      fetch('/api/admin/transfers'),
      fetch('/api/admin/vehicle-types'),
    ])
    const routes: PresetRoute[] = rRes.ok ? await rRes.json() : []
    const vtypes = (vtRes.ok ? await vtRes.json() : []) as { id: string; slug: string | null; name: string }[]
    setRoutes(routes)
    setVtypes(vtypes.filter(v => v.slug && transferSlugs.includes(v.slug as VehicleSlug)))

    // Load prices for every route
    const priceMap: Record<string, Record<string, number>> = {}
    await Promise.all(routes.map(async r => {
      const pRes = await fetch(`/api/admin/transfers/${r.id}/prices`)
      if (!pRes.ok) return
      const rows: RoutePrice[] = await pRes.json()
      priceMap[r.id] = {}
      for (const row of rows) {
        const slug = row.vehicle_types?.slug ?? vtypes.find(v => v.id === row.vehicle_type_id)?.slug
        if (slug) priceMap[r.id][slug] = row.price
      }
    }))
    setPrices(priceMap)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  async function savePrice(routeId: string, slug: string, newPrice: number) {
    setSaving(true)
    const vtype = vtypes.find(v => v.slug === slug)
    if (!vtype) { setSaving(false); return }

    // Rebuild all prices for this route
    const existing = prices[routeId] ?? {}
    const updated  = { ...existing, [slug]: newPrice }

    const rows = vtypes
      .filter(v => updated[v.slug!] !== undefined && updated[v.slug!] > 0)
      .map(v => ({ vehicle_type_id: v.id, price: updated[v.slug!] }))

    await fetch(`/api/admin/transfers/${routeId}/prices`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })

    setPrices(prev => ({ ...prev, [routeId]: updated }))
    setEditing(null)
    setSaving(false)
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading routes…</div>

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Click any price cell to edit. Prices apply to known pickup/dropoff pairs.
        P2P transfers use the formula tab instead.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
              {transferSlugs.map(s => (
                <th key={s} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                  {VEHICLE_LABELS[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {routes.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{r.from_location} → {r.to_location}</p>
                  {!r.is_active && <span className="text-[10px] text-red-400 font-medium">Inactive</span>}
                </td>
                {transferSlugs.map(slug => {
                  const isEditing = editing?.routeId === r.id && editing.slug === slug
                  const current   = prices[r.id]?.[slug]

                  return (
                    <td key={slug} className="px-3 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-400">€</span>
                          <input
                            autoFocus
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') savePrice(r.id, slug, Number(editVal))
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className="w-16 border border-teal rounded px-1.5 py-1 text-sm text-right text-navy outline-none"
                          />
                          <button
                            onClick={() => savePrice(r.id, slug, Number(editVal))}
                            disabled={saving}
                            className="text-[10px] text-teal font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditing({ routeId: r.id, slug }); setEditVal(String(current ?? '')) }}
                          className={`text-sm font-medium ${current ? 'text-navy hover:text-teal' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          {current ? `€${current}` : '—'}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {routes.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">
          No routes configured.{' '}
          <a href="/admin/transfers" className="text-teal underline">Add routes in Transfers admin →</a>
        </p>
      )}
    </div>
  )
}

// ─── Formula Tab ─────────────────────────────────────────────────────────────

type Zone = { from_km: number; to_km: number | null; flat: number | null; base: number | null; per_km: number | null }

function FormulaSection({
  slug,
  formula,
  onChange,
  onSave,
  saving,
}: {
  slug:     VehicleSlug
  formula:  VehicleFormula
  onChange: (slug: VehicleSlug, f: VehicleFormula) => void
  onSave:   (slug: VehicleSlug) => void
  saving:   boolean
}) {
  const [open,      setOpen]      = useState(false)
  const [testKm,    setTestKm]    = useState('')
  const [testResult, setTestResult] = useState<Record<VehicleSlug, number> | null>(null)

  const isDerived = 'derived_from' in formula.zone_config
  const zones: Zone[] = isDerived ? [] : (formula.zone_config as any).zones ?? []

  function setZone(i: number, field: keyof Zone, val: string) {
    if (isDerived) return
    const updated = zones.map((z, idx) => idx === i ? { ...z, [field]: val === '' ? null : Number(val) } : z)
    onChange(slug, { ...formula, zone_config: { zones: updated } })
  }

  function setMultiplier(derived_from: string, multiplier: number) {
    onChange(slug, { ...formula, zone_config: { derived_from, multiplier } })
  }

  function calcPreview() {
    const km = parseFloat(testKm)
    if (!km || isNaN(km)) return
    const results: Partial<Record<VehicleSlug, number>> = {}
    for (const s of VEHICLE_ORDER) {
      results[s] = calculateP2PPrice(km, s, false)
    }
    setTestResult(results as Record<VehicleSlug, number>)
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50/50 transition-colors"
      >
        <span className="font-semibold text-navy">{VEHICLE_LABELS[slug]}</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 space-y-4 bg-white">
          {/* Multiplier / airport */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Airport multiplier</label>
              <input
                type="number"
                step="0.01"
                value={formula.airport_multiplier}
                onChange={e => onChange(slug, { ...formula, airport_multiplier: Number(e.target.value) })}
                className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-navy outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Derived formula (premium_suv) */}
          {isDerived && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500 font-medium">Derived formula</p>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Based on</label>
                  <select
                    value={(formula.zone_config as any).derived_from}
                    onChange={e => setMultiplier(e.target.value, (formula.zone_config as any).multiplier)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-navy outline-none"
                  >
                    {VEHICLE_ORDER.filter(s => s !== slug).map(s => (
                      <option key={s} value={s}>{VEHICLE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">× multiplier</label>
                  <input
                    type="number"
                    step="0.05"
                    value={(formula.zone_config as any).multiplier}
                    onChange={e => setMultiplier((formula.zone_config as any).derived_from, Number(e.target.value))}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-navy outline-none focus:border-teal"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">Result rounded to nearest €5</p>
            </div>
          )}

          {/* Zone table (non-derived) */}
          {!isDerived && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 text-left">
                    <th className="pb-2 pr-3">From km</th>
                    <th className="pb-2 pr-3">To km</th>
                    <th className="pb-2 pr-3">Flat €</th>
                    <th className="pb-2 pr-3">Base €</th>
                    <th className="pb-2">Per km €</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {zones.map((z, i) => (
                    <tr key={i}>
                      {(['from_km','to_km','flat','base','per_km'] as (keyof Zone)[]).map(field => (
                        <td key={field} className="py-1.5 pr-3">
                          <input
                            type="number"
                            value={z[field] ?? ''}
                            placeholder={field === 'to_km' && z.to_km === null ? '∞' : '—'}
                            onChange={e => setZone(i, field, e.target.value)}
                            className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs text-navy outline-none focus:border-teal"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Live preview */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500">Live preview</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={testKm}
                onChange={e => setTestKm(e.target.value)}
                placeholder="Test km"
                className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-teal"
              />
              <button
                onClick={calcPreview}
                className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg"
              >
                Calculate
              </button>
            </div>
            {testResult && (
              <div className="flex flex-wrap gap-3">
                {VEHICLE_ORDER.map(s => (
                  <div key={s} className="text-xs">
                    <span className="text-gray-400">{VEHICLE_LABELS[s]}:</span>{' '}
                    <span className="font-semibold text-navy">€{testResult[s]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onSave(slug)}
            disabled={saving}
            className="px-4 py-2 bg-teal text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save formula'}
          </button>
        </div>
      )}
    </div>
  )
}

function FormulaTab() {
  const [formulas, setFormulas] = useState<Record<VehicleSlug, VehicleFormula>>(HARDCODED_FORMULAS)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    fetch('/api/admin/transfer-pricing/formulas')
      .then(r => r.json())
      .then(rows => { setFormulas(parseDbFormulas(rows)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleChange(slug: VehicleSlug, updated: VehicleFormula) {
    setFormulas(prev => ({ ...prev, [slug]: updated }))
  }

  async function handleSave(slug: VehicleSlug) {
    setSaving(true)
    const f = formulas[slug]
    await fetch(`/api/admin/transfer-pricing/formulas/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone_config:        f.zone_config,
        airport_multiplier: f.airport_multiplier,
      }),
    })
    setSaving(false)
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading formulas…</div>

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-4">
        Formulas are used when no preset price exists for a route.
        Changes take effect immediately on the guest-facing results page.
      </p>
      {VEHICLE_ORDER.map(slug => (
        <FormulaSection
          key={slug}
          slug={slug}
          formula={formulas[slug]}
          onChange={handleChange}
          onSave={handleSave}
          saving={saving}
        />
      ))}
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function TransferPricingSection() {
  const [tab, setTab] = useState<Tab>('preset')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-navy mb-6">Transfer Pricing</h1>

      <div className="flex gap-2 mb-6">
        {([['preset', 'Preset Routes'], ['formula', 'P2P Formula']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-navy text-white' : 'border border-gray-200 text-gray-600 hover:border-navy/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'preset'  && <PresetTab />}
      {tab === 'formula' && <FormulaTab />}
    </div>
  )
}
