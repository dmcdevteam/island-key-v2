'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminShell } from '../../_components/sidebar'
import { Toggle, Drawer, TabBar, INPUT, LABEL, SELECT, REGIONS, EnquiriesTab, slugify } from '../_components/shared'

// ── Constants ────────────────────────────────────────────────────────────────

const BIKE_CLASSES = [
  { value: 'city_bike',     label: 'City Bike' },
  { value: 'ebike',         label: 'E-Bike' },
  { value: 'mountain_bike', label: 'Mountain Bike' },
]
const BIKE_INCLUDES_DEFAULT = ['Helmet', 'Pump', 'Lock', 'Bottle holder', 'Repair set']

// ── Bike Listing Form ────────────────────────────────────────────────────────

type BikeFormData = {
  name: string; car_class: string; description: string
  price_per_day: string; price_per_week: string
  image_wide: string; image_square: string
  is_active: boolean; is_featured: boolean; sort_order: string; region: string
  delivery_area: string; availability_note: string
  rider_height: string; max_speed: string; motor_power: string; autonomy: string; gears: string
  bike_includes: string[]
  day_discount_4: string; day_discount_5: string; day_discount_6: string; day_discount_7plus: string
  bike_tcs: string
}

const BIKE_DEFAULTS: BikeFormData = {
  name: '', car_class: '', description: '',
  price_per_day: '', price_per_week: '',
  image_wide: '', image_square: '',
  is_active: true, is_featured: false, sort_order: '0', region: 'chania',
  delivery_area: '', availability_note: '',
  rider_height: '', max_speed: '', motor_power: '', autonomy: '', gears: '',
  bike_includes: BIKE_INCLUDES_DEFAULT,
  day_discount_4: '', day_discount_5: '', day_discount_6: '', day_discount_7plus: '',
  bike_tcs: '',
}

function BikeIncludeInput({ onAdd }: { onAdd: (item: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-2">
      <input className={INPUT} value={value} onChange={e => setValue(e.target.value)} placeholder="Add item…"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(value.trim()); setValue('') } }} />
      <button type="button" onClick={() => { onAdd(value.trim()); setValue('') }}
        className="px-3 py-2 bg-navy text-white text-sm rounded-sm hover:bg-navy-light flex-shrink-0">Add</button>
    </div>
  )
}

function BikeListingForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<BikeFormData>(() => {
    if (!initial) return BIKE_DEFAULTS
    return {
      name: initial.name ?? '',
      car_class: initial.car_class ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      image_wide: initial.image_wide ?? '',
      image_square: initial.image_square ?? '',
      is_active: !!initial.is_active,
      is_featured: !!initial.is_featured,
      sort_order: String(initial.sort_order ?? 0),
      region: initial.region ?? 'chania',
      delivery_area: initial.delivery_area ?? '',
      availability_note: initial.availability_note ?? '',
      rider_height: initial.rider_height ?? '',
      max_speed: initial.max_speed ?? '',
      motor_power: initial.motor_power ?? '',
      autonomy: initial.autonomy ?? '',
      gears: initial.gears ?? '',
      bike_includes: initial.bike_includes ?? BIKE_INCLUDES_DEFAULT,
      day_discount_4: initial.day_discounts?.['4'] != null ? String(initial.day_discounts['4']) : '',
      day_discount_5: initial.day_discounts?.['5'] != null ? String(initial.day_discounts['5']) : '',
      day_discount_6: initial.day_discounts?.['6'] != null ? String(initial.day_discounts['6']) : '',
      day_discount_7plus: initial.day_discounts?.['7plus'] != null ? String(initial.day_discounts['7plus']) : '',
      bike_tcs: initial.bike_tcs ?? '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const wideRef = useRef<HTMLInputElement>(null)
  const squareRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof BikeFormData>(k: K, v: BikeFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', `bikes/${folder}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    return (await res.json()).url ?? null
  }

  async function handleSave() {
    setSaving(true); setError('')
    const day_discounts: Record<string, number> = {}
    if (form.day_discount_4)    day_discounts['4']     = Number(form.day_discount_4)
    if (form.day_discount_5)    day_discounts['5']     = Number(form.day_discount_5)
    if (form.day_discount_6)    day_discounts['6']     = Number(form.day_discount_6)
    if (form.day_discount_7plus) day_discounts['7plus'] = Number(form.day_discount_7plus)

    const body = {
      name: form.name, type: 'bike_ebike', car_class: form.car_class || null,
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      image_wide: form.image_wide || null, image_square: form.image_square || null,
      is_active: form.is_active, is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0, region: form.region,
      rider_height: form.rider_height || null, max_speed: form.max_speed || null,
      motor_power: form.motor_power || null, autonomy: form.autonomy || null,
      gears: form.gears || null, delivery_area: form.delivery_area || null,
      availability_note: form.availability_note || null,
      bike_includes: form.bike_includes.length ? form.bike_includes : null,
      day_discounts: Object.keys(day_discounts).length ? day_discounts : null,
      bike_tcs: form.bike_tcs || null,
    }
    const url = initial ? `/api/admin/car-listings/${initial.id}` : '/api/admin/car-listings'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Bike' : 'Add Bike'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. E-City Explorer" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Vehicle Class</label>
          <select className={SELECT} value={form.car_class} onChange={e => set('car_class', e.target.value)}>
            <option value="">— Select —</option>
            {BIKE_CLASSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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

      {/* Bike Specifications */}
      <div className="border-t border-border pt-4">
        <p className="font-semibold text-navy text-sm mb-3">Bike Specifications</p>
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Rider Height</label>
            <input className={INPUT} value={form.rider_height} onChange={e => set('rider_height', e.target.value)} placeholder="155–195 cm" />
          </div>
          <div>
            <label className={LABEL}>Max Speed</label>
            <input className={INPUT} value={form.max_speed} onChange={e => set('max_speed', e.target.value)} placeholder="25 km/h" />
          </div>
          <div>
            <label className={LABEL}>Motor Power (E-Bikes only)</label>
            <input className={INPUT} value={form.motor_power} onChange={e => set('motor_power', e.target.value)} placeholder="250W" />
          </div>
          <div>
            <label className={LABEL}>Range / Autonomy (E-Bikes only)</label>
            <input className={INPUT} value={form.autonomy} onChange={e => set('autonomy', e.target.value)} placeholder="104 km" />
          </div>
          <div>
            <label className={LABEL}>Gears</label>
            <input className={INPUT} value={form.gears} onChange={e => set('gears', e.target.value)} placeholder="7-speed Shimano" />
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="border-t border-border pt-4">
        <p className="font-semibold text-navy text-sm mb-3">Delivery</p>
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Delivery Area</label>
            <input className={INPUT} value={form.delivery_area} onChange={e => set('delivery_area', e.target.value)} placeholder="Kolymbari to Platanias" />
          </div>
          <div>
            <label className={LABEL}>Availability Note</label>
            <input className={INPUT} value={form.availability_note} onChange={e => set('availability_note', e.target.value)} placeholder="Limited Availability" />
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="border-t border-border pt-4">
        <p className="font-semibold text-navy text-sm mb-2">What&apos;s Included</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.bike_includes.map((item, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-sand px-2 py-1 rounded-full text-navy">
              {item}
              <button type="button" onClick={() => set('bike_includes', form.bike_includes.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-0.5">×</button>
            </span>
          ))}
        </div>
        <BikeIncludeInput onAdd={item => { if (item && !form.bike_includes.includes(item)) set('bike_includes', [...form.bike_includes, item]) }} />
      </div>

      {/* Day Discounts */}
      <div className="border-t border-border pt-4">
        <p className="font-semibold text-navy text-sm mb-1">Day Discounts (from Day 4)</p>
        <p className="text-[11px] text-tx-light mb-3">Set discount % for each rental day beyond 3. Leave blank for no discount.</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['day_discount_4', 'Day 4 discount'],
            ['day_discount_5', 'Day 5 discount'],
            ['day_discount_6', 'Day 6 discount'],
            ['day_discount_7plus', 'Day 7+ discount'],
          ] as [keyof BikeFormData, string][]).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL}>{label} (%)</label>
              <input className={INPUT} type="number" min="0" max="100"
                value={form[key] as string}
                onChange={e => set(key, e.target.value as any)}
                placeholder="0" />
            </div>
          ))}
        </div>
      </div>

      {/* T&Cs */}
      <div className="border-t border-border pt-4">
        <label className={LABEL}>Terms &amp; Conditions</label>
        <p className="text-[11px] text-tx-light mb-1">Leave blank to use default T&Cs</p>
        <textarea className={INPUT} rows={5} value={form.bike_tcs} onChange={e => set('bike_tcs', e.target.value)} placeholder="Leave blank to use default T&Cs" />
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
          setUploading(true); const url = await uploadImage(file, slugify(form.name || 'bike')); if (url) set('image_wide', url)
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
          setUploading(true); const url = await uploadImage(file, slugify(form.name || 'bike')); if (url) set('image_square', url)
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
    </Drawer>
  )
}

// ── Bike Extras Tab ───────────────────────────────────────────────────────────

function BikeExtrasTab({ extras, onSaved }: { extras: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', price: '', sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(EMPTY); setEditing('new') }
  function openEdit(e: any) {
    setForm({ name: e.name, price: e.price != null ? String(e.price) : '', sort_order: String(e.sort_order), is_active: e.is_active })
    setEditing(e)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, price: form.price ? Number(form.price) : null, sort_order: Number(form.sort_order) }
    if (editing === 'new') {
      await fetch('/api/admin/bike-extras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`/api/admin/bike-extras/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setEditing(null); onSaved()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bike extra?')) return
    await fetch(`/api/admin/bike-extras/${id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">Bike Extras</h2>
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
                    await fetch(`/api/admin/bike-extras/${extra.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !extra.is_active }) })
                    onSaved()
                  }} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(extra)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(extra.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {extras.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-tx-light text-sm">No bike extras yet</td></tr>}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <Drawer title={editing === 'new' ? 'Add Bike Extra' : 'Edit Bike Extra'} onClose={() => setEditing(null)} onSave={handleSave} saving={saving}>
          <div>
            <label className={LABEL}>Name *</label>
            <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Speedometer" />
          </div>
          <div>
            <label className={LABEL}>Price (€)</label>
            <input className={INPUT} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="3.00" />
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

// ── Bikes Page ────────────────────────────────────────────────────────────────

const TABS = ['Listings', 'Extras', 'Enquiries']

export default function BikesPage() {
  const [tab, setTab] = useState(0)
  const [bikes, setBikes] = useState<any[]>([])
  const [bikeExtras, setBikeExtras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bikeForm, setBikeForm] = useState<any | null | 'new'>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cl, be] = await Promise.all([
      fetch('/api/admin/car-listings').then(r => r.json()),
      fetch('/api/admin/bike-extras').then(r => r.json()),
    ])
    setBikes(Array.isArray(cl) ? cl.filter((c: any) => c.type === 'bike_ebike') : [])
    setBikeExtras(Array.isArray(be) ? be : (Array.isArray(be?.extras) ? be.extras : []))
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <AdminShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-navy">Bikes &amp; E-Bikes</h1>
          <p className="text-sm text-tx-mid mt-1">Manage bike listings and bike-specific extras</p>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {loading && <p className="text-tx-mid text-sm">Loading…</p>}

        {/* Listings */}
        {!loading && tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-navy">Bike Listings</h2>
              <button onClick={() => setBikeForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Bike</button>
            </div>
            <div className="bg-white border border-border rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Class</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price/day</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Delivery Area</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Featured</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {bikes.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No bike listings yet</td></tr>}
                  {bikes.map(b => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-tx">{b.name}</td>
                      <td className="px-4 py-3 text-tx-mid capitalize">{b.car_class ?? '—'}</td>
                      <td className="px-4 py-3 text-tx-mid">{b.price_per_day != null ? `€${b.price_per_day}` : '—'}</td>
                      <td className="px-4 py-3 text-tx-mid text-xs">{b.delivery_area ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!b.is_featured} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !b.is_featured }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!b.is_active} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !b.is_active }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setBikeForm(b)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this bike?')) return
                          await fetch(`/api/admin/car-listings/${b.id}`, { method: 'DELETE' })
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
          <BikeExtrasTab extras={bikeExtras} onSaved={fetchAll} />
        )}

        {/* Enquiries */}
        {!loading && tab === 2 && (
          <EnquiriesTab itemType="bike_rental" title="Bike Enquiries" />
        )}

        {bikeForm !== null && (
          <BikeListingForm initial={bikeForm === 'new' ? null : bikeForm} onClose={() => setBikeForm(null)} onSaved={() => { setBikeForm(null); fetchAll() }} />
        )}
      </div>
    </AdminShell>
  )
}
