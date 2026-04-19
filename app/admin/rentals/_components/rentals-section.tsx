'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type VehicleType = {
  id: string; name: string; category: string; subcategory: string | null
  description: string | null; seats: number | null; icon: string | null
  is_active: boolean; sort_order: number; created_at: string
}

type Rental = {
  id: string; vehicle_type_id: string | null; name: string; slug: string | null
  description: string | null; price_per_day: number | null; price_per_week: number | null
  min_rental_days: number; deposit_required: number | null; insurance_included: boolean
  delivery_available: boolean; delivery_fee: number | null; region: string
  tier_visibility: string[]; images: string[] | null; features: string[] | null
  requirements: string | null; provider_id: string | null; is_active: boolean
  is_featured: boolean; sort_order: number; created_at: string
}

type RentalExtra = {
  id: string; name: string; description: string | null; category: string
  price_per_day: number | null; price_per_unit: number | null; unit_label: string
  image: string | null; is_active: boolean; sort_order: number; created_at: string
}

type Provider = { id: string; name: string }

// ── Constants ──────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const TABS = ['Vehicles', 'Vehicle Types', 'Extras & Essentials']

const VEHICLE_CATEGORIES = ['car', 'motorcycle', 'bike', 'buggy', 'boat', 'scooter', 'atv', 'other']
const REGIONS = ['chania', 'rethymno', 'heraklion', 'lasithi']
const EXTRA_CATEGORIES = ['beach', 'baby', 'camping', 'sport', 'comfort', 'other']

const EXTRA_BADGE_COLORS: Record<string, string> = {
  beach: 'bg-blue-100 text-blue-700',
  baby: 'bg-pink-100 text-pink-700',
  camping: 'bg-green-100 text-green-700',
  sport: 'bg-orange-100 text-orange-700',
  comfort: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

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

// ── Vehicle Form ───────────────────────────────────────────────────────────────

type RentalFormData = {
  name: string; slug: string; vehicle_type_id: string; description: string
  price_per_day: string; price_per_week: string; min_rental_days: string
  deposit_required: string; insurance_included: boolean; delivery_available: boolean
  delivery_fee: string; region: string; tier_visibility: string[]
  features: string[]; requirements: string; provider_id: string
  is_featured: boolean; is_active: boolean; sort_order: string
}

const RENTAL_DEFAULTS: RentalFormData = {
  name: '', slug: '', vehicle_type_id: '', description: '',
  price_per_day: '', price_per_week: '', min_rental_days: '1',
  deposit_required: '', insurance_included: true, delivery_available: false,
  delivery_fee: '', region: 'chania', tier_visibility: ['B', 'M', 'P'],
  features: [], requirements: '', provider_id: '',
  is_featured: false, is_active: true, sort_order: '0',
}

function VehicleForm({
  initial, vehicleTypes, providers, onClose, onSaved,
}: {
  initial: Rental | null
  vehicleTypes: VehicleType[]
  providers: Provider[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<RentalFormData>(() => {
    if (!initial) return RENTAL_DEFAULTS
    return {
      name: initial.name,
      slug: initial.slug ?? '',
      vehicle_type_id: initial.vehicle_type_id ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      min_rental_days: String(initial.min_rental_days),
      deposit_required: initial.deposit_required != null ? String(initial.deposit_required) : '',
      insurance_included: initial.insurance_included,
      delivery_available: initial.delivery_available,
      delivery_fee: initial.delivery_fee != null ? String(initial.delivery_fee) : '',
      region: initial.region,
      tier_visibility: initial.tier_visibility ?? ['B', 'M', 'P'],
      features: initial.features ?? [],
      requirements: initial.requirements ?? '',
      provider_id: initial.provider_id ?? '',
      is_featured: initial.is_featured,
      is_active: initial.is_active,
      sort_order: String(initial.sort_order),
    }
  })
  const [featureInput, setFeatureInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof RentalFormData>(k: K, v: RentalFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleNameChange(name: string) {
    set('name', name)
    if (!initial) set('slug', slugify(name))
  }

  function toggleTier(tier: string) {
    set('tier_visibility', form.tier_visibility.includes(tier)
      ? form.tier_visibility.filter(t => t !== tier)
      : [...form.tier_visibility, tier])
  }

  function addFeature() {
    const f = featureInput.trim()
    if (f && !form.features.includes(f)) {
      set('features', [...form.features, f])
    }
    setFeatureInput('')
  }

  function removeFeature(f: string) {
    set('features', form.features.filter(x => x !== f))
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      vehicle_type_id: form.vehicle_type_id || null,
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      min_rental_days: Number(form.min_rental_days) || 1,
      deposit_required: form.deposit_required ? Number(form.deposit_required) : null,
      insurance_included: form.insurance_included,
      delivery_available: form.delivery_available,
      delivery_fee: form.delivery_available && form.delivery_fee ? Number(form.delivery_fee) : null,
      region: form.region,
      tier_visibility: form.tier_visibility,
      features: form.features.length ? form.features : null,
      requirements: form.requirements || null,
      provider_id: form.provider_id || null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    }
    const url = initial ? `/api/admin/rentals/${initial.id}` : '/api/admin/rentals'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Error saving')
      setSaving(false)
      return
    }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Vehicle' : 'Add Vehicle'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => handleNameChange(e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Slug</label>
        <input className={INPUT} value={form.slug} onChange={e => set('slug', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Vehicle Type</label>
        <select className={SELECT} value={form.vehicle_type_id} onChange={e => set('vehicle_type_id', e.target.value)}>
          <option value="">— Select type —</option>
          {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
        </select>
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
          <label className={LABEL}>Min Rental Days</label>
          <input className={INPUT} type="number" min="1" value={form.min_rental_days} onChange={e => set('min_rental_days', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Deposit Required (€)</label>
          <input className={INPUT} type="number" min="0" value={form.deposit_required} onChange={e => set('deposit_required', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Included</span>
        <Toggle checked={form.insurance_included} onChange={() => set('insurance_included', !form.insurance_included)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Delivery Available</span>
        <Toggle checked={form.delivery_available} onChange={() => set('delivery_available', !form.delivery_available)} />
      </div>
      {form.delivery_available && (
        <div>
          <label className={LABEL}>Delivery Fee (€)</label>
          <input className={INPUT} type="number" min="0" value={form.delivery_fee} onChange={e => set('delivery_fee', e.target.value)} />
        </div>
      )}
      <div>
        <label className={LABEL}>Region</label>
        <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Tier Visibility</label>
        <div className="flex gap-3 mt-1">
          {['B', 'M', 'P'].map(t => (
            <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={form.tier_visibility.includes(t)} onChange={() => toggleTier(t)} />
              {t}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL}>Features</label>
        <div className="flex gap-2 mb-2">
          <input
            className={INPUT}
            placeholder="Add a feature…"
            value={featureInput}
            onChange={e => setFeatureInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
          />
          <button type="button" onClick={addFeature} className="px-3 py-2 bg-navy text-white text-sm rounded-sm hover:bg-navy-light flex-shrink-0">Add</button>
        </div>
        {form.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.features.map(f => (
              <span key={f} className="flex items-center gap-1 px-2 py-0.5 bg-sand text-tx text-xs rounded">
                {f}
                <button type="button" onClick={() => removeFeature(f)} className="text-tx-light hover:text-tx">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className={LABEL}>Requirements</label>
        <textarea className={INPUT} rows={2} value={form.requirements} onChange={e => set('requirements', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Provider</label>
        <select className={SELECT} value={form.provider_id} onChange={e => set('provider_id', e.target.value)}>
          <option value="">— Select provider —</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Featured</span>
        <Toggle checked={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>
    </Drawer>
  )
}

// ── Vehicle Type Form ──────────────────────────────────────────────────────────

type VTFormData = {
  name: string; category: string; subcategory: string; description: string
  seats: string; sort_order: string; is_active: boolean
}
const VT_DEFAULTS: VTFormData = {
  name: '', category: 'car', subcategory: '', description: '', seats: '', sort_order: '0', is_active: true,
}

function VehicleTypeForm({ initial, onClose, onSaved }: {
  initial: VehicleType | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<VTFormData>(() => {
    if (!initial) return VT_DEFAULTS
    return {
      name: initial.name, category: initial.category, subcategory: initial.subcategory ?? '',
      description: initial.description ?? '', seats: initial.seats != null ? String(initial.seats) : '',
      sort_order: String(initial.sort_order), is_active: initial.is_active,
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof VTFormData>(k: K, v: VTFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, category: form.category,
      subcategory: form.subcategory || null, description: form.description || null,
      seats: form.seats ? Number(form.seats) : null,
      sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
    }
    const url = initial ? `/api/admin/vehicle-types/${initial.id}` : '/api/admin/vehicle-types'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Vehicle Type' : 'Add Vehicle Type'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Category</label>
        <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
          {VEHICLE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Subcategory</label>
        <input className={INPUT} value={form.subcategory} onChange={e => set('subcategory', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea className={INPUT} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Seats</label>
          <input className={INPUT} type="number" min="0" value={form.seats} onChange={e => set('seats', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>
    </Drawer>
  )
}

// ── Extra Form ─────────────────────────────────────────────────────────────────

type ExtraFormData = {
  name: string; description: string; category: string
  pricingMode: 'day' | 'unit'; price_per_day: string; price_per_unit: string
  unit_label: string; is_active: boolean; sort_order: string
}
const EXTRA_DEFAULTS: ExtraFormData = {
  name: '', description: '', category: 'beach',
  pricingMode: 'day', price_per_day: '', price_per_unit: '', unit_label: 'item',
  is_active: true, sort_order: '0',
}

function ExtraForm({ initial, onClose, onSaved }: {
  initial: RentalExtra | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<ExtraFormData>(() => {
    if (!initial) return EXTRA_DEFAULTS
    return {
      name: initial.name, description: initial.description ?? '', category: initial.category,
      pricingMode: initial.price_per_unit != null ? 'unit' : 'day',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_unit: initial.price_per_unit != null ? String(initial.price_per_unit) : '',
      unit_label: initial.unit_label ?? 'item',
      is_active: initial.is_active, sort_order: String(initial.sort_order),
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof ExtraFormData>(k: K, v: ExtraFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, description: form.description || null, category: form.category,
      price_per_day: form.pricingMode === 'day' && form.price_per_day ? Number(form.price_per_day) : null,
      price_per_unit: form.pricingMode === 'unit' && form.price_per_unit ? Number(form.price_per_unit) : null,
      unit_label: form.unit_label || 'item',
      is_active: form.is_active, sort_order: Number(form.sort_order) || 0,
    }
    const url = initial ? `/api/admin/extras/${initial.id}` : '/api/admin/extras'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Extra' : 'Add Extra'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea className={INPUT} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Category</label>
        <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
          {EXTRA_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Pricing Mode</label>
        <div className="flex gap-3 mt-1">
          {(['day', 'unit'] as const).map(m => (
            <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name="pricingMode" checked={form.pricingMode === m} onChange={() => set('pricingMode', m)} />
              {m === 'day' ? 'Per Day' : 'Per Unit'}
            </label>
          ))}
        </div>
      </div>
      {form.pricingMode === 'day' ? (
        <div>
          <label className={LABEL}>Price Per Day (€)</label>
          <input className={INPUT} type="number" min="0" value={form.price_per_day} onChange={e => set('price_per_day', e.target.value)} />
        </div>
      ) : (
        <>
          <div>
            <label className={LABEL}>Price Per Unit (€)</label>
            <input className={INPUT} type="number" min="0" value={form.price_per_unit} onChange={e => set('price_per_unit', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Unit Label (e.g. &quot;tent&quot;)</label>
            <input className={INPUT} value={form.unit_label} onChange={e => set('unit_label', e.target.value)} />
          </div>
        </>
      )}
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>
      <div>
        <label className={LABEL}>Sort Order</label>
        <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
      </div>
    </Drawer>
  )
}

// ── Main Section ───────────────────────────────────────────────────────────────

export function RentalsSection() {
  const [tab, setTab] = useState(0)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [extras, setExtras] = useState<RentalExtra[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [rentalForm, setRentalForm] = useState<Rental | null | 'new'>(null)
  const [vtForm, setVtForm] = useState<VehicleType | null | 'new'>(null)
  const [extraForm, setExtraForm] = useState<RentalExtra | null | 'new'>(null)

  // Extras filter
  const [extraFilter, setExtraFilter] = useState('All')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, vt, ex, pr] = await Promise.all([
      fetch('/api/admin/rentals').then(r => r.json()),
      fetch('/api/admin/vehicle-types').then(r => r.json()),
      fetch('/api/admin/extras').then(r => r.json()),
      fetch('/api/admin/providers').then(r => r.json()),
    ])
    setRentals(Array.isArray(r) ? r : [])
    setVehicleTypes(Array.isArray(vt) ? vt : [])
    setExtras(Array.isArray(ex) ? ex : [])
    setProviders(Array.isArray(pr) ? pr : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleToggleRental(rental: Rental, field: 'is_active' | 'is_featured') {
    await fetch(`/api/admin/rentals/${rental.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !rental[field] }),
    })
    fetchAll()
  }

  async function handleDeleteRental(id: string) {
    if (!confirm('Delete this vehicle rental?')) return
    await fetch(`/api/admin/rentals/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleToggleVT(vt: VehicleType) {
    await fetch(`/api/admin/vehicle-types/${vt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !vt.is_active }),
    })
    fetchAll()
  }

  async function handleDeleteVT(id: string) {
    if (!confirm('Delete this vehicle type?')) return
    await fetch(`/api/admin/vehicle-types/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleToggleExtra(extra: RentalExtra) {
    await fetch(`/api/admin/extras/${extra.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !extra.is_active }),
    })
    fetchAll()
  }

  async function handleDeleteExtra(id: string) {
    if (!confirm('Delete this extra?')) return
    await fetch(`/api/admin/extras/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  function vtName(id: string | null) {
    if (!id) return '—'
    return vehicleTypes.find(vt => vt.id === id)?.name ?? '—'
  }

  const filteredExtras = extraFilter === 'All'
    ? extras
    : extras.filter(e => e.category === extraFilter.toLowerCase())

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

      {/* ── Tab 0: Vehicles ── */}
      {!loading && tab === 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Vehicles</h2>
            <button onClick={() => setRentalForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Vehicle</button>
          </div>
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price/day</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Region</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Featured</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rentals.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No vehicles yet</td></tr>
                )}
                {rentals.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-tx">{r.name}</td>
                    <td className="px-4 py-3 text-tx-mid">{vtName(r.vehicle_type_id)}</td>
                    <td className="px-4 py-3 text-tx-mid">{r.price_per_day != null ? `€${r.price_per_day}` : '—'}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{r.region}</td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={r.is_featured} onChange={() => handleToggleRental(r, 'is_featured')} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={r.is_active} onChange={() => handleToggleRental(r, 'is_active')} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setRentalForm(r)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                        <button onClick={() => handleDeleteRental(r.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 1: Vehicle Types ── */}
      {!loading && tab === 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Vehicle Types</h2>
            <button onClick={() => setVtForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Type</button>
          </div>
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Subcategory</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Seats</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Sort</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No vehicle types yet</td></tr>
                )}
                {vehicleTypes.map(vt => (
                  <tr key={vt.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-tx">{vt.name}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{vt.category}</td>
                    <td className="px-4 py-3 text-tx-mid">{vt.subcategory ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{vt.seats ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{vt.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={vt.is_active} onChange={() => handleToggleVT(vt)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setVtForm(vt)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                        <button onClick={() => handleDeleteVT(vt.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Extras ── */}
      {!loading && tab === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Extras &amp; Essentials</h2>
            <button onClick={() => setExtraForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
          </div>
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {['All', ...EXTRA_CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))].map(c => (
              <button key={c} onClick={() => setExtraFilter(c)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${extraFilter === c ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border hover:border-navy hover:text-navy'}`}>
                {c}
              </button>
            ))}
          </div>
          {filteredExtras.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No extras found</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtras.map(extra => (
              <div key={extra.id} className="bg-white border border-border rounded-sm p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-tx">{extra.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex-shrink-0 ${EXTRA_BADGE_COLORS[extra.category] ?? EXTRA_BADGE_COLORS.other}`}>
                    {extra.category}
                  </span>
                </div>
                <p className="text-xs text-tx-mid">
                  {extra.price_per_day != null
                    ? `€${extra.price_per_day} / day`
                    : extra.price_per_unit != null
                    ? `€${extra.price_per_unit} / ${extra.unit_label}`
                    : 'No price set'}
                </p>
                <p className={`text-xs font-medium ${extra.is_active ? 'text-teal' : 'text-gray-400'}`}>
                  {extra.is_active ? 'Active' : 'Inactive'}
                </p>
                <div className="flex gap-2 mt-auto pt-1">
                  <button onClick={() => setExtraForm(extra)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                  <button onClick={() => handleDeleteExtra(extra.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Drawers ── */}
      {rentalForm !== null && (
        <VehicleForm
          initial={rentalForm === 'new' ? null : rentalForm}
          vehicleTypes={vehicleTypes}
          providers={providers}
          onClose={() => setRentalForm(null)}
          onSaved={() => { setRentalForm(null); fetchAll() }}
        />
      )}
      {vtForm !== null && (
        <VehicleTypeForm
          initial={vtForm === 'new' ? null : vtForm}
          onClose={() => setVtForm(null)}
          onSaved={() => { setVtForm(null); fetchAll() }}
        />
      )}
      {extraForm !== null && (
        <ExtraForm
          initial={extraForm === 'new' ? null : extraForm}
          onClose={() => setExtraForm(null)}
          onSaved={() => { setExtraForm(null); fetchAll() }}
        />
      )}
    </div>
  )
}
