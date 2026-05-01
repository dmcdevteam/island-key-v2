'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  original_price: number | null
  discount_label: string | null
  vehicle_types?: { slug: string; name: string }
}

interface PriceEntry {
  price: number
  original_price: number | null
  discount_label: string | null
}

type Tab = 'preset' | 'formula' | 'return'

// ─── Return Trip Pricing Tab ──────────────────────────────────────────────────

interface ReturnPricingSettings {
  mode: 'same' | 'discount'
  discount_percent: number
  display_mode: 'total' | 'per_leg_and_total'
  discount_label: string | null
}

const RETURN_PRICING_DEFAULT: ReturnPricingSettings = {
  mode: 'same',
  discount_percent: 100,
  display_mode: 'per_leg_and_total',
  discount_label: null,
}

function ReturnPricingTab() {
  const [settings, setSettings] = useState<ReturnPricingSettings>(RETURN_PRICING_DEFAULT)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    fetch('/api/admin/transfer-settings')
      .then(r => r.json())
      .then(data => { if (data?.mode) setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/transfer-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading…</div>

  return (
    <div className="max-w-lg space-y-5">
      <p className="text-xs text-gray-500">
        Configure how return leg pricing is calculated and displayed to guests on the vehicle selection screen.
      </p>

      {/* Return leg price mode */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-navy">Return leg price</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            checked={settings.mode === 'same'}
            onChange={() => setSettings(s => ({ ...s, mode: 'same' }))}
            className="mt-0.5 accent-teal"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Same price as outbound (default)</p>
            <p className="text-xs text-gray-400">Guest pays the same price for both legs</p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            checked={settings.mode === 'discount'}
            onChange={() => setSettings(s => ({ ...s, mode: 'discount' }))}
            className="mt-0.5 accent-teal"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Apply discount to return leg</p>
            <p className="text-xs text-gray-400">Return price = outbound × percentage</p>
          </div>
        </label>
        {settings.mode === 'discount' && (
          <div className="ml-6 flex items-center gap-3">
            <span className="text-xs text-gray-500">Return price =</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={settings.discount_percent}
              onChange={e => setSettings(s => ({ ...s, discount_percent: Number(e.target.value) }))}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-navy outline-none focus:border-teal"
            />
            <span className="text-xs text-gray-500">% of outbound</span>
            <span className="text-xs text-gray-400">
              (e.g. 90 = 10% off return)
            </span>
          </div>
        )}
      </div>

      {/* Display mode */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-navy">Show to guest as</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            checked={settings.display_mode === 'per_leg_and_total'}
            onChange={() => setSettings(s => ({ ...s, display_mode: 'per_leg_and_total' }))}
            className="accent-teal"
          />
          <span className="text-sm text-gray-700">Show per-leg prices + combined total</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            checked={settings.display_mode === 'total'}
            onChange={() => setSettings(s => ({ ...s, display_mode: 'total' }))}
            className="accent-teal"
          />
          <span className="text-sm text-gray-700">Show combined total only</span>
        </label>
      </div>

      {/* Discount label */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-navy">
          Return discount label <span className="font-normal text-gray-400">(optional)</span>
        </p>
        <input
          type="text"
          value={settings.discount_label ?? ''}
          onChange={e => setSettings(s => ({ ...s, discount_label: e.target.value || null }))}
          placeholder="e.g. Return trip discount"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-teal"
        />
        <p className="text-xs text-gray-400">Shown as a small badge on the return price line.</p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-lg disabled:opacity-50"
      >
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save return pricing'}
      </button>
    </div>
  )
}

// ─── Preset Routes Tab ───────────────────────────────────────────────────────

interface PopoverState {
  routeId: string
  slug: string
  routeLabel: string
  x: number
  y: number
}

function PresetTab() {
  const [routes,  setRoutes]  = useState<PresetRoute[]>([])
  const [prices,  setPrices]  = useState<Record<string, Record<string, PriceEntry>>>({})
  const [vtypes,  setVtypes]  = useState<{ id: string; slug: string | null; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [editVal,      setEditVal]      = useState('')
  const [editOriginal, setEditOriginal] = useState('')
  const [editLabel,    setEditLabel]    = useState('')
  const [saving,  setSaving]  = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)
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

    const priceMap: Record<string, Record<string, PriceEntry>> = {}
    await Promise.all(routes.map(async r => {
      const pRes = await fetch(`/api/admin/transfers/${r.id}/prices`)
      if (!pRes.ok) return
      const rows: RoutePrice[] = await pRes.json()
      priceMap[r.id] = {}
      for (const row of rows) {
        const slug = row.vehicle_types?.slug ?? vtypes.find(v => v.id === row.vehicle_type_id)?.slug
        if (slug) priceMap[r.id][slug] = {
          price:          row.price,
          original_price: row.original_price ?? null,
          discount_label: row.discount_label ?? null,
        }
      }
    }))
    setPrices(priceMap)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return
    function onMouseDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [popover])

  function openPopover(e: React.MouseEvent, routeId: string, slug: string, routeLabel: string, current?: PriceEntry) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopover({ routeId, slug, routeLabel, x: rect.left, y: rect.bottom + 6 })
    setEditVal(String(current?.price ?? ''))
    setEditOriginal(String(current?.original_price ?? ''))
    setEditLabel(current?.discount_label ?? '')
  }

  async function savePrice(routeId: string, slug: string, entry: PriceEntry) {
    setSaving(true)
    const vtype = vtypes.find(v => v.slug === slug)
    if (!vtype) { setSaving(false); return }

    const existing = prices[routeId] ?? {}
    const updated  = { ...existing, [slug]: entry }

    const rows = vtypes
      .filter(v => updated[v.slug!] !== undefined && updated[v.slug!].price > 0)
      .map(v => ({
        vehicle_type_id: v.id,
        price:           updated[v.slug!].price,
        original_price:  updated[v.slug!].original_price ?? null,
        discount_label:  updated[v.slug!].discount_label ?? null,
      }))

    await fetch(`/api/admin/transfers/${routeId}/prices`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })

    // Remove the entry from local state if price was cleared
    const next = { ...existing }
    if (entry.price > 0) {
      next[slug] = entry
    } else {
      delete next[slug]
    }
    setPrices(prev => ({ ...prev, [routeId]: next }))
    setPopover(null)
    setSaving(false)
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading routes…</div>

  return (
    <div>
      {/* Instructions — Fix 3 */}
      <p className="text-xs text-gray-500 mb-1">
        Click any cell to set or edit a price. Hover to see edit options.
        Leave cells empty to use P2P formula pricing instead.
      </p>
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal/60 inline-block" />
          Price set
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block" />
          Uses P2P formula
        </span>
      </div>

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
              <tr key={r.id} className="hover:bg-gray-50/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{r.from_location} → {r.to_location}</p>
                  {!r.is_active && <span className="text-[10px] text-red-400 font-medium">Inactive</span>}
                </td>
                {transferSlugs.map(slug => {
                  const current = prices[r.id]?.[slug]
                  const hasPrice = !!current?.price

                  return (
                    <td key={slug} className="px-2 py-2 text-right">
                      {/* Fix 1 — clickable cell with affordance */}
                      <button
                        onClick={e => openPopover(e, r.id, slug, `${r.from_location} → ${r.to_location}`, current)}
                        className={`group w-full rounded-lg px-2 py-2 text-right transition-colors cursor-pointer ${
                          hasPrice
                            ? 'hover:bg-teal/8'
                            : 'border border-dashed border-gray-200 hover:border-teal/40 hover:bg-teal/5'
                        }`}
                      >
                        {hasPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <div className="text-right">
                              {current.original_price && (
                                <p className="text-[10px] text-gray-400 line-through">€{current.original_price}</p>
                              )}
                              <p className={`text-sm font-semibold ${current.discount_label ? 'text-red-500' : 'text-navy'}`}>
                                €{current.price}
                              </p>
                              {current.discount_label && (
                                <span className="text-[9px] bg-red-50 text-red-500 px-1 py-0.5 rounded font-medium">{current.discount_label}</span>
                              )}
                            </div>
                            {/* Pencil on hover */}
                            <svg
                              className="w-3 h-3 text-teal opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </div>
                        ) : (
                          <span className="text-[11px] text-teal/70 group-hover:text-teal font-medium">+ Add</span>
                        )}
                      </button>
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

      {/* Fix 2 — floating popover editor */}
      {popover && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: Math.min(popover.x, window.innerWidth - 296),
            top: popover.y,
            zIndex: 50,
            width: 280,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #E5E7EB',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy truncate">{popover.routeLabel}</p>
              <p className="text-[11px] text-gray-400">{VEHICLE_LABELS[popover.slug as VehicleSlug]}</p>
            </div>
            <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Fields */}
          <div className="px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16 flex-shrink-0">Price €</label>
              <input
                autoFocus
                type="number"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') savePrice(popover.routeId, popover.slug, { price: Number(editVal), original_price: editOriginal ? Number(editOriginal) : null, discount_label: editLabel || null })
                  if (e.key === 'Escape') setPopover(null)
                }}
                placeholder="0"
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-navy outline-none focus:border-teal"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16 flex-shrink-0">Was €</label>
              <input
                type="number"
                value={editOriginal}
                onChange={e => setEditOriginal(e.target.value)}
                placeholder="optional"
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-navy outline-none focus:border-teal"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16 flex-shrink-0">Label</label>
              <input
                type="text"
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                placeholder='e.g. "Early bird"'
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-navy outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <button
              onClick={() => savePrice(popover.routeId, popover.slug, { price: 0, original_price: null, discount_label: null })}
              disabled={saving}
              className="text-xs text-red-400 hover:text-red-600 flex-1 py-1.5 rounded-lg border border-gray-100 hover:border-red-200 transition-colors"
            >
              Clear price
            </button>
            <button
              onClick={() => savePrice(popover.routeId, popover.slug, { price: Number(editVal), original_price: editOriginal ? Number(editOriginal) : null, discount_label: editLabel || null })}
              disabled={saving || !editVal}
              className="text-xs text-white bg-teal hover:bg-teal/90 flex-1 py-1.5 rounded-lg font-semibold disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
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
        {([['preset', 'Preset Routes'], ['formula', 'P2P Formula'], ['return', 'Return Pricing']] as [Tab, string][]).map(([t, label]) => (
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
      {tab === 'return'  && <ReturnPricingTab />}
    </div>
  )
}
