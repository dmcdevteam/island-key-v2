'use client'

import { useCallback, useEffect, useState } from 'react'
import { VEHICLE_LABELS, VEHICLE_ORDER, type VehicleSlug } from '@/lib/transfers'

interface Provider {
  id: string
  name: string
  contact_name: string | null
  contact_phone: string | null
  whatsapp: string | null
  email: string | null
  base_region: string | null
  fleet: Record<string, number>
  notes: string | null
  is_active: boolean
}

const REGIONS = ['Chania', 'Rethymno', 'Heraklion', 'All Crete']

const EMPTY: Omit<Provider, 'id'> = {
  name: '', contact_name: null, contact_phone: null,
  whatsapp: null, email: null, base_region: null,
  fleet: {}, notes: null, is_active: true,
}

function fleetSummary(fleet: Record<string, number>): string {
  const parts = VEHICLE_ORDER
    .filter(s => (fleet[s] ?? 0) > 0)
    .map(s => `${fleet[s]}× ${VEHICLE_LABELS[s]}`)
  return parts.length ? parts.join(', ') : '—'
}

function ProviderModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<Provider> | null
  onSave:  (data: Omit<Provider, 'id'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Omit<Provider, 'id'>>({
    ...EMPTY,
    ...initial,
    fleet: initial?.fleet ?? {},
  })

  function set(field: keyof typeof form, val: unknown) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function setFleet(slug: VehicleSlug, qty: number) {
    setForm(prev => ({ ...prev, fleet: { ...prev.fleet, [slug]: qty } }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 my-4">
        <h3 className="font-semibold text-navy text-base">
          {initial?.id ? 'Edit provider' : 'Add provider'}
        </h3>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Provider name (internal)</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Crete VIP Transfers" className={INPUT} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contact name</label>
            <input value={form.contact_name ?? ''} onChange={e => set('contact_name', e.target.value || null)}
              className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input value={form.contact_phone ?? ''} onChange={e => set('contact_phone', e.target.value || null)}
              className={INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
            <input value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value || null)}
              className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value || null)}
              className={INPUT} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Base region</label>
          <select value={form.base_region ?? ''} onChange={e => set('base_region', e.target.value || null)}
            className={INPUT}>
            <option value="">— Select —</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-2">Fleet availability</label>
          <div className="space-y-2">
            {VEHICLE_ORDER.map(slug => (
              <div key={slug} className="flex items-center gap-3">
                <span className="text-sm text-navy w-28 flex-shrink-0">{VEHICLE_LABELS[slug]}</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.fleet[slug] ?? 0}
                  onChange={e => setFleet(slug, Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-teal"
                />
                <span className="text-xs text-gray-400">vehicles</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Internal notes</label>
          <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)}
            rows={2} className={INPUT + ' resize-none'} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => set('is_active', !form.is_active)}
            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${form.is_active ? 'bg-teal border-teal' : 'border-gray-300'}`}
          >
            {form.is_active && <span className="text-white text-[10px]">✓</span>}
          </div>
          <span className="text-sm text-navy">Active</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="flex-1 px-4 py-2 text-sm bg-navy text-white rounded-xl font-medium disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal'

export function TransferProvidersSection() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<Partial<Provider> | null | 'new'>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/transfer-providers')
    const data = res.ok ? await res.json() : []
    setProviders(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(data: Omit<Provider, 'id'>) {
    const id  = (modal as Provider)?.id
    const url = id ? `/api/admin/transfer-providers/${id}` : '/api/admin/transfer-providers'
    await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setModal(null)
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/admin/transfer-providers/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-navy">Transfer Providers</h1>
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            Phase 3
          </span>
        </div>
        <button
          onClick={() => setModal('new')}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg"
        >
          + Add provider
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Provider records are maintained here but not yet automatically assigned to bookings.
        Assignment is manual via the Transfer Bookings page (Phase 3).
      </p>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && providers.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No transfer providers added yet.
        </div>
      )}

      {!loading && providers.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fleet</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {providers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.base_region ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fleetSummary(p.fleet ?? {})}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.contact_name ?? '—'}
                    {p.contact_phone && <span className="block text-gray-400">{p.contact_phone}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(p)} className="text-xs text-teal hover:underline">Edit</button>
                      <button
                        onClick={() => { if (confirm(`Delete ${p.name}?`)) handleDelete(p.id) }}
                        disabled={deleting === p.id}
                        className="text-xs text-red-400 hover:underline"
                      >
                        {deleting === p.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ProviderModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
