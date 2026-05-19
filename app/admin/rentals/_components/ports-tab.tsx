'use client'

import { useState } from 'react'
import { Toggle, Drawer, INPUT, LABEL } from './shared'

export function PortsTab({ ports, onSaved }: { ports: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', area: 'Chania', address: '', lat: '', lng: '', sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(EMPTY); setEditing('new') }
  function openEdit(port: any) {
    setForm({
      name: port.name, area: port.area ?? 'Chania', address: port.address ?? '',
      lat: port.lat != null ? String(port.lat) : '',
      lng: port.lng != null ? String(port.lng) : '',
      sort_order: String(port.sort_order), is_active: port.is_active,
    })
    setEditing(port)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      sort_order: Number(form.sort_order),
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
    }
    if (editing === 'new') {
      await fetch('/api/admin/rental-ports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`/api/admin/rental-ports/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setEditing(null); onSaved()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this port?')) return
    await fetch(`/api/admin/rental-ports/${id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">Boat Ports</h2>
        <button onClick={openNew} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Port</button>
      </div>
      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Name</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Area</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Address</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Coords</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Order</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ports.map(port => (
              <tr key={port.id} className="hover:bg-sand/30">
                <td className="px-4 py-3 font-medium text-navy">{port.name}</td>
                <td className="px-4 py-3 text-tx-mid">{port.area ?? '—'}</td>
                <td className="px-4 py-3 text-tx-mid text-xs">{port.address ?? '—'}</td>
                <td className="px-4 py-3 text-tx-mid text-xs">
                  {port.lat != null && port.lng != null ? `${port.lat}, ${port.lng}` : '—'}
                </td>
                <td className="px-4 py-3 text-tx-mid">{port.sort_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={port.is_active} onChange={async () => {
                    await fetch(`/api/admin/rental-ports/${port.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !port.is_active }) })
                    onSaved()
                  }} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(port)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(port.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {ports.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-light text-sm">No ports yet</td></tr>}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <Drawer title={editing === 'new' ? 'Add Port' : 'Edit Port'} onClose={() => setEditing(null)} onSave={handleSave} saving={saving}>
          <div>
            <label className={LABEL}>Port Name *</label>
            <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Marathi" />
          </div>
          <div>
            <label className={LABEL}>Area</label>
            <input className={INPUT} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="Chania" />
          </div>
          <div>
            <label className={LABEL}>Address</label>
            <input className={INPUT} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Latitude</label>
              <input className={INPUT} type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="35.5138" />
            </div>
            <div>
              <label className={LABEL}>Longitude</label>
              <input className={INPUT} type="number" step="any" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="24.0180" />
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
