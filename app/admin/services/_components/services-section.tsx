'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { slugify } from '@/lib/slugify'
import type { Service, ServiceSubcategory } from '@/lib/types'

// ─── Shared style tokens ──────────────────────────────────────────────────────
const INPUT  = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL  = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const MOOD_OPTIONS = [
  { key: 'relax_restore',  label: 'Relax & Restore' },
  { key: 'family_time',    label: 'Family Time' },
  { key: 'celebrate',      label: 'Celebrate' },
  { key: 'indulge',        label: 'Indulge' },
  { key: 'active_fit',     label: 'Active & Fit' },
  { key: 'host_entertain', label: 'Host & Entertain' },
]

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ─── Tag input (includes array) ───────────────────────────────────────────────
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  function add() {
    const trimmed = draft.trim()
    if (trimmed && !value.includes(trimmed)) { onChange([...value, trimmed]); setDraft('') }
  }
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-1.5">
        {value.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-navy/10 text-navy text-[12px]">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-navy/50 hover:text-navy ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Add item…'}
          className={`${INPUT} flex-1`}
        />
        <button type="button" onClick={add} className="px-3 py-2 bg-navy text-white text-sm rounded-sm">+</button>
      </div>
    </div>
  )
}

// ─── Service Form ─────────────────────────────────────────────────────────────
type FormData = Omit<Service, 'id'>

function emptyForm(): FormData {
  return {
    title: '', slug: '',
    short_description: null, description: null,
    category: 'in_house', subcategory: 'wellness_health',
    service_type: null,
    price_from: null, price_label: null, duration: null,
    includes: null, good_to_know: null,
    mood_tags: [],
    images: null, image_wide: null, image_square: null,
    focal_x: null, focal_y: null, focal_sq_x: null, focal_sq_y: null,
    is_active: true, is_featured: false,
    sort_order: 0, region: 'chania',
    offer_label: null, offer_price: null, is_on_offer: false,
  }
}

interface ServiceFormProps {
  service: Service | null
  onSave: (data: Partial<FormData>) => Promise<void>
  onClose: () => void
}

function ServiceForm({ service, onSave, onClose }: ServiceFormProps) {
  const [notifyGuests, setNotifyGuests] = useState(false)
  const [form, setForm] = useState<FormData>(() => service ? {
    title: service.title, slug: service.slug,
    short_description: service.short_description,
    description: service.description,
    category: service.category, subcategory: service.subcategory,
    service_type: service.service_type,
    price_from: service.price_from, price_label: service.price_label,
    duration: service.duration, includes: service.includes,
    good_to_know: service.good_to_know,
    mood_tags: service.mood_tags ?? [],
    images: service.images, image_wide: service.image_wide,
    image_square: service.image_square,
    focal_x: service.focal_x, focal_y: service.focal_y,
    focal_sq_x: service.focal_sq_x, focal_sq_y: service.focal_sq_y,
    is_active: service.is_active, is_featured: service.is_featured,
    sort_order: service.sort_order, region: service.region,
    offer_label: service.offer_label ?? null,
    offer_price: service.offer_price ?? null,
    is_on_offer: service.is_on_offer ?? false,
  } : emptyForm())

  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [allSubcats,  setAllSubcats]  = useState<ServiceSubcategory[]>([])

  useEffect(() => {
    fetch('/api/admin/service-subcategories')
      .then(r => r.json())
      .then(d => setAllSubcats(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleTitleChange(title: string) {
    setForm(f => ({ ...f, title, ...(service ? {} : { slug: slugify(title) }) }))
  }

  function handleCategoryChange(cat: Service['category']) {
    const firstSubcat = allSubcats.find(s => s.category === cat)?.subcategory ?? ''
    setForm(f => ({ ...f, category: cat, subcategory: firstSubcat }))
  }

  const subcatOptions = allSubcats.filter(s => s.category === form.category)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await onSave({ ...form, notify_guests: notifyGuests } as any)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-navy">{service ? 'Edit Service' : 'New Service'}</h2>
          <button type="button" onClick={onClose} className="text-tx-light hover:text-navy text-xl">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className={LABEL}>Title *</label>
            <input type="text" required value={form.title} onChange={e => handleTitleChange(e.target.value)} className={INPUT} />
          </div>

          {/* Slug */}
          <div>
            <label className={LABEL}>Slug</label>
            <input type="text" value={form.slug ?? ''} onChange={e => set('slug', e.target.value)} className={INPUT} />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Category *</label>
              <select
                value={form.category}
                onChange={e => handleCategoryChange(e.target.value as Service['category'])}
                className={SELECT}
              >
                <option value="in_house">In-House</option>
                <option value="reservations">Reservations</option>
                <option value="localize">Join the Locals</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Subcategory *</label>
              <select value={form.subcategory} onChange={e => set('subcategory', e.target.value)} className={SELECT}>
                {subcatOptions.length === 0 && (
                  <option value={form.subcategory}>{form.subcategory}</option>
                )}
                {subcatOptions.map(s => (
                  <option key={s.subcategory} value={s.subcategory}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label className={LABEL}>Service Type</label>
            <input type="text" value={form.service_type ?? ''} onChange={e => set('service_type', e.target.value || null)} placeholder="e.g. Deep Tissue Massage" className={INPUT} />
          </div>

          {/* Short Description */}
          <div>
            <label className={LABEL}>Short Description (max 120 chars)</label>
            <textarea
              value={form.short_description ?? ''}
              onChange={e => set('short_description', e.target.value || null)}
              maxLength={120}
              rows={2}
              className={INPUT}
            />
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              rows={4}
              className={INPUT}
            />
          </div>

          {/* Price + Label + Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Price From (€)</label>
              <input type="number" step="0.01" value={form.price_from ?? ''} onChange={e => set('price_from', e.target.value ? Number(e.target.value) : null)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Price Label</label>
              <input type="text" value={form.price_label ?? ''} onChange={e => set('price_label', e.target.value || null)} placeholder="from €80/hour" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Duration</label>
              <input type="text" value={form.duration ?? ''} onChange={e => set('duration', e.target.value || null)} placeholder="90 minutes" className={INPUT} />
            </div>
          </div>

          {/* Offer fields */}
          <div className="border border-border-light rounded-sm p-3 space-y-3 bg-sand/30">
            <div className="flex items-center gap-3">
              <Toggle checked={form.is_on_offer} onChange={() => set('is_on_offer', !form.is_on_offer)} />
              <span className="text-sm font-semibold text-navy">On Offer</span>
            </div>
            {form.is_on_offer && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Offer Label</label>
                  <input
                    type="text"
                    value={form.offer_label ?? ''}
                    onChange={e => set('offer_label', e.target.value || null)}
                    placeholder="e.g. Book before June — 20% off"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Offer Price From (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.offer_price ?? ''}
                    onChange={e => set('offer_price', e.target.value ? Number(e.target.value) : null)}
                    className={INPUT}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Includes */}
          <div>
            <label className={LABEL}>What&apos;s Included</label>
            <TagInput value={form.includes ?? []} onChange={v => set('includes', v.length ? v : null)} placeholder="Add include item…" />
          </div>

          {/* Good to Know */}
          <div>
            <label className={LABEL}>Good to Know</label>
            <textarea
              value={form.good_to_know ?? ''}
              onChange={e => set('good_to_know', e.target.value || null)}
              rows={3}
              className={INPUT}
            />
          </div>

          {/* Mood Tags */}
          <div>
            <label className={LABEL}>Mood Tags</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MOOD_OPTIONS.map(m => (
                <label key={m.key} className="flex items-center gap-2 cursor-pointer text-sm text-tx">
                  <input
                    type="checkbox"
                    checked={form.mood_tags.includes(m.key)}
                    onChange={e => set('mood_tags', e.target.checked ? [...form.mood_tags, m.key] : form.mood_tags.filter(t => t !== m.key))}
                    className="rounded border-border"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <label className={LABEL}>Region</label>
            <input type="text" value={form.region} onChange={e => set('region', e.target.value)} className={INPUT} />
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-tx cursor-pointer">
              <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-tx cursor-pointer">
              <Toggle checked={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} />
              Featured
            </label>
          </div>
          {!service && (
            <label className="flex items-center gap-2 text-sm text-tx cursor-pointer">
              <Toggle checked={notifyGuests} onChange={() => setNotifyGuests(v => !v)} />
              <span>Notify guests on publish</span>
            </label>
          )}

          {/* Sort Order */}
          <div>
            <label className={LABEL}>Sort Order</label>
            <input type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} className={INPUT} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-sm text-tx hover:border-navy">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-navy text-white rounded-sm disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Service'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Tab 1: Services CRUD ─────────────────────────────────────────────────────
function ServicesTab() {
  const [services,    setServices]    = useState<Service[]>([])
  const [loading,     setLoading]     = useState(true)
  const [editing,     setEditing]     = useState<Service | null | 'new'>(null)
  const [toast,       setToast]       = useState<string | null>(null)
  const [subcatLabels, setSubcatLabels] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(d => { setServices(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/admin/service-subcategories')
      .then(r => r.json())
      .then((d: ServiceSubcategory[]) => {
        if (!Array.isArray(d)) return
        const map: Record<string, string> = {}
        d.forEach(s => { map[s.subcategory] = s.label })
        setSubcatLabels(map)
      })
      .catch(() => {})
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(data: Partial<FormData>) {
    const isNew = editing === 'new'
    const id    = isNew ? null : (editing as Service).id
    const res = await fetch(isNew ? '/api/admin/services' : `/api/admin/services/${id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Save failed') }
    setEditing(null)
    load()
    showToast(isNew ? 'Service created' : 'Service updated')
  }

  async function handleDelete(s: Service) {
    if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/services/${s.id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Delete failed'); return }
    load()
    showToast('Service deleted')
  }

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal text-white text-sm font-semibold px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy">Services ({services.length})</h2>
        <button
          onClick={() => setEditing('new')}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm"
        >
          + New Service
        </button>
      </div>

      {loading ? (
        <p className="text-tx-light text-sm">Loading…</p>
      ) : services.length === 0 ? (
        <p className="text-tx-light text-sm">No services yet. Create the first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-light text-left">
                {['Title', 'Category', 'Subcategory', 'Service Type', 'Price Label', 'On Offer', 'Active', 'Featured', 'Actions'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-[11px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-b border-border-light hover:bg-sand/30 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-navy max-w-[180px] truncate">{s.title}</td>
                  <td className="py-2.5 pr-4 text-tx-mid capitalize">{s.category.replace('_', '-')}</td>
                  <td className="py-2.5 pr-4 text-tx-mid">{subcatLabels[s.subcategory] ?? s.subcategory}</td>
                  <td className="py-2.5 pr-4 text-tx-mid">{s.service_type ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-tx-mid">{s.price_label ?? (s.price_from ? `€${s.price_from}` : '—')}</td>
                  <td className="py-2.5 pr-4">
                    {s.is_on_offer ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-terra/15 text-terra">On Offer</span>
                    ) : (
                      <span className="text-[11px] text-tx-light">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${s.is_active ? 'bg-teal/15 text-teal' : 'bg-gray-100 text-gray-400'}`}>
                      {s.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${s.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.is_featured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(s)} className="text-xs font-semibold text-teal hover:underline">Edit</button>
                      <button onClick={() => handleDelete(s)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <ServiceForm
          service={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ─── Tab 2: Subcategory Management ───────────────────────────────────────────
interface SubcatFormState {
  label: string
  subcategory: string
  category: 'in_house' | 'reservations' | 'localize'
  tagline: string
  sort_order: number
}

function emptySubcatForm(): SubcatFormState {
  return { label: '', subcategory: '', category: 'in_house', tagline: '', sort_order: 0 }
}

function SubcategoriesTab() {
  const [subcats,    setSubcats]    = useState<ServiceSubcategory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [addForm,    setAddForm]    = useState<SubcatFormState>(emptySubcatForm())
  const [adding,     setAdding]     = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [editForm,   setEditForm]   = useState<SubcatFormState>(emptySubcatForm())
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/service-subcategories')
      .then(r => r.json())
      .then(d => { setSubcats(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function handleAddLabelChange(label: string) {
    setAddForm(f => ({ ...f, label, subcategory: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.label || !addForm.subcategory) return
    setAdding(true)
    const res = await fetch('/api/admin/service-subcategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label:       addForm.label,
        subcategory: addForm.subcategory,
        category:    addForm.category,
        tagline:     addForm.tagline || null,
        sort_order:  addForm.sort_order,
      }),
    })
    setAdding(false)
    if (!res.ok) { const d = await res.json(); showToast(`Error: ${d.error}`); return }
    setShowAdd(false)
    setAddForm(emptySubcatForm())
    load()
    showToast('Subcategory created')
  }

  function startEdit(s: ServiceSubcategory) {
    setEditId(s.subcategory)
    setEditForm({ label: s.label, subcategory: s.subcategory, category: s.category, tagline: s.tagline ?? '', sort_order: s.sort_order })
  }

  async function handleSaveEdit(subcatKey: string) {
    setSaving(true)
    const res = await fetch(`/api/admin/service-subcategories/${subcatKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label:      editForm.label,
        tagline:    editForm.tagline || null,
        sort_order: editForm.sort_order,
      }),
    })
    setSaving(false)
    if (!res.ok) { showToast('Save failed'); return }
    setEditId(null)
    load()
    showToast('Subcategory updated')
  }

  async function handleDelete(s: ServiceSubcategory) {
    // Check if any services use this subcategory
    let count = 0
    try {
      const r = await fetch(`/api/services?subcategory=${s.subcategory}`)
      const d = await r.json()
      count = Array.isArray(d.services) ? d.services.length : 0
    } catch { /* ignore */ }
    if (count > 0) {
      alert(`Cannot delete: ${count} service${count > 1 ? 's' : ''} use this subcategory. Delete or reassign them first.`)
      return
    }
    if (!confirm(`Delete subcategory "${s.label}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/service-subcategories/${s.subcategory}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Delete failed'); return }
    load()
    showToast('Subcategory deleted')
  }

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal text-white text-sm font-semibold px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy">Subcategories ({subcats.length})</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm"
        >
          {showAdd ? 'Cancel' : '+ New Subcategory'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-5 p-4 border border-border-light rounded-sm bg-sand/20 space-y-3">
          <h3 className="text-sm font-semibold text-navy">New Subcategory</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Label *</label>
              <input
                type="text" required
                value={addForm.label}
                onChange={e => handleAddLabelChange(e.target.value)}
                placeholder="e.g. Wellness & Health"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Subcategory Slug *</label>
              <input
                type="text" required
                value={addForm.subcategory}
                onChange={e => setAddForm(f => ({ ...f, subcategory: e.target.value }))}
                placeholder="e.g. wellness_health"
                className={INPUT}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Category *</label>
              <select
                value={addForm.category}
                onChange={e => setAddForm(f => ({ ...f, category: e.target.value as 'in_house' | 'reservations' | 'localize' }))}
                className={SELECT}
              >
                <option value="in_house">In-House</option>
                <option value="reservations">Reservations</option>
                <option value="localize">Join the Locals</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Sort Order</label>
              <input
                type="number"
                value={addForm.sort_order}
                onChange={e => setAddForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className={INPUT}
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Tagline</label>
            <input
              type="text"
              value={addForm.tagline}
              onChange={e => setAddForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder="Short tagline shown on card"
              className={INPUT}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-border rounded-sm text-tx hover:border-navy">Cancel</button>
            <button type="submit" disabled={adding} className="px-4 py-2 text-sm bg-navy text-white rounded-sm disabled:opacity-60">
              {adding ? 'Creating…' : 'Create Subcategory'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-tx-light text-sm">Loading…</p>
      ) : subcats.length === 0 ? (
        <p className="text-tx-light text-sm">No subcategories yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-light text-left">
                {['Label', 'Slug', 'Category', 'Tagline', 'Sort', 'Actions'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-[11px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subcats.map(s => {
                const isEditing = editId === s.subcategory
                return (
                  <tr key={s.subcategory} className="border-b border-border-light hover:bg-sand/30 transition-colors align-top">
                    {isEditing ? (
                      <>
                        <td className="py-2 pr-3">
                          <input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} className={`${INPUT} py-1`} />
                        </td>
                        <td className="py-2 pr-3 text-tx-light text-[12px] font-mono">{s.subcategory}</td>
                        <td className="py-2 pr-3 text-tx-mid capitalize">{s.category.replace('_', '-')}</td>
                        <td className="py-2 pr-3">
                          <input value={editForm.tagline} onChange={e => setEditForm(f => ({ ...f, tagline: e.target.value }))} className={`${INPUT} py-1`} placeholder="Tagline" />
                        </td>
                        <td className="py-2 pr-3">
                          <input type="number" value={editForm.sort_order} onChange={e => setEditForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className={`${INPUT} py-1 w-16`} />
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(s.subcategory)} disabled={saving} className="text-xs font-semibold text-teal hover:underline disabled:opacity-50">Save</button>
                            <button onClick={() => setEditId(null)} className="text-xs font-semibold text-tx-light hover:underline">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 pr-4 font-medium text-navy">{s.label}</td>
                        <td className="py-2.5 pr-4 text-tx-light text-[12px] font-mono">{s.subcategory}</td>
                        <td className="py-2.5 pr-4 text-tx-mid capitalize">{s.category.replace('_', '-')}</td>
                        <td className="py-2.5 pr-4 text-tx-mid max-w-[200px] truncate">{s.tagline ?? '—'}</td>
                        <td className="py-2.5 pr-4 text-tx-mid">{s.sort_order}</td>
                        <td className="py-2.5">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(s)} className="text-xs font-semibold text-teal hover:underline">Edit</button>
                            <button onClick={() => handleDelete(s)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Subcategory Images ────────────────────────────────────────────────
function SubcategoryImagesTab() {
  const [subcats,    setSubcats]    = useState<ServiceSubcategory[]>([])
  const [uploading,  setUploading]  = useState<string | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch('/api/admin/service-subcategories')
      .then(r => r.json())
      .then(d => setSubcats(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  async function handleUpload(subcatKey: string, file: File) {
    setUploading(subcatKey)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'service-images')
      formData.append('path', `subcategories/${subcatKey}`)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Upload failed')
      const imageUrl: string = uploadData.url
      const updateRes = await fetch(`/api/admin/service-subcategories/${subcatKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_wide: imageUrl, image_url: imageUrl }),
      })
      if (!updateRes.ok) throw new Error('DB update failed')
      setSubcats(prev => prev.map(s => s.subcategory === subcatKey ? { ...s, image_wide: imageUrl, image_url: imageUrl } : s))
      const label = subcats.find(s => s.subcategory === subcatKey)?.label ?? subcatKey
      showToast(`Updated image for ${label}`)
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal text-white text-sm font-semibold px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}

      <h2 className="text-lg font-semibold text-navy mb-4">Subcategory Hero Images</h2>
      <p className="text-sm text-tx-light mb-5">Upload hero images for each subcategory. Used on the subcategory grid pages.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subcats.map(s => {
          const currentImg = s.image_wide ?? s.image_url ?? null
          const busy       = uploading === s.subcategory

          return (
            <div key={s.subcategory} className="border border-border-light rounded-sm overflow-hidden bg-white">
              <div className="relative h-[120px] bg-navy/5">
                {currentImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentImg} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-tx-light text-xs">No image</div>
                )}
                {busy && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-xs text-navy">Uploading…</span>
                  </div>
                )}
              </div>

              <div className="p-2.5">
                <p className="text-[11px] font-bold text-navy leading-tight">{s.label}</p>
                <p className="text-[10px] text-tx-light mb-2 capitalize">{s.category.replace('_', '-')}</p>
                <input
                  ref={el => { fileRefs.current[s.subcategory] = el }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(s.subcategory, f) }}
                />
                <button
                  onClick={() => fileRefs.current[s.subcategory]?.click()}
                  disabled={busy}
                  className="w-full text-[11px] font-semibold text-teal border border-teal/30 rounded py-1 hover:bg-teal/5 disabled:opacity-50"
                >
                  {currentImg ? 'Replace' : 'Upload'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab 4: Service Enquiries ──────────────────────────────────────────────────
interface EnquiryRow {
  id: string
  confirmation_code: string
  item_title: string
  guest_name: string | null
  guest_email: string | null
  booking_date: string | null
  notes: string | null
  status: string
  created_at: string
}

function EnquiriesTab() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [toast,     setToast]     = useState<string | null>(null)
  const [subcatLabels, setSubcatLabels] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/bookings?item_type=service')
      .then(r => r.json())
      .then(d => { setEnquiries(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/admin/service-subcategories')
      .then(r => r.json())
      .then((d: ServiceSubcategory[]) => {
        if (!Array.isArray(d)) return
        const map: Record<string, string> = {}
        d.forEach(s => { map[s.subcategory] = s.label })
        setSubcatLabels(map)
      })
      .catch(() => {})
  }, [])

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { showToast('Failed to update status'); return }
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    showToast(status === 'confirmed' ? 'Enquiry confirmed' : 'Enquiry declined')
  }

  function parseNotes(notes: string | null): Record<string, string> {
    try { return notes ? JSON.parse(notes) : {} } catch { return {} }
  }

  const STATUS_COLORS: Record<string, string> = {
    enquiry:   'bg-blue-100 text-blue-700',
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-teal-100 text-teal-700',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal text-white text-sm font-semibold px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy">Service Enquiries ({enquiries.length})</h2>
        <button onClick={load} className="text-xs text-teal font-semibold hover:underline">Refresh</button>
      </div>

      {loading ? (
        <p className="text-tx-light text-sm">Loading…</p>
      ) : enquiries.length === 0 ? (
        <p className="text-tx-light text-sm">No service enquiries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-light text-left">
                {['Reference', 'Service', 'Guest', 'Date Requested', 'Status', 'Actions'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-[11px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquiries.map(e => {
                const isExpanded = expanded === e.id
                const notes = parseNotes(e.notes)
                return (
                  <>
                    <tr
                      key={e.id}
                      className="border-b border-border-light hover:bg-sand/30 transition-colors cursor-pointer"
                      onClick={() => setExpanded(prev => prev === e.id ? null : e.id)}
                    >
                      <td className="py-2.5 pr-4 font-mono text-[12px] text-navy">{e.confirmation_code}</td>
                      <td className="py-2.5 pr-4 font-medium text-navy max-w-[180px] truncate">{e.item_title}</td>
                      <td className="py-2.5 pr-4 text-tx-mid">{e.guest_name ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-tx-mid text-[12px]">
                        {e.booking_date ? new Date(e.booking_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-2" onClick={ev => ev.stopPropagation()}>
                          {e.status !== 'confirmed' && (
                            <button onClick={() => updateStatus(e.id, 'confirmed')} className="text-xs font-semibold text-teal hover:underline">Confirm</button>
                          )}
                          {e.status !== 'cancelled' && (
                            <button onClick={() => updateStatus(e.id, 'cancelled')} className="text-xs font-semibold text-red-500 hover:underline">Decline</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${e.id}-detail`} className="border-b border-border-light bg-sand/20">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {e.guest_email && <div><span className="text-[10px] font-bold text-tx-mid uppercase">Email</span><p className="text-navy">{e.guest_email}</p></div>}
                            {notes.guest_phone && <div><span className="text-[10px] font-bold text-tx-mid uppercase">Phone</span><p className="text-navy">{notes.guest_phone}</p></div>}
                            {notes.property_name && <div><span className="text-[10px] font-bold text-tx-mid uppercase">Property</span><p className="text-navy">{notes.property_name}</p></div>}
                            {notes.preferred_time && <div><span className="text-[10px] font-bold text-tx-mid uppercase">Time</span><p className="text-navy">{notes.preferred_time}</p></div>}
                            {notes.subcategory && <div><span className="text-[10px] font-bold text-tx-mid uppercase">Subcategory</span><p className="text-navy">{subcatLabels[notes.subcategory] ?? notes.subcategory}</p></div>}
                            {notes.notes && <div className="col-span-2"><span className="text-[10px] font-bold text-tx-mid uppercase">Notes</span><p className="text-navy">{notes.notes}</p></div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TABS = ['Services', 'Subcategories', 'Subcategory Images', 'Service Enquiries'] as const
type TabName = typeof TABS[number]

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState<TabName>('Services')

  return (
    <div className="p-0">
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-bold text-navy mb-4">Services</h1>

        <div className="flex gap-0 border-b border-border-light overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? 'border-navy text-navy'
                  : 'border-transparent text-tx-light hover:text-navy'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Services'           && <ServicesTab />}
      {activeTab === 'Subcategories'      && <SubcategoriesTab />}
      {activeTab === 'Subcategory Images' && <SubcategoryImagesTab />}
      {activeTab === 'Service Enquiries'  && <EnquiriesTab />}
    </div>
  )
}
