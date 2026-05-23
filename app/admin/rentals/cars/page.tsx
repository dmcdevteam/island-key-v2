'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminShell } from '../../_components/sidebar'
import { Toggle, Drawer, TabBar, INPUT, LABEL, SELECT, REGIONS, EnquiriesTab, slugify } from '../_components/shared'
import { PickupLocationsTab } from '../_components/pickup-locations-tab'

// ── Constants ────────────────────────────────────────────────────────────────

const CAR_CLASSES = [
  { value: 'small',       label: 'Small Car' },
  { value: 'medium',      label: 'Medium Car' },
  { value: 'compact',     label: 'Compact Car' },
  { value: 'suv',         label: 'SUV' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'van',         label: 'Van' },
  { value: 'luxury',      label: 'Luxury' },
  { value: 'offroad',     label: '4×4 Off-Road' },
]
const TRANSMISSIONS = ['manual', 'automatic']
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid']

// ── Car Listing Form ─────────────────────────────────────────────────────────

type CarFormData = {
  name: string; car_class: string; description: string
  price_per_day: string; price_per_week: string
  seats: string; doors: string; transmission: string; fuel_type: string
  ac: boolean; zero_deposit: boolean; deposit_amount: string; insurance_included: boolean
  feat_free_driver: boolean; feat_free_cancellation: boolean
  feat_roadside_assistance: boolean; feat_no_hidden_charges: boolean; feat_unlimited_km: boolean
  image_wide: string; image_square: string
  is_active: boolean; is_featured: boolean; sort_order: string; region: string
}

const CAR_DEFAULTS: CarFormData = {
  name: '', car_class: '', description: '',
  price_per_day: '', price_per_week: '',
  seats: '', doors: '', transmission: 'manual', fuel_type: 'petrol',
  ac: true, zero_deposit: false, deposit_amount: '', insurance_included: true,
  feat_free_driver: false, feat_free_cancellation: false,
  feat_roadside_assistance: false, feat_no_hidden_charges: true, feat_unlimited_km: false,
  image_wide: '', image_square: '',
  is_active: true, is_featured: false, sort_order: '0', region: 'chania',
}

function CarListingForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CarFormData>(() => {
    if (!initial) return CAR_DEFAULTS
    const f = initial.features ?? {}
    return {
      name: initial.name ?? '',
      car_class: initial.car_class ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      seats: initial.seats != null ? String(initial.seats) : '',
      doors: initial.doors != null ? String(initial.doors) : '',
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
  const [notifyGuests, setNotifyGuests] = useState(false)
  const wideRef = useRef<HTMLInputElement>(null)
  const squareRef = useRef<HTMLInputElement>(null)
  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [locationInstructions, setLocationInstructions] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetches: Promise<void>[] = [
      fetch('/api/admin/rental-pickup-locations').then(r => r.json()).then(data => {
        setAvailableLocations(Array.isArray(data) ? data : [])
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

  function set<K extends keyof CarFormData>(k: K, v: CarFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', `cars/${folder}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    return (await res.json()).url ?? null
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, type: 'car', car_class: form.car_class || null,
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      seats: form.seats ? Number(form.seats) : null,
      doors: form.doors ? Number(form.doors) : null,
      transmission: form.transmission || null,
      fuel_type: form.fuel_type || null,
      ac: form.ac, zero_deposit: form.zero_deposit,
      deposit_amount: !form.zero_deposit && form.deposit_amount ? Number(form.deposit_amount) : null,
      insurance_included: form.insurance_included,
      features: {
        free_driver: form.feat_free_driver,
        free_cancellation: form.feat_free_cancellation,
        roadside_assistance: form.feat_roadside_assistance,
        no_hidden_charges: form.feat_no_hidden_charges,
        unlimited_km: form.feat_unlimited_km,
      },
      image_wide: form.image_wide || null, image_square: form.image_square || null,
      is_active: form.is_active, is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0, region: form.region,
      notify_guests: !initial && notifyGuests,
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
    <Drawer title={initial ? 'Edit Car' : 'Add Car'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Toyota Yaris" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Vehicle Class</label>
          <select className={SELECT} value={form.car_class} onChange={e => set('car_class', e.target.value)}>
            <option value="">— Select —</option>
            {CAR_CLASSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <label className={LABEL}>Seats</label>
          <input className={INPUT} type="number" min="1" value={form.seats} onChange={e => set('seats', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Doors</label>
          <input className={INPUT} type="number" min="2" value={form.doors} onChange={e => set('doors', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Transmission</label>
          <select className={SELECT} value={form.transmission} onChange={e => set('transmission', e.target.value)}>
            {TRANSMISSIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Fuel Type</label>
          <select className={SELECT} value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}>
            {FUEL_TYPES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Air Conditioning</span>
        <Toggle checked={form.ac} onChange={() => set('ac', !form.ac)} />
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
            ['feat_free_driver', 'Free Extra Driver'],
            ['feat_free_cancellation', 'Free Cancellation'],
            ['feat_roadside_assistance', '24h Roadside Assistance'],
            ['feat_no_hidden_charges', 'No Hidden Charges'],
            ['feat_unlimited_km', 'Unlimited Kilometres'],
          ] as [keyof CarFormData, string][]).map(([key, label]) => (
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
          setUploading(true)
          const url = await uploadImage(file, slugify(form.name || 'car'))
          if (url) set('image_wide', url)
          setUploading(false)
          if (wideRef.current) wideRef.current.value = ''
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
          setUploading(true)
          const url = await uploadImage(file, slugify(form.name || 'car'))
          if (url) set('image_square', url)
          setUploading(false)
          if (squareRef.current) squareRef.current.value = ''
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
      {!initial && (
        <div className="flex items-center justify-between">
          <span className={LABEL}>Notify guests</span>
          <Toggle checked={notifyGuests} onChange={() => setNotifyGuests(v => !v)} />
        </div>
      )}
      <div>
        <label className={LABEL}>Sort Order</label>
        <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
      </div>
      {availableLocations.length > 0 && (
        <div>
          <p className={LABEL}>Pickup Locations</p>
          <p className="text-[11px] text-tx-light mb-2">Select which locations this car is available from</p>
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
                    {loc.address && <span className="text-[11px] text-tx-light truncate">— {loc.address}</span>}
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

// ── Car Extra Form ────────────────────────────────────────────────────────────

type CarExtraFormData = {
  name: string; description: string; price: string
  price_type: 'per_day' | 'per_rental'; is_insurance: boolean
  insurance_description: string; is_free: boolean
  is_active: boolean; sort_order: string
}

const CAR_EXTRA_DEFAULTS: CarExtraFormData = {
  name: '', description: '', price: '', price_type: 'per_rental',
  is_insurance: false, insurance_description: '', is_free: false,
  is_active: true, sort_order: '0',
}

function CarExtraForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CarExtraFormData>(() => {
    if (!initial) return CAR_EXTRA_DEFAULTS
    return {
      name: initial.name ?? '', description: initial.description ?? '',
      price: initial.price != null ? String(initial.price) : '',
      price_type: initial.price_type ?? 'per_rental',
      is_insurance: !!initial.is_insurance,
      insurance_description: initial.insurance_description ?? '',
      is_free: !!initial.is_free, is_active: !!initial.is_active,
      sort_order: String(initial.sort_order ?? 0),
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof CarExtraFormData>(k: K, v: CarExtraFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, description: form.description || null,
      price: form.price ? Number(form.price) : 0,
      price_type: form.price_type, is_insurance: form.is_insurance,
      insurance_description: form.is_insurance ? (form.insurance_description || null) : null,
      is_free: form.is_free, is_active: form.is_active, sort_order: Number(form.sort_order) || 0,
    }
    const url = initial ? `/api/admin/car-extras/${initial.id}` : '/api/admin/car-extras'
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
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. GPS Navigator" />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea className={INPUT} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Offered Free of Charge</span>
        <Toggle checked={form.is_free} onChange={() => set('is_free', !form.is_free)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Price (€)</label>
          <input className={`${INPUT} ${form.is_free ? 'opacity-50' : ''}`} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Price Type</label>
          <select className={SELECT} value={form.price_type} onChange={e => set('price_type', e.target.value as 'per_day' | 'per_rental')}>
            <option value="per_day">Per Day</option>
            <option value="per_rental">Per Rental</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Upgrade</span>
        <Toggle checked={form.is_insurance} onChange={() => set('is_insurance', !form.is_insurance)} />
      </div>
      {form.is_insurance && (
        <div>
          <label className={LABEL}>Insurance Description</label>
          <textarea className={INPUT} rows={3} value={form.insurance_description} onChange={e => set('insurance_description', e.target.value)} placeholder="Full coverage with zero excess…" />
        </div>
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

// ── Cars Page ─────────────────────────────────────────────────────────────────

const TABS = ['Listings', 'Extras', 'Pickup Locations', 'Enquiries']

export default function CarsPage() {
  const [tab, setTab] = useState(0)
  const [cars, setCars] = useState<any[]>([])
  const [extras, setExtras] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carForm, setCarForm] = useState<any | null | 'new'>(null)
  const [extraForm, setExtraForm] = useState<any | null | 'new'>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cl, ce, pl] = await Promise.all([
      fetch('/api/admin/car-listings').then(r => r.json()),
      fetch('/api/admin/car-extras').then(r => r.json()),
      fetch('/api/admin/rental-pickup-locations').then(r => r.json()),
    ])
    setCars(Array.isArray(cl) ? cl.filter((c: any) => !c.type || c.type === 'car') : [])
    setExtras(Array.isArray(ce) ? ce : [])
    setLocations(Array.isArray(pl) ? pl : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <AdminShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-navy">Cars</h1>
          <p className="text-sm text-tx-mid mt-1">Manage car listings, extras, and pickup locations</p>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {loading && <p className="text-tx-mid text-sm">Loading…</p>}

        {/* Listings */}
        {!loading && tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-navy">Car Listings</h2>
              <button onClick={() => setCarForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Car</button>
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
                  {cars.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No car listings yet</td></tr>}
                  {cars.map(car => (
                    <tr key={car.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-tx">{car.name}</td>
                      <td className="px-4 py-3 text-tx-mid capitalize">{car.car_class ?? '—'}</td>
                      <td className="px-4 py-3 text-tx-mid">{car.price_per_day != null ? `€${car.price_per_day}` : '—'}</td>
                      <td className="px-4 py-3 text-tx-mid capitalize">{car.region}</td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!car.is_featured} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${car.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !car.is_featured }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!car.is_active} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${car.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !car.is_active }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setCarForm(car)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this car?')) return
                          await fetch(`/api/admin/car-listings/${car.id}`, { method: 'DELETE' })
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

        {/* Extras */}
        {!loading && tab === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-navy">Car Extras</h2>
              <button onClick={() => setExtraForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
            </div>
            <div className="bg-white border border-border rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Type</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Insurance</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {extras.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-tx-mid">No car extras yet</td></tr>}
                  {extras.map(ex => (
                    <tr key={ex.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-tx">{ex.name}</td>
                      <td className="px-4 py-3 text-tx-mid">
                        {ex.is_free ? <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[10px] font-bold uppercase rounded">Free</span> : `€${ex.price}`}
                      </td>
                      <td className="px-4 py-3 text-tx-mid">{ex.price_type === 'per_day' ? 'Per day' : 'Per rental'}</td>
                      <td className="px-4 py-3 text-center">
                        {ex.is_insurance ? <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[10px] font-bold uppercase rounded">Yes</span> : <span className="text-tx-light text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!ex.is_active} onChange={async () => {
                          await fetch(`/api/admin/car-extras/${ex.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !ex.is_active }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setExtraForm(ex)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this extra?')) return
                          await fetch(`/api/admin/car-extras/${ex.id}`, { method: 'DELETE' })
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
        {!loading && tab === 2 && (
          <PickupLocationsTab locations={locations} onSaved={fetchAll} />
        )}

        {/* Enquiries */}
        {!loading && tab === 3 && (
          <EnquiriesTab itemType="rental" title="Car Enquiries" />
        )}

        {carForm !== null && (
          <CarListingForm initial={carForm === 'new' ? null : carForm} onClose={() => setCarForm(null)} onSaved={() => { setCarForm(null); fetchAll() }} />
        )}
        {extraForm !== null && (
          <CarExtraForm initial={extraForm === 'new' ? null : extraForm} onClose={() => setExtraForm(null)} onSaved={() => { setExtraForm(null); fetchAll() }} />
        )}
      </div>
    </AdminShell>
  )
}
