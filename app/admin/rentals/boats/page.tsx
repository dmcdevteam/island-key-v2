'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminShell } from '../../_components/sidebar'
import { Toggle, Drawer, TabBar, INPUT, LABEL, SELECT, REGIONS, EnquiriesTab } from '../_components/shared'
import { PortsTab } from '../_components/ports-tab'

// ── Boat Listing Form ─────────────────────────────────────────────────────────

type BoatFormData = {
  name: string; description: string
  price_per_day: string; price_per_week: string
  region: string; image_wide: string; image_square: string
  is_active: boolean; is_featured: boolean; sort_order: string
  // Boat-specific
  capacity: string; length_m: string; engine_power: string; year_built: string
  port_id: string; licence_required: boolean; with_skipper: boolean
  fuel_included: boolean; min_rental_age: string
  checkin_time: string; checkout_time: string
  cancellation_policy: string
  boat_equipment: string[]
  boat_faq: { q: string; a: string }[]
}

const BOAT_DEFAULTS: BoatFormData = {
  name: '', description: '',
  price_per_day: '', price_per_week: '',
  region: 'chania', image_wide: '', image_square: '',
  is_active: true, is_featured: false, sort_order: '0',
  capacity: '', length_m: '', engine_power: '', year_built: '',
  port_id: '', licence_required: false, with_skipper: false,
  fuel_included: false, min_rental_age: '',
  checkin_time: '09:00', checkout_time: '09:00',
  cancellation_policy: '',
  boat_equipment: [],
  boat_faq: [],
}

function BoatListingForm({ initial, ports, onClose, onSaved }: {
  initial: any | null; ports: any[]; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<BoatFormData>(() => {
    if (!initial) return BOAT_DEFAULTS
    return {
      name: initial.name ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      region: initial.region ?? 'chania',
      image_wide: initial.image_wide ?? '',
      image_square: initial.image_square ?? '',
      is_active: !!initial.is_active,
      is_featured: !!initial.is_featured,
      sort_order: String(initial.sort_order ?? 0),
      capacity: initial.capacity != null ? String(initial.capacity) : '',
      length_m: initial.length_m != null ? String(initial.length_m) : '',
      engine_power: initial.engine_power != null ? String(initial.engine_power) : '',
      year_built: initial.year_built != null ? String(initial.year_built) : '',
      port_id: initial.port_id ?? '',
      licence_required: !!initial.licence_required,
      with_skipper: !!initial.with_skipper,
      fuel_included: !!initial.fuel_included,
      min_rental_age: initial.min_rental_age != null ? String(initial.min_rental_age) : '',
      checkin_time: initial.checkin_time ?? '09:00',
      checkout_time: initial.checkout_time ?? '09:00',
      cancellation_policy: initial.cancellation_policy ?? '',
      boat_equipment: initial.boat_equipment ?? [],
      boat_faq: initial.boat_faq ?? [],
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [notifyGuests, setNotifyGuests] = useState(false)
  const [equipmentInput, setEquipmentInput] = useState('')
  const [faqDraft, setFaqDraft] = useState({ q: '', a: '' })
  const wideRef = useRef<HTMLInputElement>(null)
  const squareRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof BoatFormData>(k: K, v: BoatFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  function addEquipment() {
    const e = equipmentInput.trim()
    if (e && !form.boat_equipment.includes(e)) set('boat_equipment', [...form.boat_equipment, e])
    setEquipmentInput('')
  }
  function addFaq() {
    if (faqDraft.q.trim() && faqDraft.a.trim()) {
      set('boat_faq', [...form.boat_faq, { q: faqDraft.q.trim(), a: faqDraft.a.trim() }])
      setFaqDraft({ q: '', a: '' })
    }
  }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', `boats/${folder}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    return (await res.json()).url ?? null
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, type: 'boat',
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      region: form.region,
      image_wide: form.image_wide || null, image_square: form.image_square || null,
      is_active: form.is_active, is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
      capacity: form.capacity ? Number(form.capacity) : null,
      length_m: form.length_m ? Number(form.length_m) : null,
      engine_power: form.engine_power ? Number(form.engine_power) : null,
      year_built: form.year_built ? Number(form.year_built) : null,
      port_id: form.port_id || null,
      licence_required: form.licence_required,
      with_skipper: form.with_skipper,
      fuel_included: form.fuel_included,
      min_rental_age: form.min_rental_age ? Number(form.min_rental_age) : null,
      checkin_time: form.checkin_time || null,
      checkout_time: form.checkout_time || null,
      cancellation_policy: form.cancellation_policy || null,
      boat_equipment: form.boat_equipment.length ? form.boat_equipment : null,
      boat_faq: form.boat_faq.length ? form.boat_faq : null,
      notify_guests: !initial && notifyGuests,
    }
    const url = initial ? `/api/admin/car-listings/${initial.id}` : '/api/admin/car-listings'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  const slugName = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <Drawer title={initial ? 'Edit Boat' : 'Add Boat'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sun Odyssey 440" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Region</label>
          <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
            {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Port</label>
          <select className={SELECT} value={form.port_id} onChange={e => set('port_id', e.target.value)}>
            <option value="">— Select port —</option>
            {ports.map(p => <option key={p.id} value={p.id}>{p.name} ({p.area})</option>)}
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

      {/* Boat Specifications */}
      <div className="border border-border rounded-sm p-4 space-y-3 bg-blue-50/40">
        <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">Boat Specifications</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Capacity (people)</label>
            <input className={INPUT} type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="10" />
          </div>
          <div>
            <label className={LABEL}>Length (m)</label>
            <input className={INPUT} type="number" step="0.1" value={form.length_m} onChange={e => set('length_m', e.target.value)} placeholder="8.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Engine Power (HP)</label>
            <input className={INPUT} type="number" value={form.engine_power} onChange={e => set('engine_power', e.target.value)} placeholder="150" />
          </div>
          <div>
            <label className={LABEL}>Year Built</label>
            <input className={INPUT} type="number" min="1980" max="2030" value={form.year_built} onChange={e => set('year_built', e.target.value)} placeholder="2020" />
          </div>
        </div>
      </div>

      {/* Boat Details */}
      <div className="border border-border rounded-sm p-4 space-y-3 bg-blue-50/40">
        <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">Boat Details</p>
        <div className="flex items-center justify-between">
          <span className={LABEL}>Licence Required</span>
          <Toggle checked={form.licence_required} onChange={() => set('licence_required', !form.licence_required)} />
        </div>
        <div className="flex items-center justify-between">
          <span className={LABEL}>Comes with Skipper</span>
          <Toggle checked={form.with_skipper} onChange={() => set('with_skipper', !form.with_skipper)} />
        </div>
        <div className="flex items-center justify-between">
          <span className={LABEL}>Fuel Included</span>
          <Toggle checked={form.fuel_included} onChange={() => set('fuel_included', !form.fuel_included)} />
        </div>
        <div>
          <label className={LABEL}>Minimum Rental Age</label>
          <input className={INPUT} type="number" min="18" value={form.min_rental_age} onChange={e => set('min_rental_age', e.target.value)} placeholder="18" />
        </div>
      </div>

      {/* Check-in / Check-out */}
      <div className="border border-border rounded-sm p-4 space-y-3 bg-blue-50/40">
        <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">Check-in &amp; Check-out</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Check-in Time</label>
            <input className={INPUT} type="time" value={form.checkin_time} onChange={e => set('checkin_time', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Check-out Time</label>
            <input className={INPUT} type="time" value={form.checkout_time} onChange={e => set('checkout_time', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div>
        <label className={LABEL}>Cancellation Policy</label>
        <textarea className={INPUT} rows={3} value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)} placeholder="e.g. Free cancellation up to 48h before…" />
      </div>

      {/* Equipment */}
      <div>
        <p className={LABEL}>Equipment</p>
        <div className="flex gap-2 mb-2">
          <input className={INPUT} placeholder="Add equipment item…" value={equipmentInput}
            onChange={e => setEquipmentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEquipment() } }} />
          <button type="button" onClick={addEquipment} className="px-3 py-2 bg-navy text-white text-sm rounded-sm hover:bg-navy-light flex-shrink-0">Add</button>
        </div>
        {form.boat_equipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.boat_equipment.map(eq => (
              <span key={eq} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-border text-tx text-xs rounded">
                {eq}
                <button type="button" onClick={() => set('boat_equipment', form.boat_equipment.filter(x => x !== eq))} className="text-tx-light hover:text-tx">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div>
        <p className={LABEL}>FAQ</p>
        <div className="space-y-2 mb-2">
          <input className={INPUT} placeholder="Question" value={faqDraft.q} onChange={e => setFaqDraft(d => ({ ...d, q: e.target.value }))} />
          <input className={INPUT} placeholder="Answer" value={faqDraft.a}
            onChange={e => setFaqDraft(d => ({ ...d, a: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFaq() } }} />
          <button type="button" onClick={addFaq} className="px-3 py-2 bg-navy text-white text-sm rounded-sm hover:bg-navy-light">+ Add FAQ</button>
        </div>
        {form.boat_faq.length > 0 && (
          <div className="space-y-2">
            {form.boat_faq.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2 bg-white border border-border rounded-sm p-2 text-xs">
                <div>
                  <p className="font-medium text-tx">{item.q}</p>
                  <p className="text-tx-mid mt-0.5">{item.a}</p>
                </div>
                <button type="button" onClick={() => set('boat_faq', form.boat_faq.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
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
          setUploading(true); const url = await uploadImage(file, slugName); if (url) set('image_wide', url)
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
          setUploading(true); const url = await uploadImage(file, slugName); if (url) set('image_square', url)
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
    </Drawer>
  )
}

// ── Boats Page ────────────────────────────────────────────────────────────────

const TABS = ['Listings', 'Ports', 'Enquiries']

export default function BoatsPage() {
  const [tab, setTab] = useState(0)
  const [boats, setBoats] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [boatForm, setBoatForm] = useState<any | null | 'new'>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cl, po] = await Promise.all([
      fetch('/api/admin/car-listings').then(r => r.json()),
      fetch('/api/admin/rental-ports').then(r => r.json()),
    ])
    setBoats(Array.isArray(cl) ? cl.filter((c: any) => c.type === 'boat') : [])
    setPorts(Array.isArray(po) ? po : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function portName(portId: string | null): string {
    if (!portId) return '—'
    return ports.find(p => p.id === portId)?.name ?? '—'
  }

  return (
    <AdminShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-navy">Boats</h1>
          <p className="text-sm text-tx-mid mt-1">Manage boat listings and ports</p>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {loading && <p className="text-tx-mid text-sm">Loading…</p>}

        {/* Listings */}
        {!loading && tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-navy">Boat Listings</h2>
              <button onClick={() => setBoatForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Boat</button>
            </div>
            <div className="bg-white border border-border rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Port</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Capacity</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price/day</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Skipper</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Licence</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {boats.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-tx-mid">No boat listings yet</td></tr>}
                  {boats.map(b => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-tx">{b.name}</td>
                      <td className="px-4 py-3 text-tx-mid">{portName(b.port_id)}</td>
                      <td className="px-4 py-3 text-tx-mid">{b.capacity != null ? `${b.capacity} pax` : '—'}</td>
                      <td className="px-4 py-3 text-tx-mid">{b.price_per_day != null ? `€${b.price_per_day}` : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {b.with_skipper ? <span className="text-[10px] px-1.5 py-0.5 bg-teal/10 text-teal rounded font-bold">Yes</span> : <span className="text-tx-light text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {b.licence_required ? <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-bold">Req.</span> : <span className="text-tx-light text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!b.is_active} onChange={async () => {
                          await fetch(`/api/admin/car-listings/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !b.is_active }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setBoatForm(b)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this boat?')) return
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

        {/* Ports */}
        {!loading && tab === 1 && <PortsTab ports={ports} onSaved={fetchAll} />}

        {/* Enquiries */}
        {!loading && tab === 2 && <EnquiriesTab itemType="boat_rental" title="Boat Enquiries" />}

        {boatForm !== null && (
          <BoatListingForm
            initial={boatForm === 'new' ? null : boatForm}
            ports={ports}
            onClose={() => setBoatForm(null)}
            onSaved={() => { setBoatForm(null); fetchAll() }}
          />
        )}
      </div>
    </AdminShell>
  )
}
