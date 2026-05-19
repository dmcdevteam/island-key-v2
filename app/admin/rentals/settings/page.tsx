'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminShell } from '../../_components/sidebar'
import { Toggle, Drawer, TabBar, INPUT, LABEL, SELECT } from '../_components/shared'

// ── Constants ────────────────────────────────────────────────────────────────

const VEHICLE_CATEGORIES = ['car', 'motorcycle', 'bike', 'buggy', 'boat', 'scooter', 'atv', 'other']

const CAT_LABELS: Record<string, string> = {
  car: 'Cars',
  atv_motorbike: 'ATVs & Motorbikes',
  bike_ebike: 'Bikes & E-Bikes',
  boat: 'Boats',
  essentials: 'Vacation Essentials — Main Card',
}
const CAT_GRADIENTS: Record<string, string> = {
  car: 'linear-gradient(135deg, #1B2D4F 0%, #2D4A7A 100%)',
  atv_motorbike: 'linear-gradient(135deg, #D4854A 0%, #B8612A 100%)',
  bike_ebike: 'linear-gradient(135deg, #1A8A7D 0%, #0D6B60 100%)',
  boat: 'linear-gradient(135deg, #2D4A7A 0%, #1A8A7D 100%)',
  essentials: 'linear-gradient(135deg, #1A8A7D 0%, #1B2D4F 100%)',
}

// ── Vehicle Type Form ────────────────────────────────────────────────────────

type VTFormData = {
  name: string; category: string; subcategory: string
  description: string; seats: string; sort_order: string; is_active: boolean
}
const VT_DEFAULTS: VTFormData = { name: '', category: 'car', subcategory: '', description: '', seats: '', sort_order: '0', is_active: true }

function VehicleTypeForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
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
      name: form.name, category: form.category, subcategory: form.subcategory || null,
      description: form.description || null, seats: form.seats ? Number(form.seats) : null,
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

// ── Category Hero Images Tab ──────────────────────────────────────────────────

function CategoryHeroImagesTab() {
  const [categoryImages, setCategoryImages] = useState<any[]>([])
  const [catUploading, setCatUploading] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    const res = await fetch('/api/admin/rental-category-images')
    if (res.ok) {
      const data = await res.json()
      setCategoryImages(Array.isArray(data) ? data : [])
    }
  }, [])

  useEffect(() => { fetchImages() }, [fetchImages])

  async function uploadCategoryImage(category: string, file: File) {
    setCatUploading(category)
    const fd = new globalThis.FormData()
    fd.append('file', file); fd.append('bucket', 'rental-images'); fd.append('slug', `categories/${category}`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (json.url) {
      await fetch(`/api/admin/rental-category-images/${category}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_wide: json.url, image_url: json.url }),
      })
      fetchImages()
    }
    setCatUploading(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-navy">Category Hero Images</h2>
        <p className="text-xs text-tx-light">Hero images for the rentals landing page cards</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {['car', 'atv_motorbike', 'bike_ebike', 'boat', 'essentials'].map(cat => {
          const row = categoryImages.find((r: any) => r.category === cat)
          const imageUrl = row?.image_wide ?? row?.image_url ?? null
          const isUploading = catUploading === cat
          return (
            <div key={cat} className="bg-white border border-border rounded-sm overflow-hidden">
              <div className="relative h-36 flex items-end" style={{ background: imageUrl ? undefined : CAT_GRADIENTS[cat] }}>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={CAT_LABELS[cat]} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <p className="relative z-10 px-3 pb-3 text-white text-sm font-semibold font-display">{CAT_LABELS[cat]}</p>
                  </>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-tx mb-2">{CAT_LABELS[cat]}</p>
                <label className={`block w-full text-center px-3 py-2 border border-dashed border-border rounded-sm text-xs text-tx-mid cursor-pointer hover:border-navy hover:text-navy transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? 'Uploading…' : imageUrl ? 'Replace Image' : '+ Upload Image'}
                  <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => {
                    const file = e.target.files?.[0]; if (file) uploadCategoryImage(cat, file); e.target.value = ''
                  }} />
                </label>
                {imageUrl && (
                  <button onClick={async () => {
                    await fetch(`/api/admin/rental-category-images/${cat}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_wide: null, image_url: null }) })
                    fetchImages()
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

// ── Images Tab ────────────────────────────────────────────────────────────────

type FolderData = { name: string; urls: string[]; fileNames: string[]; storagePaths: string[] }

function ImagesTab() {
  const [folders, setFolders] = useState<FolderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/rental-images')
      if (!res.ok) { setError(`API error ${res.status} — ${res.statusText}`); setLoading(false); return }
      const data = await res.json()
      setFolders(data.folders ?? [])
    } catch (e) {
      setError('Failed to load. Check the rental-images bucket exists in Supabase Storage.')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleDeleteImage(path: string) {
    if (!confirm(`Delete image "${path.split('/').pop()}"?`)) return
    const res = await fetch('/api/admin/rental-images', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) })
    if (!res.ok) { alert('Failed to delete image'); return }
    fetchData()
  }

  if (loading) return <p className="text-tx-mid text-sm">Loading…</p>
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-sm p-4">
      <p className="text-sm text-red-600 font-medium mb-1">Images tab unavailable</p>
      <p className="text-xs text-red-500">{error}</p>
      <p className="text-xs text-tx-mid mt-2">Images are managed per-vehicle in each listing form (Cars, ATVs, Bikes, Boats). This tab provides a bucket browser as a convenience.</p>
      <button onClick={fetchData} className="mt-3 px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-sm hover:bg-red-100">Retry</button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-navy">Image Library</h2>
        <button onClick={fetchData} className="px-3 py-1.5 border border-border rounded-sm text-xs text-tx-mid hover:bg-sand">Refresh</button>
      </div>
      <p className="text-xs text-tx-light mb-4">Browse all images uploaded to the rental-images storage bucket. Manage individual vehicle images in each category listing form.</p>
      {folders.length === 0 && <p className="text-tx-mid text-sm py-8 text-center">No image folders found in the rental-images bucket</p>}
      <div className="space-y-6">
        {folders.map(folder => (
          <div key={folder.name} className="bg-white border border-border rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">{folder.name}/</p>
              <span className="text-[11px] text-tx-light">{folder.urls.length} image{folder.urls.length !== 1 ? 's' : ''}</span>
            </div>
            {folder.urls.length > 0 ? (
              <div className="p-4 flex flex-wrap gap-3">
                {folder.urls.map((url, i) => (
                  <div key={url} className="relative group w-24 h-16 rounded-sm overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button type="button" onClick={() => handleDeleteImage(folder.storagePaths[i])}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded transition-opacity">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-3 text-xs text-tx-light">Empty folder</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings Page ─────────────────────────────────────────────────────────────

const TABS = ['Vehicle Types', 'Category Hero Images', 'Images']

export default function RentalSettingsPage() {
  const [tab, setTab] = useState(0)
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vtForm, setVtForm] = useState<any | null | 'new'>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/vehicle-types?exclude=transfer')
    const data = await res.json()
    setVehicleTypes(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <AdminShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-navy">Rental Settings</h1>
          <p className="text-sm text-tx-mid mt-1">Vehicle type definitions, category hero images, and image library</p>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* Vehicle Types */}
        {tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-navy">Vehicle Types</h2>
              <button onClick={() => setVtForm('new')} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light">+ Add Type</button>
            </div>
            <p className="text-xs text-tx-light mb-4 bg-sand border border-border rounded-sm px-3 py-2">
              Legacy vehicle type definitions. Individual vehicle management is now in each category section (Cars, ATVs, Bikes, Boats).
            </p>
            {loading && <p className="text-tx-mid text-sm">Loading…</p>}
            {!loading && (
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
                    {vehicleTypes.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-tx-mid">No vehicle types yet</td></tr>}
                    {vehicleTypes.map(vt => (
                      <tr key={vt.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-tx">{vt.name}</td>
                        <td className="px-4 py-3 text-tx-mid capitalize">{vt.category}</td>
                        <td className="px-4 py-3 text-tx-mid">{vt.subcategory ?? '—'}</td>
                        <td className="px-4 py-3 text-tx-mid">{vt.seats ?? '—'}</td>
                        <td className="px-4 py-3 text-tx-mid">{vt.sort_order}</td>
                        <td className="px-4 py-3 text-center">
                          <Toggle checked={vt.is_active} onChange={async () => {
                            await fetch(`/api/admin/vehicle-types/${vt.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !vt.is_active }) })
                            fetchAll()
                          }} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setVtForm(vt)} className="text-xs text-teal hover:underline mr-3">Edit</button>
                          <button onClick={async () => {
                            if (!confirm('Delete this vehicle type?')) return
                            await fetch(`/api/admin/vehicle-types/${vt.id}`, { method: 'DELETE' })
                            fetchAll()
                          }} className="text-xs text-red-500 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Category Hero Images */}
        {tab === 1 && <CategoryHeroImagesTab />}

        {/* Images */}
        {tab === 2 && <ImagesTab />}

        {vtForm !== null && (
          <VehicleTypeForm initial={vtForm === 'new' ? null : vtForm} onClose={() => setVtForm(null)} onSaved={() => { setVtForm(null); fetchAll() }} />
        )}
      </div>
    </AdminShell>
  )
}
