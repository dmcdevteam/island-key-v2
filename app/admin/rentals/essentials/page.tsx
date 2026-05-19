'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminShell } from '../../_components/sidebar'
import { Toggle, Drawer, TabBar, INPUT, LABEL, SELECT } from '../_components/shared'

// ── Constants ────────────────────────────────────────────────────────────────

const EXTRA_CATEGORIES = ['beach', 'baby', 'camping', 'sport', 'comfort', 'other']
const EXTRA_BADGE_COLORS: Record<string, string> = {
  beach: 'bg-blue-100 text-blue-700', baby: 'bg-pink-100 text-pink-700',
  camping: 'bg-green-100 text-green-700', sport: 'bg-orange-100 text-orange-700',
  comfort: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600',
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Extra Form ────────────────────────────────────────────────────────────────

type ExtraFormData = {
  name: string; description: string; category: string
  pricingMode: 'day' | 'unit'; price_per_day: string; price_per_unit: string
  unit_label: string; is_active: boolean; sort_order: string
  image: string; full_description: string; usage_instructions: string
  price_3day: string; price_week: string; custom_pricing_note: string
  external_links: { label: string; url: string }[]
  image_wide: string
}

const EXTRA_DEFAULTS: ExtraFormData = {
  name: '', description: '', category: 'beach',
  pricingMode: 'day', price_per_day: '', price_per_unit: '', unit_label: 'item',
  is_active: true, sort_order: '0', image: '',
  full_description: '', usage_instructions: '',
  price_3day: '', price_week: '',
  custom_pricing_note: 'Contact us for longer durations',
  external_links: [], image_wide: '',
}

function ExtraForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ExtraFormData>(() => {
    if (!initial) return EXTRA_DEFAULTS
    return {
      name: initial.name, description: initial.description ?? '', category: initial.category,
      pricingMode: initial.price_per_unit != null ? 'unit' : 'day',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_unit: initial.price_per_unit != null ? String(initial.price_per_unit) : '',
      unit_label: initial.unit_label ?? 'item',
      is_active: initial.is_active, sort_order: String(initial.sort_order),
      image: initial.image ?? '',
      full_description: initial.full_description ?? '',
      usage_instructions: initial.usage_instructions ?? '',
      price_3day: initial.price_3day != null ? String(initial.price_3day) : '',
      price_week: initial.price_week != null ? String(initial.price_week) : '',
      custom_pricing_note: initial.custom_pricing_note ?? 'Contact us for longer durations',
      external_links: initial.external_links ?? [],
      image_wide: initial.image_wide ?? '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wideImgRef = useRef<HTMLInputElement>(null)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  function set<K extends keyof ExtraFormData>(k: K, v: ExtraFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function uploadImg(file: File, slug: string): Promise<string | null> {
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', slug)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    return (await res.json()).url ?? null
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, description: form.description || null, category: form.category,
      price_per_day: form.pricingMode === 'day' && form.price_per_day ? Number(form.price_per_day) : null,
      price_per_unit: form.pricingMode === 'unit' && form.price_per_unit ? Number(form.price_per_unit) : null,
      unit_label: form.unit_label || 'item',
      is_active: form.is_active, sort_order: Number(form.sort_order) || 0,
      image: form.image || null,
      full_description: form.full_description || null,
      usage_instructions: form.usage_instructions || null,
      price_3day: form.price_3day ? Number(form.price_3day) : null,
      price_week: form.price_week ? Number(form.price_week) : null,
      custom_pricing_note: form.custom_pricing_note || null,
      external_links: form.external_links,
      image_wide: form.image_wide || null,
    }
    const url = initial ? `/api/admin/extras/${initial.id}` : '/api/admin/extras'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Item' : 'Add Item'} onClose={onClose} onSave={handleSave} saving={saving}>
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
        <label className={LABEL}>Image</label>
        {form.image && (
          <div className="mb-2 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image} alt="" className="w-32 h-24 object-cover rounded-sm border border-border" />
            <button type="button" onClick={() => set('image', '')} className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">×</button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return
          setImageUploading(true)
          const url = await uploadImg(file, `extras/${slugify(form.name || 'extra')}`)
          if (url) set('image', url); setImageUploading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
          className="px-3 py-1.5 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
          {imageUploading ? 'Uploading…' : form.image ? 'Replace Image' : '+ Upload Image'}
        </button>
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

      {/* Product detail fields */}
      <div className="border-t border-border pt-4 space-y-4">
        <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">Product Details (shown on product page)</p>
        <div>
          <label className={LABEL}>Wide / Hero Image</label>
          {form.image_wide && (
            <div className="mb-2 relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image_wide} alt="" className="w-full h-28 object-cover rounded-sm border border-border" />
              <button type="button" onClick={() => set('image_wide', '')} className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">×</button>
            </div>
          )}
          <input ref={wideImgRef} type="file" accept="image/*" className="hidden" onChange={async e => {
            const file = e.target.files?.[0]; if (!file) return
            setImageUploading(true)
            const url = await uploadImg(file, `essentials/${slugify(form.name || 'extra')}-wide`)
            if (url) set('image_wide', url); setImageUploading(false)
            if (wideImgRef.current) wideImgRef.current.value = ''
          }} />
          <button type="button" onClick={() => wideImgRef.current?.click()} disabled={imageUploading}
            className="px-3 py-1.5 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
            {imageUploading ? 'Uploading…' : form.image_wide ? 'Replace' : '+ Upload Wide Image'}
          </button>
        </div>
        <div>
          <label className={LABEL}>Full Description</label>
          <textarea className={INPUT} rows={5} value={form.full_description} onChange={e => set('full_description', e.target.value)} placeholder="Detailed product description shown on the product page…" />
        </div>
        <div>
          <label className={LABEL}>Usage Instructions</label>
          <textarea className={INPUT} rows={3} value={form.usage_instructions} onChange={e => set('usage_instructions', e.target.value)} placeholder="How to use / set up this product…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>3-Day Price (€)</label>
            <input className={INPUT} type="number" min="0" value={form.price_3day} onChange={e => set('price_3day', e.target.value)} placeholder="e.g. 25" />
          </div>
          <div>
            <label className={LABEL}>Weekly Price (€)</label>
            <input className={INPUT} type="number" min="0" value={form.price_week} onChange={e => set('price_week', e.target.value)} placeholder="e.g. 40" />
          </div>
        </div>
        <div>
          <label className={LABEL}>Custom Pricing Note</label>
          <input className={INPUT} value={form.custom_pricing_note} onChange={e => set('custom_pricing_note', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>External Links</label>
          <div className="space-y-2 mb-2">
            {form.external_links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-sand px-3 py-2 rounded-sm">
                <span className="flex-1 truncate text-navy font-medium">{link.label}</span>
                <span className="text-tx-light text-xs truncate max-w-[160px]">{link.url}</span>
                <button type="button" onClick={() => set('external_links', form.external_links.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={INPUT} value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Label (e.g. Product page)" />
            <input className={INPUT} value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://…" />
            <button type="button" onClick={() => {
              if (newLinkLabel.trim() && newLinkUrl.trim()) {
                set('external_links', [...form.external_links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }])
                setNewLinkLabel(''); setNewLinkUrl('')
              }
            }} className="px-3 py-2 bg-navy text-white text-xs font-semibold rounded-sm whitespace-nowrap">Add</button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

// ── Category Images Tab ───────────────────────────────────────────────────────

function CategoryImagesTab() {
  const [catData, setCatData] = useState<any[]>([])
  const [uploading, setUploading] = useState<string | null>(null)

  const fetchCats = useCallback(async () => {
    const res = await fetch('/api/rentals/essentials-categories')
    if (res.ok) {
      const data = await res.json()
      setCatData(Array.isArray(data?.categories) ? data.categories : [])
    }
  }, [])

  useEffect(() => { fetchCats() }, [fetchCats])

  async function uploadCategoryImage(category: string, file: File) {
    setUploading(category)
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', `essentials/${category}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (json.url) {
      await fetch(`/api/admin/rental-essentials-categories/${category}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_wide: json.url, image_url: json.url }),
      })
      fetchCats()
    }
    setUploading(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-navy">Vacation Essentials — Category Images</h2>
        <p className="text-xs text-tx-light">Hero images for each essentials category card</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {EXTRA_CATEGORIES.map(cat => {
          const row = catData.find((r: any) => r.category === cat)
          const imageUrl = row?.image_wide ?? row?.image_url ?? null
          const label = row?.label ?? cat.charAt(0).toUpperCase() + cat.slice(1)
          const isUploading = uploading === cat
          return (
            <div key={cat} className="bg-white border border-border rounded-sm overflow-hidden">
              <div className="relative h-36 flex items-end" style={{ background: imageUrl ? undefined : 'linear-gradient(135deg, #1A8A7D 0%, #1B2D4F 100%)' }}>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <p className="relative z-10 px-3 pb-3 text-white text-sm font-semibold font-display">{label}</p>
                  </>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-tx mb-2">{label}</p>
                <label className={`block w-full text-center px-3 py-2 border border-dashed border-border rounded-sm text-xs text-tx-mid cursor-pointer hover:border-navy hover:text-navy transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? 'Uploading…' : imageUrl ? 'Replace Image' : '+ Upload Image'}
                  <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => {
                    const file = e.target.files?.[0]; if (file) uploadCategoryImage(cat, file); e.target.value = ''
                  }} />
                </label>
                {imageUrl && (
                  <button onClick={async () => {
                    await fetch(`/api/admin/rental-essentials-categories/${cat}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_wide: null, image_url: null }) })
                    fetchCats()
                  }} className="mt-1.5 w-full text-center text-xs text-red-500 hover:text-red-700">Remove</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Essentials Page ───────────────────────────────────────────────────────────

const TABS = ['Items', 'Category Images']

export default function EssentialsPage() {
  const [tab, setTab] = useState(0)
  const [extras, setExtras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [extraFilter, setExtraFilter] = useState('All')
  const [extraForm, setExtraForm] = useState<any | null | 'new'>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/extras')
    const data = await res.json()
    setExtras(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filteredExtras = extraFilter === 'All'
    ? extras
    : extras.filter(e => e.category === extraFilter.toLowerCase())

  return (
    <AdminShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-navy">Vacation Essentials</h1>
          <p className="text-sm text-tx-mid mt-1">Manage rental extras, essentials items, and category images</p>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* Items */}
        {tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-navy">Extras &amp; Essentials</h2>
              <button onClick={() => setExtraForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {['All', ...EXTRA_CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))].map(c => (
                <button key={c} onClick={() => setExtraFilter(c)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${extraFilter === c ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border hover:border-navy hover:text-navy'}`}>
                  {c}
                </button>
              ))}
            </div>
            {loading && <p className="text-tx-mid text-sm">Loading…</p>}
            {!loading && filteredExtras.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No extras found</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExtras.map(extra => (
                <div key={extra.id} className="bg-white border border-border rounded-sm p-4 flex flex-col gap-2">
                  {extra.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={extra.image} alt={extra.name} className="w-full h-24 object-cover rounded-sm border border-border mb-1" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-tx">{extra.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex-shrink-0 ${EXTRA_BADGE_COLORS[extra.category] ?? EXTRA_BADGE_COLORS.other}`}>
                      {extra.category}
                    </span>
                  </div>
                  <p className="text-xs text-tx-mid">
                    {extra.price_per_day != null ? `€${extra.price_per_day} / day`
                      : extra.price_per_unit != null ? `€${extra.price_per_unit} / ${extra.unit_label}`
                      : 'No price set'}
                  </p>
                  <p className={`text-xs font-medium ${extra.is_active ? 'text-teal' : 'text-gray-400'}`}>
                    {extra.is_active ? 'Active' : 'Inactive'}
                  </p>
                  <div className="flex gap-2 mt-auto pt-1">
                    <button onClick={() => setExtraForm(extra)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                    <button onClick={async () => {
                      if (!confirm('Delete this extra?')) return
                      await fetch(`/api/admin/extras/${extra.id}`, { method: 'DELETE' })
                      fetchAll()
                    }} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Images */}
        {tab === 1 && <CategoryImagesTab />}

        {extraForm !== null && (
          <ExtraForm initial={extraForm === 'new' ? null : extraForm} onClose={() => setExtraForm(null)} onSaved={() => { setExtraForm(null); fetchAll() }} />
        )}
      </div>
    </AdminShell>
  )
}
