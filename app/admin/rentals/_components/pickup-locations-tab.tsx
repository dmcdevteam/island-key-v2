'use client'

import { useState } from 'react'
import { Toggle, Drawer, INPUT, LABEL, SELECT } from './shared'

export function PickupLocationsTab({ locations, onSaved }: { locations: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', city: 'Chania', address: '', google_maps_url: '', vehicle_categories: ['car', 'atv_motorbike'], sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const VEHICLE_CATS = ['car', 'atv_motorbike', 'bike_ebike', 'boat']

  function openNew() { setForm(EMPTY); setEditing('new') }
  function openEdit(loc: any) {
    setForm({
      name: loc.name, city: loc.city ?? 'Chania', address: loc.address ?? '',
      google_maps_url: loc.google_maps_url ?? '',
      vehicle_categories: loc.vehicle_categories ?? ['car', 'atv_motorbike'],
      sort_order: String(loc.sort_order), is_active: loc.is_active,
    })
    setEditing(loc)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, sort_order: Number(form.sort_order), google_maps_url: form.google_maps_url || null }
    if (editing === 'new') {
      await fetch('/api/admin/rental-pickup-locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`/api/admin/rental-pickup-locations/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setEditing(null); onSaved()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pickup location?')) return
    await fetch(`/api/admin/rental-pickup-locations/${id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">Pickup Locations</h2>
        <button onClick={openNew} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Location</button>
      </div>
      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Name</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">City</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Address</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Categories</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Order</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {locations.map(loc => (
              <tr key={loc.id} className="hover:bg-sand/30">
                <td className="px-4 py-3 font-medium text-navy">{loc.name}</td>
                <td className="px-4 py-3 text-tx-mid text-xs">{loc.city ?? '—'}</td>
                <td className="px-4 py-3 text-tx-mid text-xs">{loc.address ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(loc.vehicle_categories ?? []).map((c: string) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 bg-navy/10 text-navy rounded-sm">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-tx-mid">{loc.sort_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={loc.is_active} onChange={async () => {
                    await fetch(`/api/admin/rental-pickup-locations/${loc.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !loc.is_active }) })
                    onSaved()
                  }} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(loc)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(loc.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-light text-sm">No pickup locations yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <Drawer title={editing === 'new' ? 'Add Pickup Location' : 'Edit Pickup Location'} onClose={() => setEditing(null)} onSave={handleSave} saving={saving}>
          <div>
            <label className={LABEL}>Name *</label>
            <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Chania Airport" />
          </div>
          <div>
            <label className={LABEL}>City *</label>
            <select className={SELECT} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
              <option value="Chania">Chania</option>
              <option value="Rethymnon">Rethymnon</option>
              <option value="Heraklion">Heraklion</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Address</label>
            <input className={INPUT} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Chania International Airport, Souda 73200" />
          </div>
          {form.address && MAPS_KEY && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(form.address)}&zoom=14&size=600x200&markers=${encodeURIComponent(form.address)}&key=${MAPS_KEY}`} alt="Map preview" className="w-full rounded-sm border border-border" />
          )}
          <div>
            <label className={LABEL}>Google Maps Link (optional)</label>
            <input className={INPUT} value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} placeholder="Paste a Google Maps share link" />
            <p className="text-[11px] text-tx-light mt-1">Open Google Maps → share → copy link</p>
          </div>
          <div>
            <label className={LABEL}>Vehicle Categories</label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CATS.map(cat => (
                <button key={cat} type="button"
                  onClick={() => {
                    const cats = form.vehicle_categories.includes(cat)
                      ? form.vehicle_categories.filter(c => c !== cat)
                      : [...form.vehicle_categories, cat]
                    setForm(f => ({ ...f, vehicle_categories: cats }))
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${form.vehicle_categories.includes(cat) ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border hover:border-navy'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Sort Order</label>
            <input type="number" className={INPUT} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
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
