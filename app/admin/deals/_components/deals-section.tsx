'use client'

import { useState, useEffect, useRef } from 'react'
import { slugify } from '@/lib/slugify'
import type { DealFull, Provider, Property } from '@/lib/types'

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`
const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' }

function getEffectiveMime(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function validUntilBadge(valid_until: string | null) {
  if (!valid_until) return null
  const diff = new Date(valid_until).getTime() - Date.now()
  if (diff < 0) return <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Expired</span>
  if (diff < 7 * 24 * 3600 * 1000) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">&lt;7 days</span>
  return <span className="text-[10px] text-tx-light">{new Date(valid_until).toLocaleDateString('en-GB')}</span>
}

type FormState = Omit<DealFull, 'id' | 'created_at' | 'total_redemptions'>

function emptyForm(): FormState {
  return {
    title: '', slug: '', description: null, short_description: null,
    provider_id: null, property_id: null, category: null,
    discount_type: null, discount_value: null, discount_label: null,
    original_price: null, deal_price: null, currency: 'EUR',
    code: null, terms: null,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: null, max_redemptions: null,
    region: 'chania', tier_visibility: ['B', 'M', 'P'],
    images: null, is_featured: false, is_active: true, sort_order: 0,
  }
}

interface DealFormProps {
  deal: DealFull | null
  providers: Provider[]
  properties: Property[]
  onSave: (data: Partial<FormState>) => Promise<void>
  onClose: () => void
}

function DealForm({ deal, providers, properties, onSave, onClose }: DealFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [images, setImages] = useState<string[]>(deal?.images ?? [])

  const [form, setForm] = useState<FormState>(() => deal ? {
    title: deal.title, slug: deal.slug, description: deal.description,
    short_description: deal.short_description, provider_id: deal.provider_id,
    property_id: deal.property_id, category: deal.category,
    discount_type: deal.discount_type, discount_value: deal.discount_value,
    discount_label: deal.discount_label, original_price: deal.original_price,
    deal_price: deal.deal_price, currency: deal.currency, code: deal.code,
    terms: deal.terms, valid_from: deal.valid_from, valid_until: deal.valid_until,
    max_redemptions: deal.max_redemptions, region: deal.region,
    tier_visibility: deal.tier_visibility, images: deal.images,
    is_featured: deal.is_featured, is_active: deal.is_active, sort_order: deal.sort_order,
  } : emptyForm())

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    set('title', title)
    if (!deal) set('slug', slugify(title))
  }

  function toggleTier(tier: string) {
    const next = form.tier_visibility.includes(tier)
      ? form.tier_visibility.filter(t => t !== tier)
      : [...form.tier_visibility, tier]
    set('tier_visibility', next)
  }

  async function handleFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadError('')
    const valid = files.filter(f => SUPPORTED_MIME.has(getEffectiveMime(f)))
    const rejected = files.length - valid.length
    if (rejected > 0) setUploadError(`${rejected} file(s) skipped — use JPG, WebP or AVIF`)
    if (!valid.length) return

    setUploadingCount(valid.length)
    const slug = form.slug || slugify(form.title) || undefined
    const results = await Promise.allSettled(valid.map(async file => {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      if (slug) fd.append('slug', slug)
      fd.append('bucket', 'deal-images')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.url) throw new Error(json.error ?? 'Upload failed')
      return json.url as string
    }))
    setUploadingCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    const urls: string[] = []
    const errors: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') urls.push(r.value)
      else errors.push(r.reason instanceof Error ? r.reason.message : 'Upload failed')
    }
    if (urls.length) setImages(prev => [...prev, ...urls])
    if (errors.length) setUploadError(errors.join('\n'))
  }

  async function handleSubmit() {
    setError('')
    setSaving(true)
    try {
      await onSave({
        ...form,
        images: images.length ? images : null,
        discount_value: form.discount_value ? Number(form.discount_value) : null,
        original_price: form.original_price ? Number(form.original_price) : null,
        deal_price: form.deal_price ? Number(form.deal_price) : null,
        max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
        sort_order: Number(form.sort_order) || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40" onClick={onClose}>
      <div className="relative w-full md:max-w-2xl h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">{deal ? 'Edit Deal' : 'New Deal'}</h2>
          <button onClick={onClose} className="text-tx-light hover:text-tx text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Basic */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={LABEL}>Title *</label>
                <input className={INPUT} value={form.title} onChange={handleTitleChange} required />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Slug *</label>
                <input className={INPUT} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Short Description <span className="font-normal normal-case text-tx-light">(max 120 chars)</span></label>
                <input className={INPUT} maxLength={120} value={form.short_description ?? ''} onChange={e => set('short_description', e.target.value || null)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Full Description</label>
                <textarea className={`${INPUT} resize-y`} rows={4} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} />
              </div>
            </div>
          </section>

          {/* Provider & Property */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Provider & Property</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Provider</label>
                <select className={SELECT} value={form.provider_id ?? ''} onChange={e => set('provider_id', e.target.value || null)}>
                  <option value="">— None —</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Property (exclusive)</label>
                <select className={SELECT} value={form.property_id ?? ''} onChange={e => set('property_id', e.target.value || null)}>
                  <option value="">— All guests —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Category</label>
                <select className={SELECT} value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}>
                  <option value="">— None —</option>
                  {['dining','activity','retail','wellness','transport','accommodation','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Region</label>
                <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
                  {['chania','rethymno','heraklion','lasithi','island-wide'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Discount */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Discount</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Discount Type</label>
                <select className={SELECT} value={form.discount_type ?? ''} onChange={e => set('discount_type', e.target.value || null)}>
                  <option value="">— Select —</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="freebie">Freebie</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {(form.discount_type === 'percentage' || form.discount_type === 'fixed') && (
                <div>
                  <label className={LABEL}>{form.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount'}</label>
                  <input type="number" step="0.01" className={INPUT} value={form.discount_value ?? ''} onChange={e => set('discount_value', e.target.value ? Number(e.target.value) : null)} />
                </div>
              )}
              <div className="col-span-2">
                <label className={LABEL}>Discount Label <span className="font-normal normal-case text-tx-light">(shown to guests — e.g. "20% off")</span></label>
                <input className={INPUT} value={form.discount_label ?? ''} onChange={e => set('discount_label', e.target.value || null)} placeholder="e.g. 20% off" />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Original Price</label>
                <input type="number" step="0.01" className={INPUT} value={form.original_price ?? ''} onChange={e => set('original_price', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <label className={LABEL}>Deal Price</label>
                <input type="number" step="0.01" className={INPUT} value={form.deal_price ?? ''} onChange={e => set('deal_price', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <label className={LABEL}>Currency</label>
                <input className={INPUT} value={form.currency} onChange={e => set('currency', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Code */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Redemption Code</h3>
            <input className={INPUT} value={form.code ?? ''} onChange={e => set('code', e.target.value || null)} placeholder="Optional — guests show this to redeem" />
          </section>

          {/* Validity */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Validity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Valid From</label>
                <input type="datetime-local" className={INPUT} value={form.valid_from?.slice(0, 16) ?? ''} onChange={e => set('valid_from', e.target.value || null)} />
              </div>
              <div>
                <label className={LABEL}>Valid Until</label>
                <input type="datetime-local" className={INPUT} value={form.valid_until?.slice(0, 16) ?? ''} onChange={e => set('valid_until', e.target.value || null)} />
              </div>
              <div>
                <label className={LABEL}>Max Redemptions <span className="font-normal normal-case text-tx-light">(blank = unlimited)</span></label>
                <input type="number" className={INPUT} value={form.max_redemptions ?? ''} onChange={e => set('max_redemptions', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          </section>

          {/* Tier Visibility */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Visibility</h3>
            <div className="flex gap-4 mb-3">
              {['B', 'M', 'P'].map(tier => (
                <label key={tier} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.tier_visibility.includes(tier)} onChange={() => toggleTier(tier)} className="rounded" />
                  <span className="text-sm">{tier === 'B' ? 'Budget' : tier === 'M' ? 'Mid' : 'Premium'} ({tier})</span>
                </label>
              ))}
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="rounded" />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </section>

          {/* Images */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Images</h3>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {images.map((url, i) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-20 h-14 object-cover rounded-sm border border-border" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-border rounded-full text-[10px] text-red-500 flex items-center justify-center hover:bg-red-50">×</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingCount > 0}
              className="px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
              {uploadingCount > 0 ? `Uploading ${uploadingCount}…` : '+ Upload Images'}
            </button>
            {uploadError && <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-sm">{uploadError}</p>}
          </section>

          {/* Terms */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Terms & Conditions</h3>
            <textarea className={`${INPUT} resize-y`} rows={4} value={form.terms ?? ''} onChange={e => set('terms', e.target.value || null)} placeholder="Fine print, restrictions..." />
          </section>

        </div>
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex-shrink-0">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : deal ? 'Save Changes' : 'Create Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DealsSection() {
  const [deals, setDeals] = useState<DealFull[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editDeal, setEditDeal] = useState<DealFull | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function load() {
    setLoading(true)
    const [dealsRes, providersRes, propertiesRes] = await Promise.all([
      fetch('/api/admin/deals').then(r => r.json()),
      fetch('/api/admin/providers').then(r => r.json()),
      fetch('/api/admin/properties').then(r => r.json()),
    ])
    setDeals(Array.isArray(dealsRes) ? dealsRes : [])
    setProviders(Array.isArray(providersRes) ? providersRes : [])
    setProperties(Array.isArray(propertiesRes) ? propertiesRes : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Partial<FormState>) {
    if (editDeal) {
      const res = await fetch(`/api/admin/deals/${editDeal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    } else {
      const res = await fetch('/api/admin/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    }
    setShowForm(false)
    setEditDeal(null)
    showToast(editDeal ? 'Deal updated' : 'Deal created')
    load()
  }

  async function handleToggle(deal: DealFull, field: 'is_featured' | 'is_active') {
    await fetch(`/api/admin/deals/${deal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !deal[field] }),
    })
    load()
  }

  async function handleClone(deal: DealFull) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, total_redemptions, ...rest } = deal
    await fetch('/api/admin/deals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rest, title: `Copy of ${deal.title}`, slug: `${deal.slug}-copy-${Date.now()}`, is_active: false }),
    })
    showToast('Deal cloned')
    load()
  }

  async function handleRedeem(deal: DealFull) {
    await fetch(`/api/deals/${deal.id}/redeem`, { method: 'POST' })
    showToast(`Redemption tracked for "${deal.title}"`)
    load()
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map(id => fetch(`/api/admin/deals/${id}`, { method: 'DELETE' })))
    setSelected(new Set())
    setConfirmDelete(null)
    showToast(`${ids.length} deal(s) deleted`)
    load()
  }

  async function handleBulkToggle(active: boolean) {
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/admin/deals/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      })
    ))
    setSelected(new Set())
    showToast(`${selected.size} deal(s) ${active ? 'activated' : 'deactivated'}`)
    load()
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function toggleAll() {
    setSelected(prev => prev.size === deals.length ? new Set() : new Set(deals.map(d => d.id)))
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Deals & Offers</h1>
          <p className="text-sm text-tx-light mt-0.5">{deals.length} deal{deals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditDeal(null); setShowForm(true) }}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors"
        >+ New Deal</button>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-navy/5 border border-navy/20 rounded-sm">
          <span className="text-sm font-medium text-navy">{selected.size} selected</span>
          <button onClick={() => handleBulkToggle(true)} className="px-3 py-1.5 text-xs font-semibold bg-teal text-white rounded-sm hover:opacity-90">Activate all</button>
          <button onClick={() => handleBulkToggle(false)} className="px-3 py-1.5 text-xs font-semibold bg-gray-400 text-white rounded-sm hover:opacity-90">Deactivate all</button>
          <button onClick={() => setConfirmDelete(Array.from(selected))} className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-sm hover:opacity-90">Delete selected</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-tx-light hover:text-tx">Clear</button>
        </div>
      )}

      {loading && <p className="text-sm text-tx-light">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-3 text-left w-8">
                  <input type="checkbox" checked={selected.size === deals.length && deals.length > 0}
                    onChange={toggleAll} className="rounded" />
                </th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Title</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Category</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Discount</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Valid Until</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Redeemed</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Photos</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Featured</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Active</th>
                <th className="pb-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id} className="border-b border-border-light hover:bg-sand/40 transition-colors">
                  <td className="py-2.5 pr-3">
                    <input type="checkbox" checked={selected.has(deal.id)} onChange={() => toggleSelect(deal.id)} className="rounded" />
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-navy">{deal.title}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-tx-light capitalize">{deal.category ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-tx-mid">{deal.discount_label ?? '—'}</td>
                  <td className="py-2.5 pr-4">{validUntilBadge(deal.valid_until)}</td>
                  <td className="py-2.5 pr-4 text-tx-light">{deal.total_redemptions ?? 0}{deal.max_redemptions ? `/${deal.max_redemptions}` : ''}</td>
                  <td className="py-2.5 pr-4">
                    {(deal.images?.length ?? 0) > 0
                      ? <span className="text-[11px] text-teal font-semibold">📷 {deal.images!.length}</span>
                      : <span className="text-[11px] text-red-400">No photos</span>}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Toggle checked={deal.is_featured} onChange={() => handleToggle(deal, 'is_featured')} />
                  </td>
                  <td className="py-2.5 pr-4">
                    <Toggle checked={deal.is_active} onChange={() => handleToggle(deal, 'is_active')} />
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditDeal(deal); setShowForm(true) }}
                        className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors">Edit</button>
                      <button onClick={() => handleClone(deal)}
                        className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors">Clone</button>
                      <button onClick={() => handleRedeem(deal)}
                        className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-teal hover:text-teal transition-colors">+Redeem</button>
                      <button onClick={() => setConfirmDelete([deal.id])}
                        className="px-2 py-1 text-[11px] text-red-400 border border-border rounded-sm hover:border-red-300 hover:text-red-500 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr><td colSpan={10} className="py-12 text-center text-tx-light text-sm">No deals yet — create your first one</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form drawer */}
      {showForm && (
        <DealForm
          deal={editDeal}
          providers={providers}
          properties={properties}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditDeal(null) }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-navy mb-2">Delete {confirmDelete.length} deal{confirmDelete.length > 1 ? 's' : ''}?</h3>
            <p className="text-sm text-tx-light mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-border rounded-sm hover:bg-sand">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-sm hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 bg-navy text-white text-sm rounded-sm shadow-lg z-[70]">{toast}</div>
      )}
    </div>
  )
}
