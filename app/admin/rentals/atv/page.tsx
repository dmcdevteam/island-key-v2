'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminShell } from '../../_components/sidebar'
import { Toggle, Drawer, TabBar, INPUT, LABEL, SELECT, REGIONS, EnquiriesTab, slugify } from '../_components/shared'
import { PickupLocationsTab } from '../_components/pickup-locations-tab'

// ── Constants ────────────────────────────────────────────────────────────────

const ATV_CLASSES = [
  { value: 'atv',       label: 'ATV / Quad' },
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'scooter',   label: 'Scooter' },
  { value: 'buggy',     label: 'Buggy' },
]
const TRANSMISSIONS = ['manual', 'automatic']
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid']

// ── ATV Listing Form ─────────────────────────────────────────────────────────

type ATVFormData = {
  name: string; car_class: string; description: string
  price_per_day: string; price_per_week: string
  seats: string; transmission: string; fuel_type: string
  ac: boolean; zero_deposit: boolean; deposit_amount: string; insurance_included: boolean
  feat_free_driver: boolean; feat_free_cancellation: boolean
  feat_roadside_assistance: boolean; feat_no_hidden_charges: boolean; feat_unlimited_km: boolean
  image_wide: string; image_square: string
  is_active: boolean; is_featured: boolean; sort_order: string; region: string
}

const ATV_DEFAULTS: ATVFormData = {
  name: '', car_class: '', description: '',
  price_per_day: '', price_per_week: '',
  seats: '', transmission: 'manual', fuel_type: 'petrol',
  ac: false, zero_deposit: false, deposit_amount: '', insurance_included: true,
  feat_free_driver: false, feat_free_cancellation: false,
  feat_roadside_assistance: false, feat_no_hidden_charges: true, feat_unlimited_km: false,
  image_wide: '', image_square: '',
  is_active: true, is_featured: false, sort_order: '0', region: 'chania',
}

function ATVListingForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ATVFormData>(() => {
    if (!initial) return ATV_DEFAULTS
    const f = initial.features ?? {}
    return {
      name: initial.name ?? '',
      car_class: initial.car_class ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      seats: initial.seats != null ? String(initial.seats) : '',
      transmission: initial.transmission ?? 'manual',
      fuel_type: initial.fuel_type ?? 'petrol',
      ac: !!initial.ac,
      zero_deposit: !!initial.zero_deposit,
      deposit_amount: initial.deposit_amount != null ? String(initial.deposit_amount) : '',
      insurance_included: !!initial.insurance_included,
      feat_free_driver: !!f.free_driver,
      feat_free_cancellation: !!f.free_cancellation,
      feat_roadside_assistance: !!f.roadside_assistance,
      feat_no_hidden_charges: !!f.no_hidden_charges,
      feat_unlimited_km: !!f.unlimited_km,
      image_wide: initial.image_wide ?? '',
      image_square: initial.image_square ?? '',
      is_active: !!initial.is_active,
      is_featured: !!initial.is_featured,
      sort_order: String(initial.sort_order ?? 0),
      region: initial.region ?? 'chania',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const wideRef = useRef<HTMLInputElement>(null)
  const squareRef = useRef<HTMLInputElement>(null)
  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [locationInstructions, setLocationInstructions] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetches: Promise<void>[] = [
      fetch('/api/admin/rental-pickup-locations').then(r => r.json()).then(data => {
        const locs = Array.isArray(data) ? data : []
        setAvailableLocations(locs.filter((l: any) => (l.vehicle_categories ?? []).includes('atv_motorbike')))
      }),
    ]
    if (initial?.id) {
      fetches.push(
        fetch(`/api/admin/rental-pickup-locations?rental_id=${initial.id}`).then(r => r.json()).then(data => {
          if (Array.isArray(data)) {
            const map: Record<string, string> = {}
            data.forEach((row: any) => { map[row.pickup_location_id] = row.instructions ?? '' })
            setLocationInstructions(map)
          }
        })
      )
    }
    Promise.all(fetches).catch(() => {})
  }, [initial?.id])

  function set<K extends keyof ATVFormData>(k: K, v: ATVFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', `atv/${slugify(form.name || 'atv')}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    return (await res.json()).url ?? null
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, type: 'atv_motorbike', car_class: form.car_class || null,
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      seats: form.seats ? Number(form.seats) : null,
      transmission: form.transmission || null, fuel_type: form.fuel_type || null,
      ac: form.ac, zero_deposit: form.zero_deposit,
      deposit_amount: !form.zero_deposit && form.deposit_amount ? Number(form.deposit_amount) : null,
      insurance_included: form.insurance_included,
      features: {
        free_driver: form.feat_free_driver, free_cancellation: form.feat_free_cancellation,
        roadside_assistance: form.feat_roadside_assistance, no_hidden_charges: form.feat_no_hidden_charges,
        unlimited_km: form.feat_unlimited_km,
      },
      image_wide: form.image_wide || null, image_square: form.image_square || null,
      is_active: form.is_active, is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0, region: form.region,
    }
    const url = initial ? `/api/admin/car-listings/${initial.id}` : '/api/admin/car-listings'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    const saved = await res.json()
    const rentalId = initial?.id ?? saved?.id
    if (rentalId) {
      await fetch('/api/admin/rental-pickup-locations/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rental_id: rentalId, locations: Object.entries(locationInstructions).map(([id, instructions]) => ({ id, instructions })) }),
      })
    }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Vehicle' : 'Add Vehicle'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Honda CB 650" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Vehicle Class</label>
          <select className={SELECT} value={form.car_class} onChange={e => set('car_class', e.target.value)}>
            <option value="">— Select —</option>
            {ATV_CLASSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Region</label>
          <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
            {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea className={INPUT} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Price / Day (€)</label>
          <input className={INPUT} type="number" min="0" value={form.price_per_day} onChange={e => set('price_per_day', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Price / Week (€)</label>
          <input className={INPUT} type="number" min="0" value={form.price_per_week} onChange={e => set('price_per_week', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Seats / Capacity</label>
          <input className={INPUT} type="number" min="1" value={form.seats} onChange={e => set('seats', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Transmission</label>
          <select className={SELECT} value={form.transmission} onChange={e => set('transmission', e.target.value)}>
            {TRANSMISSIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={LABEL}>Fuel Type</label>
        <select className={SELECT} value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}>
          {FUEL_TYPES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Zero Deposit</span>
        <Toggle checked={form.zero_deposit} onChange={() => set('zero_deposit', !form.zero_deposit)} />
      </div>
      {!form.zero_deposit && (
        <div>
          <label className={LABEL}>Deposit Amount (€)</label>
          <input className={INPUT} type="number" min="0" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Included</span>
        <Toggle checked={form.insurance_included} onChange={() => set('insurance_included', !form.insurance_included)} />
      </div>
      <div>
        <p className={LABEL}>Features</p>
        <div className="space-y-2 mt-1">
          {([
            ['feat_free_cancellation', 'Free Cancellation'],
            ['feat_roadside_assistance', '24h Roadside Assistance'],
            ['feat_no_hidden_charges', 'No Hidden Charges'],
            ['feat_unlimited_km', 'Unlimited Kilometres'],
          ] as [keyof ATVFormData, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-tx">{label}</span>
              <Toggle checked={!!form[key]} onChange={() => set(key, !form[key] as any)} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL}>Wide Image (hero)</label>
        {form.image_wide && (
          <div className="mb-2 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_wide} alt="" className="w-full h-28 object-cover rounded-sm border border-border" />
            <button type="button" onClick={() => set('image_wide', '')} className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">×</button>
          </div>
        )}
        <input ref={wideRef} type="file" accept="image/*" className="hidden" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return
          setUploading(true); const url = await uploadImage(file); if (url) set('image_wide', url)
          setUploading(false); if (wideRef.current) wideRef.current.value = ''
        }} />
        <button type="button" onClick={() => wideRef.current?.click()} disabled={uploading}
          className="px-3 py-1.5 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
          {uploading ? 'Uploading…' : form.image_wide ? 'Replace' : '+ Upload Wide Image'}
        </button>
      </div>
      <div>
        <label className={LABEL}>Square Image (thumbnail)</label>
        {form.image_square && (
          <div className="mb-2 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_square} alt="" className="w-28 h-28 object-cover rounded-sm border border-border" />
            <button type="button" onClick={() => set('image_square', '')} className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">×</button>
          </div>
        )}
        <input ref={squareRef} type="file" accept="image/*" className="hidden" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return
          setUploading(true); const url = await uploadImage(file); if (url) set('image_square', url)
          setUploading(false); if (squareRef.current) squareRef.current.value = ''
        }} />
        <button type="button" onClick={() => squareRef.current?.click()} disabled={uploading}
          className="px-3 py-1.5 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
          {uploading ? 'Uploading…' : form.image_square ? 'Replace' : '+ Upload Square Image'}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Featured</span>
        <Toggle checked={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>
      <div>
        <label className={LABEL}>Sort Order</label>
        <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
      </div>
      {availableLocations.length > 0 && (
        <div>
          <p className={LABEL}>Pickup Locations</p>
          <div className="space-y-3">
            {availableLocations.map(loc => {
              const checked = loc.id in locationInstructions
              return (
                <div key={loc.id}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={checked} className="w-4 h-4 accent-navy"
                      onChange={() => setLocationInstructions(prev => {
                        if (checked) { const next = { ...prev }; delete next[loc.id]; return next }
                        return { ...prev, [loc.id]: '' }
                      })} />
                    <span className="text-sm text-tx font-medium">{loc.name}</span>
                  </label>
                  {checked && (
                    <input className={INPUT + ' mt-1.5 ml-6'} placeholder="Pickup instructions (optional)"
                      value={locationInstructions[loc.id] ?? ''}
                      onChange={e => setLocationInstructions(prev => ({ ...prev, [loc.id]: e.target.value }))} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Drawer>
  )
}

// ── ATV Extras Tab ────────────────────────────────────────────────────────────

function ATVExtrasTab({ extras, onSaved }: { extras: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', description: '', price: '', sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(EMPTY); setEditing('new') }
  function openEdit(e: any) {
    setForm({ name: e.name, description: e.description ?? '', price: e.price != null ? String(e.price) : '', sort_order: String(e.sort_order), is_active: e.is_active })
    setEditing(e)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, description: form.description || null, price: form.price ? Number(form.price) : null, sort_order: Number(form.sort_order) }
    if (editing === 'new') {
      await fetch('/api/admin/atv-extras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`/api/admin/atv-extras/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setEditing(null); onSaved()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this ATV extra?')) return
    await fetch(`/api/admin/atv-extras/${id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">ATV Extras</h2>
        <button onClick={openNew} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
      </div>
      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Name</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Price</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Sort</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {extras.map(extra => (
              <tr key={extra.id} className="hover:bg-sand/30">
                <td className="px-4 py-3 font-medium text-navy">{extra.name}</td>
                <td className="px-4 py-3 text-tx-mid">{extra.price != null ? `€${Number(extra.price).toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3 text-tx-mid">{extra.sort_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={extra.is_active} onChange={async () => {
                    await fetch(`/api/admin/atv-extras/${extra.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !extra.is_active }) })
                    onSaved()
                  }} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(extra)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(extra.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {extras.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-tx-light text-sm">No ATV extras yet</td></tr>}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <Drawer title={editing === 'new' ? 'Add ATV Extra' : 'Edit ATV Extra'} onClose={() => setEditing(null)} onSave={handleSave} saving={saving}>
          <div>
            <label className={LABEL}>Name *</label>
            <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Helmet (additional)" />
          </div>
          <div>
            <label className={LABEL}>Description</label>
            <input className={INPUT} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div>
            <label className={LABEL}>Price (€)</label>
            <input className={INPUT} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="10.00" />
          </div>
          <div>
            <label className={LABEL}>Sort Order</label>
            <input className={INPUT} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between">
            <label className={LABEL}>Active</label>
            <Toggle checked={form.is_active} onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))} />
          </div>
        </Drawer>
      )}
    </div>
  )
}

// ── ATVs Page ─────────────────────────────────────────────────────────────────

const TABS = ['Listings', 'Pickup Locations', 'ATV Extras', 'Enquiries']

export default function ATVPage() {
  const [tab, setTab] = useState(0)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [atvExtras, setAtvExtras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vehicleForm, setVehicleForm] = useState<any | null | 'new'>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cl, pl, ae] = await Promise.all([
      fetch('/api/admin/car-listings').then(r => r.json()),
      fetch('/api/admin/rental-pickup-locations').then(r => r.json()),
      fetch('/api/admin/atv-extras').then(r => r.json()),
    ])
    setVehicles(Array.isArray(cl) ? cl.filter((c: any) => c.type === 'atv_motorbike') : [])
    setLocations(Array.isArray(pl) ? pl.filter((l: any) => (l.vehicle_categories ?? []).includes('atv_motorbike')) : [])
    setAtvExtras(Array.isArray(ae) ? ae : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <AdminShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-navy">ATVs &amp; Motorbikes</h1>
          <p className="text-sm text-tx-mid mt-1">Manage ATV, motorbike, scooter, and buggy listings</p>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {loading && <p className="text-tx-mid text-sm">Loading…</p>}

        {/* Listings */}
        {!loading && tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-navy">Vehicles</h2>
              <button onClick={() => setVehicleForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Vehicle</button>
            </div>
            <div className="bg-white border border-border rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Class</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price/day</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Region</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Featured</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No vehicles yet</td></tr>}
                  {vehicles.map(v => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-tx">{v.name}</td>
                      <td className="px-4 py-3 text-tx-mid capitalize">{v.car_class ?? '—'}</td>
                      <td className="px-4 py-3 text-tx-mid">{v.price_per_day != null ? `€${v.price_per_day}` : '—'}</td>
                      <td className="px-4 py-3 text-tx-mid capitalize">{v.region}</td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!v.is_featured} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !v.is_featured }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!v.is_active} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !v.is_active }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setVehicleForm(v)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this vehicle?')) return
                          await fetch(`/api/admin/car-listings/${v.id}`, { method: 'DELETE' })
                          fetchAll()
                        }} className="text-xs text-red-500 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pickup Locations */}
        {!loading && tab === 1 && (
          <PickupLocationsTab locations={locations} onSaved={fetchAll} />
        )}

        {/* ATV Extras */}
        {!loading && tab === 2 && (
          <ATVExtrasTab extras={atvExtras} onSaved={fetchAll} />
        )}

        {/* Enquiries */}
        {!loading && tab === 3 && (
          <EnquiriesTab itemType="rental" title="ATV & Motorbike Enquiries" />
        )}

        {vehicleForm !== null && (
          <ATVListingForm initial={vehicleForm === 'new' ? null : vehicleForm} onClose={() => setVehicleForm(null)} onSaved={() => { setVehicleForm(null); fetchAll() }} />
        )}
      </div>
    </AdminShell>
  )
}
