'use client'

import { useState } from 'react'
import type { Property } from '@/lib/types'

interface Props {
  property: Property | null
  onSave: (data: Partial<Property>) => Promise<void>
  onClose: () => void
}

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

export function PropertyForm({ property, onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    slug: property?.slug ?? '',
    name: property?.name ?? '',
    region: (property?.region ?? 'chania') as string,
    tier: (property?.tier ?? 'M') as string,
    host_name: property?.host_name ?? '',
    host_phone: property?.host_phone ?? '',
    host_email: property?.host_email ?? '',
    commission_rate: property?.commission_rate?.toString() ?? '20',
    address: property?.address ?? '',
    latitude: property?.latitude?.toString() ?? '',
    longitude: property?.longitude?.toString() ?? '',
    notes: property?.notes ?? '',
    is_active: property?.is_active ?? true,
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({
        slug: form.slug,
        name: form.name,
        region: form.region as Property['region'],
        tier: form.tier as Property['tier'],
        host_name: form.host_name || null,
        host_phone: form.host_phone || null,
        host_email: form.host_email || null,
        commission_rate: parseFloat(form.commission_rate) || 20,
        address: form.address || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        notes: form.notes || null,
        is_active: form.is_active,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40" onClick={onClose}>
      <div
        className="relative w-full md:max-w-xl h-full bg-white shadow-modal flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">
            {property ? 'Edit Property' : 'New Property'}
          </h2>
          <button type="button" onClick={onClose} className="text-tx-light hover:text-tx text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Name *</label>
              <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={LABEL}>Slug *</label>
              <input className={INPUT} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="dimitris-city-break" required />
            </div>
            <div>
              <label className={LABEL}>Region *</label>
              <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
                {['chania', 'rethymno', 'heraklion', 'lasithi'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Tier *</label>
              <select className={SELECT} value={form.tier} onChange={e => set('tier', e.target.value)}>
                <option value="B">Budget (B)</option>
                <option value="M">Mid (M)</option>
                <option value="P">Premium (P)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Commission Rate (%)</label>
              <input type="number" step="0.1" className={INPUT} value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} />
            </div>
            <div />
            <div>
              <label className={LABEL}>Host Name</label>
              <input className={INPUT} value={form.host_name} onChange={e => set('host_name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Host Phone</label>
              <input type="tel" className={INPUT} value={form.host_phone} onChange={e => set('host_phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Host Email</label>
              <input type="email" className={INPUT} value={form.host_email} onChange={e => set('host_email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Address</label>
              <input className={INPUT} value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Latitude</label>
              <input type="number" step="any" className={INPUT} value={form.latitude} onChange={e => set('latitude', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Longitude</label>
              <input type="number" step="any" className={INPUT} value={form.longitude} onChange={e => set('longitude', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Internal Notes</label>
              <textarea className={`${INPUT} resize-y`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
                <span className="text-sm text-tx">Active</span>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm mt-4">{error}</p>}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : property ? 'Save Changes' : 'Create Property'}
          </button>
        </div>
      </div>
    </div>
  )
}
