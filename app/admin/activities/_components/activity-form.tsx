'use client'

import { useState, useRef } from 'react'
import type { Activity, Provider } from '@/lib/types'

type FormData = Omit<Activity, 'id' | 'created_at' | 'updated_at'>

interface Props {
  activity: Activity | null
  providers: Provider[]
  onSave: (data: Partial<FormData>) => Promise<void>
  onClose: () => void
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

export function ActivityForm({ activity, providers, onSave, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: activity?.title ?? '',
    slug: activity?.slug ?? '',
    description: activity?.description ?? '',
    category: activity?.category ?? 'sea',
    region: (activity?.region ?? 'chania') as string,
    tier_visibility: activity?.tier_visibility ?? (['B', 'M', 'P'] as string[]),
    price_from: activity?.price_from?.toString() ?? '',
    price_to: activity?.price_to?.toString() ?? '',
    currency: activity?.currency ?? 'EUR',
    duration: activity?.duration ?? '',
    season: activity?.season ?? '',
    availability_text: activity?.availability_text ?? '',
    max_group_size: activity?.max_group_size?.toString() ?? '',
    languages: activity?.languages?.join(', ') ?? 'en',
    meeting_point: activity?.meeting_point ?? '',
    meeting_coords: activity?.meeting_coords ?? '',
    includes: activity?.includes?.join('\n') ?? '',
    good_to_know: activity?.good_to_know ?? '',
    cancellation_policy: activity?.cancellation_policy ?? 'Free cancellation up to 24 hours',
    provider_id: activity?.provider_id ?? '',
    images: activity?.images ?? ([] as string[]),
    item_type: activity?.item_type ?? 'activity',
    sort_order: activity?.sort_order?.toString() ?? '0',
    is_featured: activity?.is_featured ?? false,
    is_active: activity?.is_active ?? true,
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleTitleBlur() {
    if (!form.slug && form.title) {
      set('slug', slugify(form.title))
    }
  }

  function toggleTier(tier: string) {
    set(
      'tier_visibility',
      form.tier_visibility.includes(tier)
        ? form.tier_visibility.filter(t => t !== tier)
        : [...form.tier_visibility, tier]
    )
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) {
        set('images', [...form.images, json.url])
      } else {
        setError(json.error ?? 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(url: string) {
    set('images', form.images.filter((u: string) => u !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload: Partial<FormData> = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description,
        category: form.category as Activity['category'],
        region: form.region as Activity['region'],
        tier_visibility: form.tier_visibility as Activity['tier_visibility'],
        price_from: form.price_from ? parseFloat(form.price_from) : null,
        price_to: form.price_to ? parseFloat(form.price_to) : null,
        currency: form.currency,
        duration: form.duration || null,
        season: form.season || null,
        availability_text: form.availability_text || null,
        max_group_size: form.max_group_size ? parseInt(form.max_group_size) : null,
        languages: form.languages.split(',').map((l: string) => l.trim()).filter(Boolean),
        meeting_point: form.meeting_point || null,
        meeting_coords: form.meeting_coords || null,
        includes: form.includes ? form.includes.split('\n').map((l: string) => l.trim()).filter(Boolean) : null,
        good_to_know: form.good_to_know || null,
        cancellation_policy: form.cancellation_policy || null,
        provider_id: form.provider_id || null,
        images: form.images,
        item_type: form.item_type as 'activity' | 'service',
        sort_order: parseInt(form.sort_order) || 0,
        is_featured: form.is_featured,
        is_active: form.is_active,
      }
      await onSave(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40" onClick={onClose}>
      <div
        className="relative w-full md:max-w-2xl h-full bg-white shadow-modal flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">
            {activity ? 'Edit Activity' : 'New Activity'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-tx-light hover:text-tx text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Basic Info */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={LABEL}>Title *</label>
                <input
                  className={INPUT}
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  onBlur={handleTitleBlur}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Slug *</label>
                <input
                  className={INPUT}
                  value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                  placeholder="auto-generated from title"
                />
              </div>
              <div>
                <label className={LABEL}>Category *</label>
                <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
                  {['sea', 'land', 'table', 'culture', 'adventure', 'wellness'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Item Type</label>
                <select className={SELECT} value={form.item_type} onChange={e => set('item_type', e.target.value)}>
                  <option value="activity">Activity</option>
                  <option value="service">Service</option>
                </select>
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
                <label className={LABEL}>Provider</label>
                <select className={SELECT} value={form.provider_id} onChange={e => set('provider_id', e.target.value)}>
                  <option value="">— None —</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Description *</label>
                <textarea
                  className={`${INPUT} resize-y`}
                  rows={4}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          {/* Tier Visibility */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Tier Visibility</h3>
            <div className="flex gap-4">
              {['B', 'M', 'P'].map(tier => (
                <label key={tier} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tier_visibility.includes(tier)}
                    onChange={() => toggleTier(tier)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-tx">
                    {tier === 'B' ? 'Budget' : tier === 'M' ? 'Mid' : 'Premium'} ({tier})
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Pricing & Logistics */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Pricing & Logistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Price From (€)</label>
                <input type="number" step="0.01" className={INPUT} value={form.price_from} onChange={e => set('price_from', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Price To (€)</label>
                <input type="number" step="0.01" className={INPUT} value={form.price_to} onChange={e => set('price_to', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Currency</label>
                <input className={INPUT} value={form.currency} onChange={e => set('currency', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Duration</label>
                <input className={INPUT} placeholder="e.g. 3 hours" value={form.duration} onChange={e => set('duration', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Season</label>
                <input className={INPUT} placeholder="e.g. Apr–Nov" value={form.season} onChange={e => set('season', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Availability</label>
                <input className={INPUT} placeholder="e.g. Daily" value={form.availability_text} onChange={e => set('availability_text', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Max Group Size</label>
                <input type="number" className={INPUT} value={form.max_group_size} onChange={e => set('max_group_size', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Languages (comma-separated)</label>
                <input className={INPUT} placeholder="en, gr" value={form.languages} onChange={e => set('languages', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Meeting Point</label>
                <input className={INPUT} value={form.meeting_point} onChange={e => set('meeting_point', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Meeting Coords (lat,lng)</label>
                <input className={INPUT} placeholder="35.5138,24.0178" value={form.meeting_coords} onChange={e => set('meeting_coords', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Content */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Content</h3>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>What's Included (one per line)</label>
                <textarea
                  className={`${INPUT} resize-y`}
                  rows={4}
                  placeholder={"Equipment provided\nGuide included\nTransfer"}
                  value={form.includes}
                  onChange={e => set('includes', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Good to Know</label>
                <textarea
                  className={`${INPUT} resize-y`}
                  rows={3}
                  value={form.good_to_know}
                  onChange={e => set('good_to_know', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Cancellation Policy</label>
                <input className={INPUT} value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Images */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Images</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.images.map((url: string) => (
                <div key={url} className="relative group w-24 h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-24 h-24 object-cover rounded-sm border border-border" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
            >
              {uploadingImage ? 'Uploading…' : '+ Upload Image'}
            </button>
          </section>

          {/* Settings */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Sort Order</label>
                <input type="number" className={INPUT} value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
              </div>
              <div className="flex items-end gap-6 pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="rounded" />
                  <span className="text-sm text-tx">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
                  <span className="text-sm text-tx">Active</span>
                </label>
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</p>
          )}
        </form>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : activity ? 'Save Changes' : 'Create Activity'}
          </button>
        </div>
      </div>
    </div>
  )
}
