'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FocalPointPicker, type FocalPoint } from '@/components/admin/FocalPointPicker'

// ── Types ──────────────────────────────────────────────────────────────────────

type VehicleType = {
  id: string; name: string; category: string; subcategory: string | null
  description: string | null; seats: number | null; icon: string | null
  is_active: boolean; sort_order: number; created_at: string
}

type Rental = {
  id: string; vehicle_type_id: string | null; name: string; slug: string | null
  description: string | null; price_per_day: number | null; price_per_week: number | null
  min_rental_days: number; deposit_required: number | null; insurance_included: boolean
  delivery_available: boolean; delivery_fee: number | null; region: string
  tier_visibility: string[]; images: string[] | null; features: string[] | null
  requirements: string | null; provider_id: string | null; is_active: boolean
  is_featured: boolean; sort_order: number; created_at: string
  focal_x: number | null; focal_y: number | null
}

type RentalExtra = {
  id: string; name: string; description: string | null; category: string
  price_per_day: number | null; price_per_unit: number | null; unit_label: string
  image: string | null; is_active: boolean; sort_order: number; created_at: string
}

type Provider = { id: string; name: string }

type ImageItem = { url: string }

type RentalSlim = { id: string; slug: string; name: string }

type RentalImageFolder = { name: string; urls: string[]; fileNames: string[]; storagePaths: string[] }
type RentalSummary = { id: string; slug: string | null; name: string; images: string[] | null }

// ── Constants ──────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const TABS = ['Vehicles', 'Vehicle Types', 'Extras & Essentials', 'Images']

const VEHICLE_CATEGORIES = ['car', 'motorcycle', 'bike', 'buggy', 'boat', 'scooter', 'atv', 'other']
const REGIONS = ['chania', 'rethymno', 'heraklion', 'lasithi']
const EXTRA_CATEGORIES = ['beach', 'baby', 'camping', 'sport', 'comfort', 'other']

const EXTRA_BADGE_COLORS: Record<string, string> = {
  beach: 'bg-blue-100 text-blue-700',
  baby: 'bg-pink-100 text-pink-700',
  camping: 'bg-green-100 text-green-700',
  sport: 'bg-orange-100 text-orange-700',
  comfort: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif',
}
const SUPPORTED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif'])

function getEffectiveMime(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Drawer wrapper ─────────────────────────────────────────────────────────────

function Drawer({ title, onClose, onSave, saving, children }: {
  title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">{title}</h2>
          <button onClick={onClose} className="text-tx-light hover:text-tx text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-sm text-sm font-medium text-tx hover:bg-sand">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex-1 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vehicle Form ───────────────────────────────────────────────────────────────

type RentalFormData = {
  name: string; slug: string; vehicle_type_id: string; description: string
  price_per_day: string; price_per_week: string; min_rental_days: string
  deposit_required: string; insurance_included: boolean; delivery_available: boolean
  delivery_fee: string; region: string; tier_visibility: string[]
  features: string[]; requirements: string; provider_id: string
  is_featured: boolean; is_active: boolean; sort_order: string
  images: string[]
}

const RENTAL_DEFAULTS: RentalFormData = {
  name: '', slug: '', vehicle_type_id: '', description: '',
  price_per_day: '', price_per_week: '', min_rental_days: '1',
  deposit_required: '', insurance_included: true, delivery_available: false,
  delivery_fee: '', region: 'chania', tier_visibility: ['B', 'M', 'P'],
  features: [], requirements: '', provider_id: '',
  is_featured: false, is_active: true, sort_order: '0',
  images: [],
}

function VehicleForm({
  initial, vehicleTypes, providers, onClose, onSaved,
}: {
  initial: Rental | null
  vehicleTypes: VehicleType[]
  providers: Provider[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<RentalFormData>(() => {
    if (!initial) return RENTAL_DEFAULTS
    return {
      name: initial.name,
      slug: initial.slug ?? '',
      vehicle_type_id: initial.vehicle_type_id ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      min_rental_days: String(initial.min_rental_days),
      deposit_required: initial.deposit_required != null ? String(initial.deposit_required) : '',
      insurance_included: initial.insurance_included,
      delivery_available: initial.delivery_available,
      delivery_fee: initial.delivery_fee != null ? String(initial.delivery_fee) : '',
      region: initial.region,
      tier_visibility: initial.tier_visibility ?? ['B', 'M', 'P'],
      features: initial.features ?? [],
      requirements: initial.requirements ?? '',
      provider_id: initial.provider_id ?? '',
      is_featured: initial.is_featured,
      is_active: initial.is_active,
      sort_order: String(initial.sort_order),
      images: initial.images ?? [],
    }
  })
  const [featureInput, setFeatureInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(
    initial?.focal_x != null && initial?.focal_y != null
      ? { x: initial.focal_x, y: initial.focal_y }
      : null
  )

  // Image state
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    () => (initial?.images ?? []).map(url => ({ url }))
  )
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Folder upload state
  const [folderName, setFolderName] = useState<string | null>(null)
  const [folderFiles, setFolderFiles] = useState<File[]>([])
  const [folderUploading, setFolderUploading] = useState(false)
  const [folderProgress, setFolderProgress] = useState(0)
  const [folderError, setFolderError] = useState('')
  const [folderSuccess, setFolderSuccess] = useState('')
  const [folderMatch, setFolderMatch] = useState<RentalSlim | null | undefined>(undefined)

  function set<K extends keyof RentalFormData>(k: K, v: RentalFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleNameChange(name: string) {
    set('name', name)
    if (!initial) set('slug', slugify(name))
  }

  function toggleTier(tier: string) {
    set('tier_visibility', form.tier_visibility.includes(tier)
      ? form.tier_visibility.filter(t => t !== tier)
      : [...form.tier_visibility, tier])
  }

  function addFeature() {
    const f = featureInput.trim()
    if (f && !form.features.includes(f)) {
      set('features', [...form.features, f])
    }
    setFeatureInput('')
  }

  function removeFeature(f: string) {
    set('features', form.features.filter(x => x !== f))
  }

  async function handleFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => SUPPORTED_MIME.has(getEffectiveMime(f)))
    if (!files.length) return
    setUploadError('')
    setUploadingCount(c => c + files.length)
    const slug = form.slug || slugify(form.name) || 'rental'
    const results = await Promise.all(files.map(async file => {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      fd.append('bucket', 'rental-images')
      fd.append('slug', slug)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      return res.json()
    }))
    setUploadingCount(c => c - files.length)
    const errors: string[] = []
    const newItems: ImageItem[] = []
    results.forEach(json => {
      if (json.url) newItems.push({ url: json.url })
      else errors.push(json.error ?? 'Upload failed')
    })
    if (newItems.length) setImageItems(prev => [...prev, ...newItems])
    if (errors.length) setUploadError(errors[0])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => SUPPORTED_MIME.has(getEffectiveMime(f)))
    if (!files.length) return
    setFolderError(''); setFolderSuccess(''); setFolderMatch(undefined)
    // Detect folder name from first file's webkitRelativePath
    const firstPath = (files[0] as { webkitRelativePath?: string }).webkitRelativePath ?? ''
    const detectedFolder = firstPath.split('/')[0] || slugify(files[0].name.split('.')[0])
    setFolderName(detectedFolder)
    setFolderFiles(files)
    setFolderProgress(0)
    // Check if this folder matches a rental
    const res = await fetch('/api/admin/rentals')
    if (res.ok) {
      const rentals: RentalSlim[] = await res.json()
      const match = rentals.find(a => a.slug === detectedFolder) ?? null
      setFolderMatch(match)
    } else {
      setFolderMatch(null)
    }
  }

  async function handleFolderUpload() {
    if (!folderFiles.length || !folderName) return
    setFolderUploading(true); setFolderError(''); setFolderSuccess('')
    let done = 0
    const uploadedUrls: string[] = []
    for (const file of folderFiles) {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      fd.append('bucket', 'rental-images')
      fd.append('slug', folderName)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) uploadedUrls.push(json.url)
      else { setFolderError(json.error ?? 'Upload failed'); setFolderUploading(false); return }
      done++
      setFolderProgress(Math.round((done / folderFiles.length) * 100))
    }
    // Link to rental if matched
    if (folderMatch && uploadedUrls.length) {
      await fetch(`/api/admin/rentals/${folderMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: uploadedUrls }),
      })
      const count = uploadedUrls.length
      setFolderSuccess(`${count} image${count > 1 ? 's' : ''} uploaded and linked to "${folderMatch.name}"`)
    } else {
      const count = uploadedUrls.length
      setFolderSuccess(`${count} image${count > 1 ? 's' : ''} uploaded to rental-images/${folderName}/ — not linked to any rental`)
    }
    setFolderUploading(false)
    clearFolderSelection()
  }

  function clearFolderSelection() {
    setFolderName(null); setFolderFiles([]); setFolderProgress(0); setFolderMatch(undefined)
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  function removeImage(i: number) {
    setImageItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function setCover(i: number) {
    setImageItems(prev => {
      const next = [...prev]
      const [item] = next.splice(i, 1)
      return [item, ...next]
    })
  }

  function handleDragStart(i: number) { setDragIndex(i) }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    setImageItems(prev => {
      const next = [...prev]
      const [item] = next.splice(dragIndex, 1)
      next.splice(i, 0, item)
      return next
    })
    setDragIndex(i)
  }
  function handleDragEnd() { setDragIndex(null) }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      vehicle_type_id: form.vehicle_type_id || null,
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      min_rental_days: Number(form.min_rental_days) || 1,
      deposit_required: form.deposit_required ? Number(form.deposit_required) : null,
      insurance_included: form.insurance_included,
      delivery_available: form.delivery_available,
      delivery_fee: form.delivery_available && form.delivery_fee ? Number(form.delivery_fee) : null,
      region: form.region,
      tier_visibility: form.tier_visibility,
      features: form.features.length ? form.features : null,
      requirements: form.requirements || null,
      provider_id: form.provider_id || null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
      images: imageItems.map(i => i.url),
      focal_x: focalPoint?.x ?? null,
      focal_y: focalPoint?.y ?? null,
    }
    const url = initial ? `/api/admin/rentals/${initial.id}` : '/api/admin/rentals'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Error saving')
      setSaving(false)
      return
    }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Vehicle' : 'Add Vehicle'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => handleNameChange(e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Slug</label>
        <input className={INPUT} value={form.slug} onChange={e => set('slug', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Vehicle Type</label>
        <select className={SELECT} value={form.vehicle_type_id} onChange={e => set('vehicle_type_id', e.target.value)}>
          <option value="">— Select type —</option>
          {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
        </select>
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Min Rental Days</label>
          <input className={INPUT} type="number" min="1" value={form.min_rental_days} onChange={e => set('min_rental_days', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Deposit Required (€)</label>
          <input className={INPUT} type="number" min="0" value={form.deposit_required} onChange={e => set('deposit_required', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Included</span>
        <Toggle checked={form.insurance_included} onChange={() => set('insurance_included', !form.insurance_included)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Delivery Available</span>
        <Toggle checked={form.delivery_available} onChange={() => set('delivery_available', !form.delivery_available)} />
      </div>
      {form.delivery_available && (
        <div>
          <label className={LABEL}>Delivery Fee (€)</label>
          <input className={INPUT} type="number" min="0" value={form.delivery_fee} onChange={e => set('delivery_fee', e.target.value)} />
        </div>
      )}
      <div>
        <label className={LABEL}>Region</label>
        <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Tier Visibility</label>
        <div className="flex gap-3 mt-1">
          {['B', 'M', 'P'].map(t => (
            <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={form.tier_visibility.includes(t)} onChange={() => toggleTier(t)} />
              {t}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL}>Features</label>
        <div className="flex gap-2 mb-2">
          <input
            className={INPUT}
            placeholder="Add a feature…"
            value={featureInput}
            onChange={e => setFeatureInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
          />
          <button type="button" onClick={addFeature} className="px-3 py-2 bg-navy text-white text-sm rounded-sm hover:bg-navy-light flex-shrink-0">Add</button>
        </div>
        {form.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.features.map(f => (
              <span key={f} className="flex items-center gap-1 px-2 py-0.5 bg-sand text-tx text-xs rounded">
                {f}
                <button type="button" onClick={() => removeFeature(f)} className="text-tx-light hover:text-tx">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className={LABEL}>Requirements</label>
        <textarea className={INPUT} rows={2} value={form.requirements} onChange={e => set('requirements', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Provider</label>
        <select className={SELECT} value={form.provider_id} onChange={e => set('provider_id', e.target.value)}>
          <option value="">— Select provider —</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Featured</span>
        <Toggle checked={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>

      {/* ── Images ── */}
      <div>
        <label className={LABEL}>Images</label>

        {/* Multi-file upload */}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelect} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingCount > 0}
          className="w-full px-3 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50 mb-3">
          {uploadingCount > 0 ? `Uploading ${uploadingCount} file${uploadingCount > 1 ? 's' : ''}…` : '+ Upload Images'}
        </button>
        {uploadError && <p className="mb-2 text-xs text-red-500">{uploadError}</p>}

        {/* Image preview grid */}
        {imageItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {imageItems.map((item, i) => (
              <div
                key={item.url}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`relative w-20 h-14 rounded-sm overflow-hidden border cursor-move ${dragIndex === i ? 'opacity-50 border-navy' : 'border-border'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-navy/70 text-white text-[9px] text-center py-0.5">Cover</span>
                )}
                <button type="button" onClick={() => setCover(i)} title="Set as cover"
                  className="absolute top-0.5 left-0.5 text-yellow-400 text-xs leading-none hover:text-yellow-300">★</button>
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-600">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Focal point */}
        {imageItems.length > 0 && (
          <div className="mb-3">
            <FocalPointPicker imageUrl={imageItems[0].url} focalPoint={focalPoint} onChange={setFocalPoint} />
          </div>
        )}

        {/* Folder upload */}
        <div className="border border-border rounded-sm p-3 bg-gray-50">
          <p className="text-xs font-bold text-tx-mid uppercase tracking-wide mb-2">Folder Upload</p>
          <input ref={folderInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFolderSelect}
            // @ts-expect-error webkitdirectory is not in React types
            webkitdirectory="" />
          {!folderName ? (
            <button type="button" onClick={() => folderInputRef.current?.click()}
              className="px-3 py-1.5 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors">
              Select Folder
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-tx">
                <span className="font-medium">{folderName}/</span> — {folderFiles.length} image{folderFiles.length !== 1 ? 's' : ''}
              </p>
              {folderMatch !== undefined && (
                <p className={`text-xs font-medium ${folderMatch ? 'text-teal' : 'text-orange-500'}`}>
                  {folderMatch ? `Will link to: "${folderMatch.name}"` : 'No matching rental found — will upload unlinked'}
                </p>
              )}
              {folderUploading && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-navy h-1.5 rounded-full transition-all" style={{ width: `${folderProgress}%` }} />
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={handleFolderUpload} disabled={folderUploading}
                  className="px-3 py-1.5 bg-navy text-white text-xs rounded-sm hover:bg-navy-light disabled:opacity-50">
                  {folderUploading ? `Uploading… ${folderProgress}%` : 'Upload Folder'}
                </button>
                <button type="button" onClick={clearFolderSelection}
                  className="px-3 py-1.5 border border-border rounded-sm text-xs text-tx-mid hover:bg-sand">
                  Clear
                </button>
              </div>
              {folderError && <p className="text-xs text-red-500">{folderError}</p>}
            </div>
          )}
          {folderSuccess && <p className="mt-2 text-xs text-teal font-medium">{folderSuccess}</p>}
        </div>
      </div>
    </Drawer>
  )
}

// ── Vehicle Type Form ──────────────────────────────────────────────────────────

type VTFormData = {
  name: string; category: string; subcategory: string; description: string
  seats: string; sort_order: string; is_active: boolean
}
const VT_DEFAULTS: VTFormData = {
  name: '', category: 'car', subcategory: '', description: '', seats: '', sort_order: '0', is_active: true,
}

function VehicleTypeForm({ initial, onClose, onSaved }: {
  initial: VehicleType | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<VTFormData>(() => {
    if (!initial) return VT_DEFAULTS
    return {
      name: initial.name, category: initial.category, subcategory: initial.subcategory ?? '',
      description: initial.description ?? '', seats: initial.seats != null ? String(initial.seats) : '',
      sort_order: String(initial.sort_order), is_active: initial.is_active,
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof VTFormData>(k: K, v: VTFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name, category: form.category,
      subcategory: form.subcategory || null, description: form.description || null,
      seats: form.seats ? Number(form.seats) : null,
      sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
    }
    const url = initial ? `/api/admin/vehicle-types/${initial.id}` : '/api/admin/vehicle-types'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Vehicle Type' : 'Add Vehicle Type'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Category</label>
        <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
          {VEHICLE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Subcategory</label>
        <input className={INPUT} value={form.subcategory} onChange={e => set('subcategory', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea className={INPUT} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Seats</label>
          <input className={INPUT} type="number" min="0" value={form.seats} onChange={e => set('seats', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Sort Order</label>
          <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Active</span>
        <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
      </div>
    </Drawer>
  )
}

// ── Extra Form ─────────────────────────────────────────────────────────────────

type ExtraFormData = {
  name: string; description: string; category: string
  pricingMode: 'day' | 'unit'; price_per_day: string; price_per_unit: string
  unit_label: string; is_active: boolean; sort_order: string
  image: string
}
const EXTRA_DEFAULTS: ExtraFormData = {
  name: '', description: '', category: 'beach',
  pricingMode: 'day', price_per_day: '', price_per_unit: '', unit_label: 'item',
  is_active: true, sort_order: '0',
  image: '',
}

function ExtraForm({ initial, onClose, onSaved }: {
  initial: RentalExtra | null; onClose: () => void; onSaved: () => void
}) {
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
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof ExtraFormData>(k: K, v: ExtraFormData[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true); setImageError('')
    const extraSlug = slugify(form.name || 'extra')
    const fd = new globalThis.FormData()
    fd.append('file', file)
    fd.append('bucket', 'rental-images')
    fd.append('slug', `extras/${extraSlug}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (json.url) set('image', json.url)
    else setImageError(json.error ?? 'Upload failed')
    setImageUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
    }
    const url = initial ? `/api/admin/extras/${initial.id}` : '/api/admin/extras'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Extra' : 'Add Extra'} onClose={onClose} onSave={handleSave} saving={saving}>
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
        <label className={LABEL}>Image</label>
        {form.image && (
          <div className="mb-2 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image} alt="" className="w-32 h-24 object-cover rounded-sm border border-border" />
            <button type="button" onClick={() => set('image', '')} className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-600">×</button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
          className="px-3 py-1.5 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
          {imageUploading ? 'Uploading…' : form.image ? 'Replace Image' : '+ Upload Image'}
        </button>
        {imageError && <p className="mt-1 text-xs text-red-500">{imageError}</p>}
      </div>
      <div>
        <label className={LABEL}>Category</label>
        <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
          {EXTRA_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
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
    </Drawer>
  )
}

// ── Rental Image Manager ───────────────────────────────────────────────────────

function RentalImageManager() {
  const [folders, setFolders] = useState<RentalImageFolder[]>([])
  const [rentals, setRentals] = useState<RentalSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/rental-images')
    if (!res.ok) { setError('Failed to load'); setLoading(false); return }
    const data = await res.json()
    setFolders(data.folders ?? [])
    setRentals(data.rentals ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function getLinkedRental(folderName: string): RentalSummary | undefined {
    return rentals.find(r => r.slug === folderName)
  }

  async function handleDeleteImage(path: string, folderName: string) {
    if (!confirm(`Delete image "${path.split('/').pop()}"?`)) return
    const res = await fetch('/api/admin/rental-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    if (!res.ok) { alert('Failed to delete image'); return }
    const rental = getLinkedRental(folderName)
    if (rental) {
      const publicUrlPrefix = path
      const updatedImages = (rental.images ?? []).filter(url => !url.includes(publicUrlPrefix.split('/').pop()!))
      await fetch(`/api/admin/rentals/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedImages }),
      })
    }
    fetchData()
  }

  async function handleDeleteFolder(folderName: string) {
    if (!confirm(`Delete all images in folder "${folderName}"?`)) return
    const res = await fetch('/api/admin/rental-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: folderName }),
    })
    if (!res.ok) { alert('Failed to delete folder'); return }
    const rental = getLinkedRental(folderName)
    if (rental) {
      await fetch(`/api/admin/rentals/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [] }),
      })
    }
    fetchData()
  }

  if (loading) return <p className="text-tx-mid text-sm">Loading images…</p>
  if (error) return <p className="text-red-500 text-sm">{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-navy">Rental Images</h2>
        <button onClick={fetchData} className="px-3 py-1.5 border border-border rounded-sm text-xs text-tx-mid hover:bg-sand">Refresh</button>
      </div>
      {folders.length === 0 && (
        <p className="text-tx-mid text-sm py-8 text-center">No images uploaded yet</p>
      )}
      <div className="space-y-6">
        {folders.map(folder => {
          const rental = getLinkedRental(folder.name)
          const isLinked = !!rental
          return (
            <div key={folder.name} className="bg-white border border-border rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tx text-sm">📁 {folder.name}</span>
                  {isLinked
                    ? <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[10px] font-bold uppercase rounded">Linked: {rental.name}</span>
                    : <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded">Unlinked</span>
                  }
                </div>
                <button onClick={() => handleDeleteFolder(folder.name)}
                  className="text-xs text-red-500 hover:text-red-700 underline">Delete Folder</button>
              </div>
              {folder.urls.length === 0 ? (
                <p className="text-xs text-tx-mid">Empty folder</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {folder.urls.map((url, i) => {
                    const fileName = folder.fileNames[i]
                    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
                    const isSupported = SUPPORTED_EXTS.has(ext)
                    return (
                      <div key={url} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={fileName} className="w-28 h-20 object-cover rounded-sm border border-border" />
                        <span className={`absolute top-0.5 left-0.5 px-1 py-0.5 text-[9px] font-bold uppercase rounded ${isSupported ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {ext}
                        </span>
                        <button onClick={() => handleDeleteImage(folder.storagePaths[i], folder.name)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full items-center justify-center hidden group-hover:flex hover:bg-red-600">×</button>
                        <p className="mt-1 text-[10px] text-tx-mid truncate w-28">{fileName}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Section ───────────────────────────────────────────────────────────────

export function RentalsSection() {
  const [tab, setTab] = useState(0)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [extras, setExtras] = useState<RentalExtra[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [rentalForm, setRentalForm] = useState<Rental | null | 'new'>(null)
  const [vtForm, setVtForm] = useState<VehicleType | null | 'new'>(null)
  const [extraForm, setExtraForm] = useState<RentalExtra | null | 'new'>(null)

  // Extras filter
  const [extraFilter, setExtraFilter] = useState('All')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, vt, ex, pr] = await Promise.all([
      fetch('/api/admin/rentals').then(r => r.json()),
      fetch('/api/admin/vehicle-types?exclude=transfer').then(r => r.json()),
      fetch('/api/admin/extras').then(r => r.json()),
      fetch('/api/admin/providers').then(r => r.json()),
    ])
    setRentals(Array.isArray(r) ? r : [])
    setVehicleTypes(Array.isArray(vt) ? vt : [])
    setExtras(Array.isArray(ex) ? ex : [])
    setProviders(Array.isArray(pr) ? pr : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleToggleRental(rental: Rental, field: 'is_active' | 'is_featured') {
    await fetch(`/api/admin/rentals/${rental.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !rental[field] }),
    })
    fetchAll()
  }

  async function handleDeleteRental(id: string) {
    if (!confirm('Delete this vehicle rental?')) return
    await fetch(`/api/admin/rentals/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleToggleVT(vt: VehicleType) {
    await fetch(`/api/admin/vehicle-types/${vt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !vt.is_active }),
    })
    fetchAll()
  }

  async function handleDeleteVT(id: string) {
    if (!confirm('Delete this vehicle type?')) return
    await fetch(`/api/admin/vehicle-types/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleToggleExtra(extra: RentalExtra) {
    await fetch(`/api/admin/extras/${extra.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !extra.is_active }),
    })
    fetchAll()
  }

  async function handleDeleteExtra(id: string) {
    if (!confirm('Delete this extra?')) return
    await fetch(`/api/admin/extras/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  function vtName(id: string | null) {
    if (!id) return '—'
    return vehicleTypes.find(vt => vt.id === id)?.name ?? '—'
  }

  const filteredExtras = extraFilter === 'All'
    ? extras
    : extras.filter(e => e.category === extraFilter.toLowerCase())

  return (
    <div>
      <div className="flex border-b border-border mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === i ? 'border-navy text-navy' : 'border-transparent text-tx-mid hover:text-tx'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-tx-mid text-sm">Loading…</p>}

      {/* ── Tab 0: Vehicles ── */}
      {!loading && tab === 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Vehicles</h2>
            <button onClick={() => setRentalForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Vehicle</button>
          </div>
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price/day</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Region</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Photos</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Featured</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rentals.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-tx-mid">No vehicles yet</td></tr>
                )}
                {rentals.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-tx">{r.name}</td>
                    <td className="px-4 py-3 text-tx-mid">{vtName(r.vehicle_type_id)}</td>
                    <td className="px-4 py-3 text-tx-mid">{r.price_per_day != null ? `€${r.price_per_day}` : '—'}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{r.region}</td>
                    <td className="px-4 py-3 text-center">
                      {(r.images?.length ?? 0) > 0
                        ? <span className="text-teal text-xs font-medium">📷 {r.images!.length}</span>
                        : <span className="text-[10px] text-red-400 font-medium bg-red-50 px-1.5 py-0.5 rounded">No photos</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={r.is_featured} onChange={() => handleToggleRental(r, 'is_featured')} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={r.is_active} onChange={() => handleToggleRental(r, 'is_active')} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setRentalForm(r)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                        <button onClick={() => handleDeleteRental(r.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 1: Vehicle Types ── */}
      {!loading && tab === 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Vehicle Types</h2>
            <button onClick={() => setVtForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Type</button>
          </div>
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Subcategory</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Seats</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Sort</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No vehicle types yet</td></tr>
                )}
                {vehicleTypes.map(vt => (
                  <tr key={vt.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-tx">{vt.name}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{vt.category}</td>
                    <td className="px-4 py-3 text-tx-mid">{vt.subcategory ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{vt.seats ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{vt.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={vt.is_active} onChange={() => handleToggleVT(vt)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setVtForm(vt)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                        <button onClick={() => handleDeleteVT(vt.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Extras ── */}
      {!loading && tab === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Extras &amp; Essentials</h2>
            <button onClick={() => setExtraForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
          </div>
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {['All', ...EXTRA_CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))].map(c => (
              <button key={c} onClick={() => setExtraFilter(c)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${extraFilter === c ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border hover:border-navy hover:text-navy'}`}>
                {c}
              </button>
            ))}
          </div>
          {filteredExtras.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No extras found</p>}
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
                  {extra.price_per_day != null
                    ? `€${extra.price_per_day} / day`
                    : extra.price_per_unit != null
                    ? `€${extra.price_per_unit} / ${extra.unit_label}`
                    : 'No price set'}
                </p>
                <p className={`text-xs font-medium ${extra.is_active ? 'text-teal' : 'text-gray-400'}`}>
                  {extra.is_active ? 'Active' : 'Inactive'}
                </p>
                <div className="flex gap-2 mt-auto pt-1">
                  <button onClick={() => setExtraForm(extra)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                  <button onClick={() => handleDeleteExtra(extra.id)} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 3: Images ── */}
      {!loading && tab === 3 && <RentalImageManager />}

      {/* ── Drawers ── */}
      {rentalForm !== null && (
        <VehicleForm
          initial={rentalForm === 'new' ? null : rentalForm}
          vehicleTypes={vehicleTypes}
          providers={providers}
          onClose={() => setRentalForm(null)}
          onSaved={() => { setRentalForm(null); fetchAll() }}
        />
      )}
      {vtForm !== null && (
        <VehicleTypeForm
          initial={vtForm === 'new' ? null : vtForm}
          onClose={() => setVtForm(null)}
          onSaved={() => { setVtForm(null); fetchAll() }}
        />
      )}
      {extraForm !== null && (
        <ExtraForm
          initial={extraForm === 'new' ? null : extraForm}
          onClose={() => setExtraForm(null)}
          onSaved={() => { setExtraForm(null); fetchAll() }}
        />
      )}
    </div>
  )
}
