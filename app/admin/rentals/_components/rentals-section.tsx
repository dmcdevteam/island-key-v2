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

const TABS = ['Vehicles', 'Vehicle Types', 'Extras & Essentials', 'Images', 'Car Listings', 'Car Extras', 'Car Enquiries', 'Category Images', 'Pickup Locations', 'Ports', 'Bike Extras']

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
  name: string; description: string
  price_per_day: string; price_per_week: string
  type: string; seats: string; doors: string
  transmission: string; fuel_type: string
  ac: boolean; zero_deposit: boolean; deposit_amount: string
  insurance_included: boolean; region: string
  features: string[]
  is_featured: boolean; is_active: boolean; sort_order: string
  images: string[]
}

const RENTAL_DEFAULTS: RentalFormData = {
  name: '', description: '',
  price_per_day: '', price_per_week: '',
  type: 'car', seats: '', doors: '',
  transmission: '', fuel_type: '',
  ac: true, zero_deposit: false, deposit_amount: '',
  insurance_included: true, region: 'chania',
  features: [],
  is_featured: false, is_active: true, sort_order: '0',
  images: [],
}

function VehicleForm({
  initial, onClose, onSaved,
}: {
  initial: Rental | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<RentalFormData>(() => {
    if (!initial) return RENTAL_DEFAULTS
    return {
      name: initial.name,
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      type: (initial as any).type ?? 'car',
      seats: (initial as any).seats != null ? String((initial as any).seats) : '',
      doors: (initial as any).doors != null ? String((initial as any).doors) : '',
      transmission: (initial as any).transmission ?? '',
      fuel_type: (initial as any).fuel_type ?? '',
      ac: (initial as any).ac ?? true,
      zero_deposit: (initial as any).zero_deposit ?? false,
      deposit_amount: (initial as any).deposit_amount != null ? String((initial as any).deposit_amount) : '',
      insurance_included: initial.insurance_included,
      region: initial.region,
      features: initial.features ?? [],
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
    const slug = slugify(form.name) || 'rental'
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
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      type: form.type,
      seats: form.seats ? Number(form.seats) : null,
      doors: form.doors ? Number(form.doors) : null,
      transmission: form.transmission || null,
      fuel_type: form.fuel_type || null,
      ac: form.ac,
      zero_deposit: form.zero_deposit,
      deposit_amount: !form.zero_deposit && form.deposit_amount ? Number(form.deposit_amount) : null,
      insurance_included: form.insurance_included,
      region: form.region,
      features: form.features.length ? form.features : null,
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
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} />
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
      <div>
        <label className={LABEL}>Type *</label>
        <select className={SELECT} value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="car">Car</option>
          <option value="atv_motorbike">ATV / Motorbikes / Scooters</option>
          <option value="bike_ebike">Bike &amp; E-Bike</option>
          <option value="boat">Boat</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Seats</label>
          <input className={INPUT} type="number" min="1" max="9" value={form.seats} onChange={e => set('seats', e.target.value)} placeholder="e.g. 5" />
        </div>
        <div>
          <label className={LABEL}>Doors</label>
          <input className={INPUT} type="number" min="2" max="5" value={form.doors} onChange={e => set('doors', e.target.value)} placeholder="e.g. 4" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Transmission</label>
          <select className={SELECT} value={form.transmission} onChange={e => set('transmission', e.target.value)}>
            <option value="">— Optional —</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Fuel Type</label>
          <select className={SELECT} value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}>
            <option value="">— Optional —</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>A/C Included</span>
        <Toggle checked={form.ac} onChange={() => set('ac', !form.ac)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Zero Deposit</span>
        <Toggle checked={form.zero_deposit} onChange={() => set('zero_deposit', !form.zero_deposit)} />
      </div>
      {!form.zero_deposit && (
        <div>
          <label className={LABEL}>Deposit Amount (€)</label>
          <input className={INPUT} type="number" min="0" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Included</span>
        <Toggle checked={form.insurance_included} onChange={() => set('insurance_included', !form.insurance_included)} />
      </div>
      <div>
        <label className={LABEL}>Region</label>
        <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
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
  // Vacation Essentials product fields
  full_description: string
  usage_instructions: string
  price_3day: string
  price_week: string
  custom_pricing_note: string
  external_links: { label: string; url: string }[]
  images: string[]
  image_wide: string
  image_square: string
}
const EXTRA_DEFAULTS: ExtraFormData = {
  name: '', description: '', category: 'beach',
  pricingMode: 'day', price_per_day: '', price_per_unit: '', unit_label: 'item',
  is_active: true, sort_order: '0',
  image: '',
  full_description: '', usage_instructions: '',
  price_3day: '', price_week: '',
  custom_pricing_note: 'Contact us for longer durations',
  external_links: [], images: [], image_wide: '', image_square: '',
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
      full_description: (initial as any).full_description ?? '',
      usage_instructions: (initial as any).usage_instructions ?? '',
      price_3day: (initial as any).price_3day != null ? String((initial as any).price_3day) : '',
      price_week: (initial as any).price_week != null ? String((initial as any).price_week) : '',
      custom_pricing_note: (initial as any).custom_pricing_note ?? 'Contact us for longer durations',
      external_links: (initial as any).external_links ?? [],
      images: (initial as any).images ?? [],
      image_wide: (initial as any).image_wide ?? '',
      image_square: (initial as any).image_square ?? '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wideImgRef = useRef<HTMLInputElement>(null)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

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
      full_description: form.full_description || null,
      usage_instructions: form.usage_instructions || null,
      price_3day: form.price_3day ? Number(form.price_3day) : null,
      price_week: form.price_week ? Number(form.price_week) : null,
      custom_pricing_note: form.custom_pricing_note || null,
      external_links: form.external_links,
      images: form.images.length ? form.images : null,
      image_wide: form.image_wide || null,
      image_square: form.image_square || null,
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

      {/* ─ Vacation Essentials product fields ─ */}
      <div className="border-t border-border pt-4 space-y-4">
        <p className="text-[11px] font-bold text-tx-mid uppercase tracking-wide">Vacation Essentials — Product Details</p>

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
            const fd = new globalThis.FormData()
            fd.append('file', file)
            fd.append('bucket', 'rental-images')
            fd.append('slug', `essentials/${slugify(form.name || 'extra')}-wide`)
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
            const json = await res.json()
            if (json.url) set('image_wide', json.url)
            setImageUploading(false)
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

// ── Car Listing Form ───────────────────────────────────────────────────────────

const VEHICLE_CLASS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  car: [
    { value: 'small',       label: 'Small Car' },
    { value: 'medium',      label: 'Medium Car' },
    { value: 'compact',     label: 'Compact Car' },
    { value: 'suv',         label: 'SUV' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'van',         label: 'Van' },
    { value: 'luxury',      label: 'Luxury' },
    { value: 'offroad',     label: '4×4 Off-Road' },
  ],
  atv_motorbike: [
    { value: 'atv',       label: 'ATV / Quad' },
    { value: 'motorbike', label: 'Motorbike' },
    { value: 'scooter',   label: 'Scooter' },
    { value: 'buggy',     label: 'Buggy' },
  ],
  bike_ebike: [
    { value: 'city_bike',     label: 'City Bike' },
    { value: 'ebike',         label: 'E-Bike' },
    { value: 'mountain_bike', label: 'Mountain Bike' },
  ],
}
const TRANSMISSIONS = ['manual', 'automatic']
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid']

type CarListingFormData = {
  name: string; type: string; car_class: string; description: string
  price_per_day: string; price_per_week: string
  seats: string; doors: string; transmission: string; fuel_type: string
  ac: boolean; zero_deposit: boolean; deposit_amount: string; insurance_included: boolean
  feat_free_driver: boolean; feat_free_cancellation: boolean; feat_roadside_assistance: boolean
  feat_no_hidden_charges: boolean; feat_unlimited_km: boolean
  image_wide: string; image_square: string; images: string[]
  is_active: boolean; is_featured: boolean; sort_order: string; region: string
  // Bike-specific
  rider_height: string; max_speed: string; motor_power: string
  autonomy: string; gears: string; delivery_area: string; availability_note: string
  bike_includes: string[]
  day_discount_4: string; day_discount_5: string
  day_discount_6: string; day_discount_7plus: string
  bike_tcs: string
}

const BIKE_INCLUDES_DEFAULT = ['Helmet', 'Pump', 'Lock', 'Bottle holder', 'Repair set']

const CAR_LISTING_DEFAULTS: CarListingFormData = {
  name: '', type: 'car', car_class: '', description: '',
  price_per_day: '', price_per_week: '',
  seats: '', doors: '', transmission: 'manual', fuel_type: 'petrol',
  ac: true, zero_deposit: false, deposit_amount: '', insurance_included: true,
  feat_free_driver: false, feat_free_cancellation: false, feat_roadside_assistance: false,
  feat_no_hidden_charges: true, feat_unlimited_km: false,
  image_wide: '', image_square: '', images: [],
  is_active: true, is_featured: false, sort_order: '0', region: 'chania',
  rider_height: '', max_speed: '', motor_power: '', autonomy: '', gears: '',
  delivery_area: '', availability_note: '',
  bike_includes: BIKE_INCLUDES_DEFAULT,
  day_discount_4: '', day_discount_5: '', day_discount_6: '', day_discount_7plus: '',
  bike_tcs: '',
}

function CarListingForm({ initial, onClose, onSaved }: {
  initial: any | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<CarListingFormData>(() => {
    if (!initial) return CAR_LISTING_DEFAULTS
    const f = initial.features ?? {}
    return {
      name: initial.name ?? '',
      type: initial.type ?? 'car',
      car_class: initial.car_class ?? '',
      description: initial.description ?? '',
      price_per_day: initial.price_per_day != null ? String(initial.price_per_day) : '',
      price_per_week: initial.price_per_week != null ? String(initial.price_per_week) : '',
      seats: initial.seats != null ? String(initial.seats) : '',
      doors: initial.doors != null ? String(initial.doors) : '',
      transmission: initial.transmission ?? 'manual',
      fuel_type: initial.fuel_type ?? 'petrol',
      ac: !!initial.ac,
      zero_deposit: !!initial.zero_deposit,
      deposit_amount: initial.deposit_amount != null ? String(initial.deposit_amount) : '',
      insurance_included: !!initial.insurance_included,
      feat_free_driver: !!f.free_driver,
      feat_free_cancellation: !!f.free_cancellation,
      feat_roadside_assistance: !!f.roadside_assistance,
      feat_no_hidden_charges: !!f.no_hidden_charges,
      feat_unlimited_km: !!f.unlimited_km,
      image_wide: initial.image_wide ?? '',
      image_square: initial.image_square ?? '',
      images: initial.images ?? [],
      is_active: !!initial.is_active,
      is_featured: !!initial.is_featured,
      sort_order: String(initial.sort_order ?? 0),
      region: initial.region ?? 'chania',
      rider_height: initial.rider_height ?? '',
      max_speed: initial.max_speed ?? '',
      motor_power: initial.motor_power ?? '',
      autonomy: initial.autonomy ?? '',
      gears: initial.gears ?? '',
      delivery_area: initial.delivery_area ?? '',
      availability_note: initial.availability_note ?? '',
      bike_includes: initial.bike_includes ?? BIKE_INCLUDES_DEFAULT,
      day_discount_4: initial.day_discounts?.['4'] != null ? String(initial.day_discounts['4']) : '',
      day_discount_5: initial.day_discounts?.['5'] != null ? String(initial.day_discounts['5']) : '',
      day_discount_6: initial.day_discounts?.['6'] != null ? String(initial.day_discounts['6']) : '',
      day_discount_7plus: initial.day_discounts?.['7plus'] != null ? String(initial.day_discounts['7plus']) : '',
      bike_tcs: initial.bike_tcs ?? '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const wideRef  = useRef<HTMLInputElement>(null)
  const squareRef = useRef<HTMLInputElement>(null)
  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  // map of pickup_location_id → instructions string
  const [locationInstructions, setLocationInstructions] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetches: Promise<void>[] = [
      fetch('/api/admin/rental-pickup-locations').then(r => r.json()).then(data => {
        setAvailableLocations(Array.isArray(data) ? data : [])
      }),
    ]
    if (initial?.id) {
      fetches.push(
        fetch(`/api/admin/rental-pickup-locations?rental_id=${initial.id}`).then(r => r.json()).then(data => {
          if (Array.isArray(data)) {
            const map: Record<string, string> = {}
            data.forEach((row: any) => { map[row.pickup_location_id] = row.instructions ?? '' })
            setLocationInstructions(map)
          }
        })
      )
    }
    Promise.all(fetches).catch(() => {})
  }, [initial?.id])

  function set<K extends keyof CarListingFormData>(k: K, v: CarListingFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    const fd = new globalThis.FormData()
    fd.append('file', file)
    fd.append('bucket', 'rental-images')
    fd.append('slug', `cars/${folder}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    return json.url ?? null
  }

  async function handleWideSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const url = await uploadImage(file, slugify(form.name || 'car'))
    if (url) set('image_wide', url)
    setUploading(false)
    if (wideRef.current) wideRef.current.value = ''
  }

  async function handleSquareSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const url = await uploadImage(file, slugify(form.name || 'car'))
    if (url) set('image_square', url)
    setUploading(false)
    if (squareRef.current) squareRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name,
      type: form.type,
      car_class: form.car_class || null,
      description: form.description || null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
      seats: form.seats ? Number(form.seats) : null,
      doors: form.doors ? Number(form.doors) : null,
      transmission: form.transmission || null,
      fuel_type: form.fuel_type || null,
      ac: form.ac,
      zero_deposit: form.zero_deposit,
      deposit_amount: !form.zero_deposit && form.deposit_amount ? Number(form.deposit_amount) : null,
      insurance_included: form.insurance_included,
      features: {
        free_driver: form.feat_free_driver,
        free_cancellation: form.feat_free_cancellation,
        roadside_assistance: form.feat_roadside_assistance,
        no_hidden_charges: form.feat_no_hidden_charges,
        unlimited_km: form.feat_unlimited_km,
      },
      image_wide: form.image_wide || null,
      image_square: form.image_square || null,
      images: form.images.length ? form.images : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
      region: form.region,
      ...(form.type === 'bike_ebike' ? {
        rider_height: form.rider_height || null,
        max_speed: form.max_speed || null,
        motor_power: form.motor_power || null,
        autonomy: form.autonomy || null,
        gears: form.gears || null,
        delivery_area: form.delivery_area || null,
        availability_note: form.availability_note || null,
        bike_includes: form.bike_includes.length ? form.bike_includes : null,
        day_discounts: (() => {
          const d: Record<string, number> = {}
          if (form.day_discount_4)    d['4']     = Number(form.day_discount_4)
          if (form.day_discount_5)    d['5']     = Number(form.day_discount_5)
          if (form.day_discount_6)    d['6']     = Number(form.day_discount_6)
          if (form.day_discount_7plus) d['7plus'] = Number(form.day_discount_7plus)
          return Object.keys(d).length ? d : null
        })(),
        bike_tcs: form.bike_tcs || null,
      } : {}),
    }
    const url = initial ? `/api/admin/car-listings/${initial.id}` : '/api/admin/car-listings'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    const saved = await res.json()
    const rentalId = initial?.id ?? saved?.id
    if (rentalId) {
      await fetch('/api/admin/rental-pickup-locations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rental_id: rentalId,
          locations: Object.entries(locationInstructions).map(([id, instructions]) => ({ id, instructions })),
        }),
      })
    }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Car Listing' : 'Add Car Listing'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Toyota Yaris" />
      </div>
      <div>
        <label className={LABEL}>Type *</label>
        <select className={SELECT} value={form.type} onChange={e => { set('type', e.target.value); set('car_class', '') }}>
          <option value="car">Car</option>
          <option value="atv_motorbike">ATV / Motorbikes / Scooters</option>
          <option value="bike_ebike">Bike &amp; E-Bike</option>
          <option value="boat">Boat</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {form.type !== 'boat' && (
          <div>
            <label className={LABEL}>Vehicle Class</label>
            <select className={SELECT} value={form.car_class} onChange={e => set('car_class', e.target.value)}>
              <option value="">— Select —</option>
              {(VEHICLE_CLASS_OPTIONS[form.type] ?? []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        <div className={form.type === 'boat' ? 'col-span-2' : ''}>
          <label className={LABEL}>Region</label>
          <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
            {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Seats</label>
          <input className={INPUT} type="number" min="1" value={form.seats} onChange={e => set('seats', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Doors</label>
          <input className={INPUT} type="number" min="2" value={form.doors} onChange={e => set('doors', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Transmission</label>
          <select className={SELECT} value={form.transmission} onChange={e => set('transmission', e.target.value)}>
            {TRANSMISSIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Fuel Type</label>
          <select className={SELECT} value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}>
            {FUEL_TYPES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Air Conditioning</span>
        <Toggle checked={form.ac} onChange={() => set('ac', !form.ac)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Zero Deposit</span>
        <Toggle checked={form.zero_deposit} onChange={() => set('zero_deposit', !form.zero_deposit)} />
      </div>
      {!form.zero_deposit && (
        <div>
          <label className={LABEL}>Deposit Amount (€)</label>
          <input className={INPUT} type="number" min="0" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Included</span>
        <Toggle checked={form.insurance_included} onChange={() => set('insurance_included', !form.insurance_included)} />
      </div>

      <div>
        <p className={LABEL}>Features</p>
        <div className="space-y-2 mt-1">
          {([
            ['feat_free_driver', 'Free Extra Driver'],
            ['feat_free_cancellation', 'Free Cancellation'],
            ['feat_roadside_assistance', '24h Roadside Assistance'],
            ['feat_no_hidden_charges', 'No Hidden Charges'],
            ['feat_unlimited_km', 'Unlimited Kilometres'],
          ] as [keyof CarListingFormData, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-tx">{label}</span>
              <Toggle checked={!!form[key]} onChange={() => set(key, !form[key] as any)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL}>Wide Image (hero/landscape)</label>
        {form.image_wide && (
          <div className="mb-2 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_wide} alt="" className="w-full h-28 object-cover rounded-sm border border-border" />
            <button type="button" onClick={() => set('image_wide', '')} className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">×</button>
          </div>
        )}
        <input ref={wideRef} type="file" accept="image/*" className="hidden" onChange={handleWideSelect} />
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
        <input ref={squareRef} type="file" accept="image/*" className="hidden" onChange={handleSquareSelect} />
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
      <div>
        <label className={LABEL}>Sort Order</label>
        <input className={INPUT} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
      </div>

      {/* ── Bike-specific fields ── */}
      {form.type === 'bike_ebike' && (
        <>
          <div className="border-t border-border pt-4">
            <p className="font-semibold text-navy text-sm mb-3">Bike Specifications</p>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Rider Height</label>
                <input className={INPUT} value={form.rider_height} onChange={e => set('rider_height', e.target.value)} placeholder="155–195 cm" />
              </div>
              <div>
                <label className={LABEL}>Max Speed</label>
                <input className={INPUT} value={form.max_speed} onChange={e => set('max_speed', e.target.value)} placeholder="25 km/h" />
              </div>
              <div>
                <label className={LABEL}>Motor Power (E-Bikes only)</label>
                <input className={INPUT} value={form.motor_power} onChange={e => set('motor_power', e.target.value)} placeholder="250W" />
              </div>
              <div>
                <label className={LABEL}>Range / Autonomy (E-Bikes only)</label>
                <input className={INPUT} value={form.autonomy} onChange={e => set('autonomy', e.target.value)} placeholder="104 km" />
              </div>
              <div>
                <label className={LABEL}>Gears</label>
                <input className={INPUT} value={form.gears} onChange={e => set('gears', e.target.value)} placeholder="7-speed Shimano" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="font-semibold text-navy text-sm mb-3">Delivery</p>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Delivery Area</label>
                <input className={INPUT} value={form.delivery_area} onChange={e => set('delivery_area', e.target.value)} placeholder="Kolymbari to Platanias" />
              </div>
              <div>
                <label className={LABEL}>Availability Note</label>
                <input className={INPUT} value={form.availability_note} onChange={e => set('availability_note', e.target.value)} placeholder="Limited Availability" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="font-semibold text-navy text-sm mb-2">What's Included</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.bike_includes.map((item, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-sand px-2 py-1 rounded-full text-navy">
                  {item}
                  <button type="button" onClick={() => set('bike_includes', form.bike_includes.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
            <BikeIncludeInput
              onAdd={item => { if (!form.bike_includes.includes(item)) set('bike_includes', [...form.bike_includes, item]) }}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="font-semibold text-navy text-sm mb-1">Day Discounts (from Day 4)</p>
            <p className="text-[11px] text-tx-light mb-3">Set discount % for each rental day beyond 3. Leave blank for no discount.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['day_discount_4', 'Day 4 discount'],
                ['day_discount_5', 'Day 5 discount'],
                ['day_discount_6', 'Day 6 discount'],
                ['day_discount_7plus', 'Day 7+ discount'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className={LABEL}>{label} (%)</label>
                  <input className={INPUT} type="number" min="0" max="100"
                    value={form[key as keyof CarListingFormData] as string}
                    onChange={e => set(key as keyof CarListingFormData, e.target.value as any)}
                    placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className={LABEL}>Terms & Conditions</label>
            <p className="text-[11px] text-tx-light mb-1">Leave blank to use default T&Cs</p>
            <textarea className={INPUT} rows={5} value={form.bike_tcs} onChange={e => set('bike_tcs', e.target.value)} placeholder="Leave blank to use default T&Cs" />
          </div>
        </>
      )}

      {availableLocations.length > 0 && (
        <div>
          <p className={LABEL}>Pickup Locations</p>
          <p className="text-[11px] text-tx-light mb-2">Select which locations this vehicle can be picked up from</p>
          <div className="space-y-3">
            {availableLocations.map(loc => {
              const checked = loc.id in locationInstructions
              return (
                <div key={loc.id}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setLocationInstructions(prev => {
                          if (checked) {
                            const next = { ...prev }
                            delete next[loc.id]
                            return next
                          }
                          return { ...prev, [loc.id]: '' }
                        })
                      }}
                      className="w-4 h-4 accent-navy"
                    />
                    <span className="text-sm text-tx font-medium">{loc.name}</span>
                    {loc.address && <span className="text-[11px] text-tx-light truncate">— {loc.address}</span>}
                  </label>
                  {checked && (
                    <input
                      className={INPUT + ' mt-1.5 ml-6'}
                      placeholder="Pickup instructions (optional)"
                      value={locationInstructions[loc.id] ?? ''}
                      onChange={e => setLocationInstructions(prev => ({ ...prev, [loc.id]: e.target.value }))}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Drawer>
  )
}

// ── Car Extra Form ─────────────────────────────────────────────────────────────

type CarExtraFormData = {
  name: string; description: string; price: string
  price_type: 'per_day' | 'per_rental'
  is_insurance: boolean; insurance_description: string
  is_free: boolean
  is_active: boolean; sort_order: string
}

const CAR_EXTRA_DEFAULTS: CarExtraFormData = {
  name: '', description: '', price: '', price_type: 'per_rental',
  is_insurance: false, insurance_description: '',
  is_free: false,
  is_active: true, sort_order: '0',
}

function CarExtraForm({ initial, onClose, onSaved }: {
  initial: any | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<CarExtraFormData>(() => {
    if (!initial) return CAR_EXTRA_DEFAULTS
    return {
      name: initial.name ?? '',
      description: initial.description ?? '',
      price: initial.price != null ? String(initial.price) : '',
      price_type: initial.price_type ?? 'per_rental',
      is_insurance: !!initial.is_insurance,
      insurance_description: initial.insurance_description ?? '',
      is_free: !!initial.is_free,
      is_active: !!initial.is_active,
      sort_order: String(initial.sort_order ?? 0),
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof CarExtraFormData>(k: K, v: CarExtraFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setSaving(true); setError('')
    const body = {
      name: form.name,
      description: form.description || null,
      price: form.price ? Number(form.price) : 0,
      price_type: form.price_type,
      is_insurance: form.is_insurance,
      insurance_description: form.is_insurance ? (form.insurance_description || null) : null,
      is_free: form.is_free,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    }
    const url = initial ? `/api/admin/car-extras/${initial.id}` : '/api/admin/car-extras'
    const method = initial ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error saving'); setSaving(false); return }
    onSaved()
  }

  return (
    <Drawer title={initial ? 'Edit Car Extra' : 'Add Car Extra'} onClose={onClose} onSave={handleSave} saving={saving}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className={LABEL}>Name</label>
        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. GPS Navigator" />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea className={INPUT} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Offered Free of Charge</span>
        <Toggle checked={form.is_free} onChange={() => set('is_free', !form.is_free)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Price (€){form.is_free && <span className="ml-1 font-normal normal-case text-tx-light">(optional when free)</span>}</label>
          <input className={`${INPUT} ${form.is_free ? 'opacity-50' : ''}`} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Price Type</label>
          <select className={SELECT} value={form.price_type} onChange={e => set('price_type', e.target.value as 'per_day' | 'per_rental')}>
            <option value="per_day">Per Day</option>
            <option value="per_rental">Per Rental</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Insurance Upgrade</span>
        <Toggle checked={form.is_insurance} onChange={() => set('is_insurance', !form.is_insurance)} />
      </div>
      {form.is_insurance && (
        <div>
          <label className={LABEL}>Insurance Description</label>
          <textarea className={INPUT} rows={3} value={form.insurance_description}
            onChange={e => set('insurance_description', e.target.value)}
            placeholder="Full coverage with zero excess…" />
        </div>
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

// ── Pickup Locations Tab ────────────────────────────────────────────────────

// ── BikeIncludeInput ────────────────────────────────────────────────────────

function BikeIncludeInput({ onAdd }: { onAdd: (item: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex gap-2">
      <input
        className={INPUT}
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Add item (e.g. Repair set)"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) { onAdd(val.trim()); setVal('') } } }}
      />
      <button type="button"
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal('') } }}
        className="px-3 py-2 bg-navy text-white text-xs font-semibold rounded-sm whitespace-nowrap">
        Add
      </button>
    </div>
  )
}

// ── BikeExtrasTab ────────────────────────────────────────────────────────────

function BikeExtrasTab({ extras, onSaved }: { extras: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', price: '', sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  function openNew()     { setForm(EMPTY); setEditing('new') }
  function openEdit(e: any) {
    setForm({ name: e.name, price: e.price != null ? String(e.price) : '', sort_order: String(e.sort_order), is_active: e.is_active })
    setEditing(e)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, price: form.price ? Number(form.price) : null, sort_order: Number(form.sort_order) }
    if (editing === 'new') {
      await fetch('/api/admin/bike-extras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`/api/admin/bike-extras/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setEditing(null); onSaved()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bike extra?')) return
    await fetch(`/api/admin/bike-extras/${id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">Bike Extras</h2>
        <button onClick={openNew} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
      </div>

      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Name</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Price</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Sort</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {extras.map(extra => (
              <tr key={extra.id} className="hover:bg-sand/30">
                <td className="px-4 py-3 font-medium text-navy">{extra.name}</td>
                <td className="px-4 py-3 text-tx-mid">{extra.price != null ? `€${Number(extra.price).toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3 text-tx-mid">{extra.sort_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={extra.is_active} onChange={async () => {
                    await fetch(`/api/admin/bike-extras/${extra.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !extra.is_active }) })
                    onSaved()
                  }} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(extra)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(extra.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {extras.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tx-light text-sm">No bike extras yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <Drawer title={editing === 'new' ? 'Add Bike Extra' : 'Edit Bike Extra'} onClose={() => setEditing(null)} onSave={handleSave} saving={saving}>
          <div>
            <label className={LABEL}>Name *</label>
            <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Speedometer" />
          </div>
          <div>
            <label className={LABEL}>Price (€)</label>
            <input className={INPUT} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="3.00" />
          </div>
          <div>
            <label className={LABEL}>Sort Order</label>
            <input className={INPUT} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
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

// ── Pickup Locations Tab ─────────────────────────────────────────────────────

function PickupLocationsTab({ locations, onSaved }: { locations: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', city: 'Chania', address: '', google_maps_url: '', vehicle_categories: ['car', 'atv_motorbike'], sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

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
    const payload = {
      ...form,
      sort_order: Number(form.sort_order),
      google_maps_url: form.google_maps_url || null,
    }
    if (editing === 'new') {
      await fetch('/api/admin/rental-pickup-locations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    } else {
      await fetch(`/api/admin/rental-pickup-locations/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setEditing(null)
    onSaved()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pickup location?')) return
    await fetch(`/api/admin/rental-pickup-locations/${id}`, { method: 'DELETE' })
    onSaved()
  }

  const VEHICLE_CATS = ['car', 'atv_motorbike', 'bike_ebike', 'boat']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">Pickup Locations</h2>
        <button onClick={openNew} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">
          + Add Location
        </button>
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
                    await fetch(`/api/admin/rental-pickup-locations/${loc.id}`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ is_active: !loc.is_active }),
                    })
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
        <Drawer
          title={editing === 'new' ? 'Add Pickup Location' : 'Edit Pickup Location'}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        >
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
            <label className={LABEL}>Address (paste from Google Maps)</label>
            <input
              className={INPUT}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="e.g. Chania International Airport, Souda 73200, Greece"
            />
          </div>
          {form.address && MAPS_KEY && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(form.address)}&zoom=14&size=600x200&markers=${encodeURIComponent(form.address)}&key=${MAPS_KEY}`}
                alt="Map preview"
                className="w-full rounded-sm border border-border"
              />
            </div>
          )}
          <div>
            <label className={LABEL}>Google Maps link (optional)</label>
            <input
              className={INPUT}
              value={form.google_maps_url}
              onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))}
              placeholder="Paste a Google Maps share link"
            />
            <p className="text-[11px] text-tx-light mt-1">Open Google Maps → share → copy link</p>
          </div>

          <div>
            <label className={LABEL}>Vehicle Categories</label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CATS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const cats = form.vehicle_categories.includes(cat)
                      ? form.vehicle_categories.filter(c => c !== cat)
                      : [...form.vehicle_categories, cat]
                    setForm(f => ({ ...f, vehicle_categories: cats }))
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    form.vehicle_categories.includes(cat)
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-tx-mid border-border hover:border-navy'
                  }`}
                >{cat}</button>
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

// ── Ports Tab ───────────────────────────────────────────────────────────────

function PortsTab({ ports, onSaved }: { ports: any[]; onSaved: () => void }) {
  const EMPTY = { name: '', area: 'Chania', address: '', sort_order: '0', is_active: true }
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(EMPTY); setEditing('new') }
  function openEdit(port: any) {
    setForm({
      name: port.name, area: port.area ?? 'Chania', address: port.address ?? '',
      sort_order: String(port.sort_order), is_active: port.is_active,
    })
    setEditing(port)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, sort_order: Number(form.sort_order) }
    if (editing === 'new') {
      await fetch('/api/admin/rental-ports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    } else {
      await fetch(`/api/admin/rental-ports/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setEditing(null)
    onSaved()
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
        <button onClick={openNew} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">
          + Add Port
        </button>
      </div>

      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Name</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Area</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Address</th>
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
                <td className="px-4 py-3 text-tx-mid">{port.sort_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={port.is_active} onChange={async () => {
                    await fetch(`/api/admin/rental-ports/${port.id}`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ is_active: !port.is_active }),
                    })
                    onSaved()
                  }} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(port)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(port.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {ports.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-tx-light text-sm">No ports yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <Drawer
          title={editing === 'new' ? 'Add Port' : 'Edit Port'}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        >
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

// ── Main Section ────────────────────────────────────────────────────────────

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

  // Car listings / extras / enquiries
  const [carListings,  setCarListings]  = useState<any[]>([])
  const [carExtras,    setCarExtras]    = useState<any[]>([])
  const [carEnquiries, setCarEnquiries] = useState<any[]>([])
  const [carListingForm,  setCarListingForm]  = useState<any | null | 'new'>(null)
  const [carExtraForm,    setCarExtraForm]    = useState<any | null | 'new'>(null)
  const [carEnquiryExpand, setCarEnquiryExpand] = useState<string | null>(null)
  const [carToast, setCarToast] = useState('')

  // Category images
  const [categoryImages, setCategoryImages] = useState<any[]>([])
  const [catUploading, setCatUploading] = useState<string | null>(null)
  const [essentialsCatData, setEssentialsCatData] = useState<any[]>([])
  const [essentialsCatUploading, setEssentialsCatUploading] = useState<string | null>(null)

  // Pickup locations, ports, bike extras
  const [pickupLocations, setPickupLocations] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [bikeExtras, setBikeExtras] = useState<any[]>([])

  function showCarToast(msg: string) { setCarToast(msg); setTimeout(() => setCarToast(''), 3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, vt, ex, pr, cl, ce, enq, ci, ec, pl, po, be] = await Promise.all([
      fetch('/api/admin/rentals').then(r => r.json()),
      fetch('/api/admin/vehicle-types?exclude=transfer').then(r => r.json()),
      fetch('/api/admin/extras').then(r => r.json()),
      fetch('/api/admin/providers').then(r => r.json()),
      fetch('/api/admin/car-listings').then(r => r.json()),
      fetch('/api/admin/car-extras').then(r => r.json()),
      fetch('/api/admin/bookings?item_type=rental').then(r => r.json()),
      fetch('/api/admin/rental-category-images').then(r => r.json()),
      fetch('/api/rentals/essentials-categories').then(r => r.json()),
      fetch('/api/admin/rental-pickup-locations').then(r => r.json()),
      fetch('/api/admin/rental-ports').then(r => r.json()),
      fetch('/api/admin/bike-extras').then(r => r.json()),
    ])
    setRentals(Array.isArray(r) ? r : [])
    setVehicleTypes(Array.isArray(vt) ? vt : [])
    setExtras(Array.isArray(ex) ? ex : [])
    setProviders(Array.isArray(pr) ? pr : [])
    setCarListings(Array.isArray(cl) ? cl : [])
    setCarExtras(Array.isArray(ce) ? ce : [])
    setCarEnquiries(Array.isArray(enq) ? enq : [])
    setCategoryImages(Array.isArray(ci) ? ci : [])
    setEssentialsCatData(Array.isArray(ec?.categories) ? ec.categories : [])
    setPickupLocations(Array.isArray(pl) ? pl : [])
    setPorts(Array.isArray(po) ? po : [])
    setBikeExtras(Array.isArray(be) ? be : Array.isArray(be?.extras) ? be.extras : [])
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

      {/* ── Tab 4: Car Listings ── */}
      {!loading && tab === 4 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Car Listings</h2>
            <button onClick={() => setCarListingForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Car</button>
          </div>
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Class</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price/day</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Region</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Featured</th>
                  <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {carListings.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No car listings yet</td></tr>
                )}
                {carListings.map((car: any) => (
                  <tr key={car.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-tx">{car.name}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{car.car_class ?? '—'}</td>
                    <td className="px-4 py-3 text-tx-mid">{car.price_per_day != null ? `€${car.price_per_day}` : '—'}</td>
                    <td className="px-4 py-3 text-tx-mid capitalize">{car.region}</td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={!!car.is_featured} onChange={async () => {
                        await fetch(`/api/admin/car-listings/${car.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !car.is_featured }) })
                        fetchAll()
                      }} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={!!car.is_active} onChange={async () => {
                        await fetch(`/api/admin/car-listings/${car.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !car.is_active }) })
                        fetchAll()
                      }} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setCarListingForm(car)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this car listing?')) return
                          await fetch(`/api/admin/car-listings/${car.id}`, { method: 'DELETE' })
                          fetchAll()
                        }} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 5: Car Extras ── */}
      {!loading && tab === 5 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Car Extras</h2>
            <button onClick={() => setCarExtraForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Extra</button>
          </div>
          {carExtras.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No car extras yet</p>}
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            {carExtras.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Price</th>
                    <th className="text-left px-4 py-2.5 font-medium text-tx-mid">Type</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Insurance</th>
                    <th className="text-center px-4 py-2.5 font-medium text-tx-mid">Active</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {carExtras.map((ex: any) => (
                    <tr key={ex.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-tx">{ex.name}</td>
                      <td className="px-4 py-3 text-tx-mid">
                        {ex.is_free
                          ? <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[10px] font-bold uppercase rounded">Free</span>
                          : `€${ex.price}`}
                      </td>
                      <td className="px-4 py-3 text-tx-mid">{ex.price_type === 'per_day' ? 'Per day' : 'Per rental'}</td>
                      <td className="px-4 py-3 text-center">
                        {ex.is_insurance
                          ? <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[10px] font-bold uppercase rounded">Yes</span>
                          : <span className="text-tx-light text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={!!ex.is_active} onChange={async () => {
                          await fetch(`/api/admin/car-extras/${ex.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !ex.is_active }) })
                          fetchAll()
                        }} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setCarExtraForm(ex)} className="text-xs text-tx-mid hover:text-navy underline">Edit</button>
                          <button onClick={async () => {
                            if (!confirm('Delete this car extra?')) return
                            await fetch(`/api/admin/car-extras/${ex.id}`, { method: 'DELETE' })
                            fetchAll()
                          }} className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 6: Car Enquiries ── */}
      {!loading && tab === 6 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Car Enquiries</h2>
            <button onClick={() => fetchAll()} className="px-3 py-1.5 border border-border rounded-sm text-xs text-tx-mid hover:bg-sand">Refresh</button>
          </div>
          {carEnquiries.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No car enquiries yet</p>}
          <div className="space-y-2">
            {carEnquiries.map((enq: any) => {
              const notes = (() => { try { return typeof enq.guest_notes === 'string' ? JSON.parse(enq.guest_notes) : enq.guest_notes } catch { return {} } })()
              const isExpanded = carEnquiryExpand === enq.id
              const statusColors: Record<string, string> = {
                enquiry: 'bg-yellow-100 text-yellow-700',
                confirmed: 'bg-teal/10 text-teal',
                cancelled: 'bg-red-100 text-red-600',
                completed: 'bg-gray-100 text-gray-600',
              }
              return (
                <div key={enq.id} className="bg-white border border-border rounded-sm overflow-hidden">
                  <button
                    onClick={() => setCarEnquiryExpand(isExpanded ? null : enq.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${statusColors[enq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {enq.status}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-tx">{enq.guest_name ?? '—'}</p>
                        <p className="text-[11px] text-tx-light">{enq.item_title} · {enq.confirmation_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-tx-light">{new Date(enq.created_at).toLocaleDateString('en-GB')}</span>
                      <span className="text-tx-light text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        <div><span className="text-tx-light text-xs">Email</span><p className="text-tx">{enq.guest_email ?? '—'}</p></div>
                        <div><span className="text-tx-light text-xs">Reference</span><p className="text-tx font-mono font-bold">{enq.confirmation_code}</p></div>
                        {notes.pickup_location && <div><span className="text-tx-light text-xs">Pickup</span><p className="text-tx">{notes.pickup_location}</p></div>}
                        {notes.pickup_date && <div><span className="text-tx-light text-xs">Dates</span><p className="text-tx">{notes.pickup_date} → {notes.dropoff_date}</p></div>}
                        {notes.duration_days && <div><span className="text-tx-light text-xs">Duration</span><p className="text-tx">{notes.duration_days} days</p></div>}
                        {notes.driver_age && <div><span className="text-tx-light text-xs">Driver Age</span><p className="text-tx">{notes.driver_age}</p></div>}
                        {notes.driver_country && <div><span className="text-tx-light text-xs">Country</span><p className="text-tx">{notes.driver_country}</p></div>}
                        {notes.flight_number && <div><span className="text-tx-light text-xs">Flight</span><p className="text-tx">{notes.flight_number}</p></div>}
                        {notes.grand_total != null && <div><span className="text-tx-light text-xs">Total</span><p className="text-tx font-semibold">€{Number(notes.grand_total).toFixed(2)}</p></div>}
                      </div>
                      {Array.isArray(notes.selected_extras) && notes.selected_extras.length > 0 && (
                        <div>
                          <p className="text-xs text-tx-light mb-1">Extras</p>
                          <div className="flex flex-wrap gap-1.5">
                            {notes.selected_extras.map((e: any, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-sand text-tx text-xs rounded">{e.name} — €{e.price}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {enq.status === 'enquiry' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/bookings/${enq.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) })
                              showCarToast('Booking confirmed')
                              fetchAll()
                            }}
                            className="px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-sm hover:opacity-90"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Cancel this enquiry?')) return
                              await fetch(`/api/admin/bookings/${enq.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
                              showCarToast('Booking cancelled')
                              fetchAll()
                            }}
                            className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-sm hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {carToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white text-sm font-medium px-4 py-2 rounded-sm shadow-lg">
              {carToast}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 7: Category Images ── */}
      {!loading && tab === 7 && (() => {
        const CAT_LABELS: Record<string, string> = {
          car: 'Cars',
          atv_motorbike: 'ATV / Motorbikes / Scooters',
          bike_ebike: 'Bike & E-Bike',
          boat: 'Boat',
          essentials: 'Vacation Essentials — Main Card',
        }
        const CAT_GRADIENTS: Record<string, string> = {
          car: 'linear-gradient(135deg, #1B2D4F 0%, #2D4A7A 100%)',
          atv_motorbike: 'linear-gradient(135deg, #D4854A 0%, #B8612A 100%)',
          bike_ebike: 'linear-gradient(135deg, #1A8A7D 0%, #0D6B60 100%)',
          boat: 'linear-gradient(135deg, #2D4A7A 0%, #1A8A7D 100%)',
          essentials: 'linear-gradient(135deg, #1A8A7D 0%, #1B2D4F 100%)',
        }
        async function uploadCategoryImage(category: string, file: File) {
          setCatUploading(category)
          const fd = new globalThis.FormData()
          fd.append('file', file)
          fd.append('bucket', 'rental-images')
          fd.append('slug', `categories/${category}`)
          const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const json = await res.json()
          if (json.url) {
            await fetch(`/api/admin/rental-category-images/${category}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_wide: json.url, image_url: json.url }),
            })
            fetchAll()
          }
          setCatUploading(null)
        }
        async function uploadEssentialsCatImage(category: string, file: File) {
          setEssentialsCatUploading(category)
          const fd = new globalThis.FormData()
          fd.append('file', file)
          fd.append('bucket', 'rental-images')
          fd.append('slug', `essentials/${category}`)
          const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const json = await res.json()
          if (json.url) {
            await fetch(`/api/admin/rental-essentials-categories/${category}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_wide: json.url, image_url: json.url }),
            })
            fetchAll()
          }
          setEssentialsCatUploading(null)
        }
        return (
          <div className="space-y-8">
            {/* Vehicle category cards + Essentials main card */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-navy">Category Images</h2>
                <p className="text-xs text-tx-light">Hero images for the rentals landing page</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {['car', 'atv_motorbike', 'bike_ebike', 'boat', 'essentials'].map(cat => {
                  const row = categoryImages.find((r: any) => r.category === cat)
                  const imageUrl = row?.image_wide ?? row?.image_url ?? null
                  const isUploading = catUploading === cat
                  return (
                    <div key={cat} className="bg-white border border-border rounded-sm overflow-hidden">
                      <div
                        className="relative h-36 flex items-end"
                        style={{ background: imageUrl ? undefined : CAT_GRADIENTS[cat] }}
                      >
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={CAT_LABELS[cat]} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        )}
                        {!imageUrl && (
                          <p className="relative z-10 px-3 pb-3 text-white text-sm font-semibold font-display">{CAT_LABELS[cat]}</p>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-tx mb-2">{CAT_LABELS[cat]}</p>
                        <label className={`block w-full text-center px-3 py-2 border border-dashed border-border rounded-sm text-xs text-tx-mid cursor-pointer hover:border-navy hover:text-navy transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploading ? 'Uploading…' : imageUrl ? 'Replace Image' : '+ Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) uploadCategoryImage(cat, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                        {imageUrl && (
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/rental-category-images/${cat}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image_wide: null, image_url: null }),
                              })
                              fetchAll()
                            }}
                            className="mt-1.5 w-full text-center text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Essentials subcategory images */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-navy">Vacation Essentials — Subcategories</h2>
                <p className="text-xs text-tx-light">Hero images for each essentials category card</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {['beach', 'baby', 'camping', 'sport', 'comfort', 'other'].map(cat => {
                  const row = essentialsCatData.find((r: any) => r.category === cat)
                  const imageUrl = row?.image_wide ?? row?.image_url ?? null
                  const label = row?.label ?? cat.charAt(0).toUpperCase() + cat.slice(1)
                  const isUploading = essentialsCatUploading === cat
                  return (
                    <div key={cat} className="bg-white border border-border rounded-sm overflow-hidden">
                      <div
                        className="relative h-36 flex items-end"
                        style={{ background: imageUrl ? undefined : 'linear-gradient(135deg, #1A8A7D 0%, #1B2D4F 100%)' }}
                      >
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        )}
                        {!imageUrl && (
                          <p className="relative z-10 px-3 pb-3 text-white text-sm font-semibold font-display">{label}</p>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-tx mb-2">{label}</p>
                        <label className={`block w-full text-center px-3 py-2 border border-dashed border-border rounded-sm text-xs text-tx-mid cursor-pointer hover:border-navy hover:text-navy transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploading ? 'Uploading…' : imageUrl ? 'Replace Image' : '+ Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) uploadEssentialsCatImage(cat, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                        {imageUrl && (
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/rental-essentials-categories/${cat}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image_wide: null, image_url: null }),
                              })
                              fetchAll()
                            }}
                            className="mt-1.5 w-full text-center text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Tab 8: Pickup Locations ── */}
      {!loading && tab === 8 && (
        <PickupLocationsTab
          locations={pickupLocations}
          onSaved={fetchAll}
        />
      )}

      {/* ── Tab 9: Ports ── */}
      {!loading && tab === 9 && (
        <PortsTab
          ports={ports}
          onSaved={fetchAll}
        />
      )}

      {/* ── Tab 10: Bike Extras ── */}
      {!loading && tab === 10 && (
        <BikeExtrasTab
          extras={bikeExtras}
          onSaved={fetchAll}
        />
      )}

      {/* ── Drawers ── */}
      {rentalForm !== null && (
        <VehicleForm
          initial={rentalForm === 'new' ? null : rentalForm}
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
      {carListingForm !== null && (
        <CarListingForm
          initial={carListingForm === 'new' ? null : carListingForm}
          onClose={() => setCarListingForm(null)}
          onSaved={() => { setCarListingForm(null); fetchAll() }}
        />
      )}
      {carExtraForm !== null && (
        <CarExtraForm
          initial={carExtraForm === 'new' ? null : carExtraForm}
          onClose={() => setCarExtraForm(null)}
          onSaved={() => { setCarExtraForm(null); fetchAll() }}
        />
      )}
    </div>
  )
}
