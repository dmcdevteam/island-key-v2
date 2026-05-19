'use client'

import { useState } from 'react'
import type { Provider } from '@/lib/types'

interface Props {
  provider: Provider | null
  onSave: (data: Partial<Provider>) => Promise<void>
  onClose: () => void
  defaultType?: string
}

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

export function ProviderForm({ provider, onSave, onClose, defaultType }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: provider?.name ?? '',
    type: provider?.type ?? defaultType ?? 'activity',
    category: provider?.category ?? '',
    region: (provider?.region ?? 'chania') as string,
    contact_name: provider?.contact_name ?? '',
    contact_phone: provider?.contact_phone ?? '',
    whatsapp: provider?.whatsapp ?? '',
    email: provider?.email ?? '',
    website: provider?.website ?? '',
    commission_rate: provider?.commission_rate?.toString() ?? '25',
    notes: provider?.notes ?? '',
    is_active: provider?.is_active ?? true,
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
        name: form.name,
        type: form.type as Provider['type'],
        category: form.category || null,
        region: form.region as Provider['region'],
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        website: form.website || null,
        commission_rate: parseFloat(form.commission_rate) || 25,
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
            {provider ? 'Edit Provider' : 'New Provider'}
          </h2>
          <button type="button" onClick={onClose} className="text-tx-light hover:text-tx text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL}>Name *</label>
              <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={LABEL}>Type *</label>
              <select className={SELECT} value={form.type} onChange={e => set('type', e.target.value)}>
                {['activity', 'service', 'transfer', 'rental', 'multi'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <input className={INPUT} placeholder="e.g. sea, table, adventure" value={form.category} onChange={e => set('category', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Region *</label>
              <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
                {['chania', 'rethymno', 'heraklion', 'lasithi', 'island-wide'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Commission Rate (%)</label>
              <input type="number" step="0.1" className={INPUT} value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Contact Name</label>
              <input className={INPUT} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Contact Phone</label>
              <input type="tel" className={INPUT} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>WhatsApp</label>
              <input type="tel" className={INPUT} placeholder="306900000000" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input type="email" className={INPUT} value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Website</label>
              <input type="url" className={INPUT} placeholder="https://" value={form.website} onChange={e => set('website', e.target.value)} />
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

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : provider ? 'Save Changes' : 'Create Provider'}
          </button>
        </div>
      </div>
    </div>
  )
}
