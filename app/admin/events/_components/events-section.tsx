'use client'

import { useState, useEffect, useRef } from 'react'
import { slugify } from '@/lib/slugify'
import type { EventFull } from '@/lib/types'
import { FocalPointPicker, type FocalPoint } from '@/components/admin/FocalPointPicker'

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const CATEGORY_COLORS: Record<string, string> = {
  festival: '#D4854A', music: '#1B2D4F', food: '#D4A843', sport: '#1A8A7D',
  cultural: '#9B59B6', market: '#1A8A7D', nightlife: '#D94F4F', family: '#3498DB', other: '#5A5A5A',
}

const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' }
function getEffectiveMime(file: File) {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  return EXT_MIME[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

type FormState = Omit<EventFull, 'id' | 'created_at'>

function emptyForm(): FormState {
  const now = new Date().toISOString().slice(0, 16)
  return {
    title: '', slug: '', description: null, short_description: null,
    category: null, start_date: now, end_date: null,
    all_day: false, recurring: false, recurring_pattern: null,
    location_name: null, location_address: null, location_lat: null, location_lng: null,
    price_from: null, price_label: null, is_free: true, booking_url: null,
    organiser: null, region: 'chania', tier_visibility: ['B', 'M', 'P'],
    images: null, focal_x: null, focal_y: null, is_featured: false, is_active: true, sort_order: 0,
  }
}

function EventForm({ event, onSave, onClose }: { event: EventFull | null; onSave: (d: Partial<FormState>) => Promise<void>; onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [images, setImages]       = useState<string[]>(event?.images ?? [])
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(
    event?.focal_x != null && event?.focal_y != null
      ? { x: event.focal_x, y: event.focal_y }
      : null
  )

  const [form, setForm] = useState<FormState>(() => event ? {
    title: event.title, slug: event.slug, description: event.description,
    short_description: event.short_description, category: event.category,
    start_date: event.start_date, end_date: event.end_date,
    all_day: event.all_day, recurring: event.recurring, recurring_pattern: event.recurring_pattern,
    location_name: event.location_name, location_address: event.location_address,
    location_lat: event.location_lat, location_lng: event.location_lng,
    price_from: event.price_from, price_label: event.price_label, is_free: event.is_free,
    booking_url: event.booking_url, organiser: event.organiser, region: event.region,
    tier_visibility: event.tier_visibility, images: event.images,
    focal_x: event.focal_x ?? null, focal_y: event.focal_y ?? null,
    is_featured: event.is_featured, is_active: event.is_active, sort_order: event.sort_order,
  } : emptyForm())

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    set('title', title)
    if (!event) set('slug', slugify(title))
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
    const validationErrors: string[] = []
    const warnings: string[] = []

    // Format check
    const formatOk = files.filter(f => SUPPORTED_MIME.has(getEffectiveMime(f)))
    if (formatOk.length < files.length)
      validationErrors.push(`${files.length - formatOk.length} file(s) skipped — unsupported format (JPG/PNG/WebP/AVIF only)`)

    // Size check — max 2MB
    const sizeOk = formatOk.filter(f => {
      if (f.size > 2 * 1024 * 1024) { validationErrors.push(`${f.name}: exceeds 2MB limit`); return false }
      return true
    })

    // Dimension check — min 1200px wide, 16:9 warning
    const ready: File[] = []
    await Promise.all(sizeOk.map(file => new Promise<void>(resolve => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        if (img.naturalWidth < 1200) {
          validationErrors.push(`${file.name}: must be at least 1200px wide (got ${img.naturalWidth}px)`)
        } else {
          const ratio = img.naturalWidth / img.naturalHeight
          if (Math.abs(ratio - 16 / 9) > 0.12)
            warnings.push(`${file.name}: not 16:9 — image may appear cropped`)
          ready.push(file)
        }
        resolve()
      }
      img.onerror = () => { URL.revokeObjectURL(url); ready.push(file); resolve() }
      img.src = url
    })))

    const allMessages = [...validationErrors, ...warnings]
    if (allMessages.length) setUploadError(allMessages.join('\n'))
    if (!ready.length) return

    setUploadingCount(ready.length)
    const slug = form.slug || slugify(form.title) || undefined
    const results = await Promise.allSettled(ready.map(async file => {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      if (slug) fd.append('slug', slug)
      fd.append('bucket', 'event-images')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.url) throw new Error(json.error ?? 'Upload failed')
      return json.url as string
    }))
    setUploadingCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    const urls: string[] = []
    const uploadErrors: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') urls.push(r.value)
      else uploadErrors.push(r.reason instanceof Error ? r.reason.message : 'Upload failed')
    }
    if (urls.length) setImages(prev => [...prev, ...urls])
    if (uploadErrors.length) setUploadError(prev => [prev, ...uploadErrors].filter(Boolean).join('\n'))
  }

  async function handleSubmit() {
    setError(''); setSaving(true)
    try {
      await onSave({
        ...form,
        images:       images.length ? images : null,
        focal_x:      focalPoint?.x ?? null,
        focal_y:      focalPoint?.y ?? null,
        price_from:   form.price_from ? Number(form.price_from) : null,
        location_lat: form.location_lat ? Number(form.location_lat) : null,
        location_lng: form.location_lng ? Number(form.location_lng) : null,
        sort_order:   Number(form.sort_order) || 0,
      } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40" onClick={onClose}>
      <div className="relative w-full md:max-w-2xl h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">{event ? 'Edit Event' : 'New Event'}</h2>
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
                <input className={INPUT} value={form.slug} onChange={e => set('slug', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Short Description</label>
                <input className={INPUT} value={form.short_description ?? ''} onChange={e => set('short_description', e.target.value || null)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Full Description</label>
                <textarea className={`${INPUT} resize-y`} rows={4} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} />
              </div>
              <div>
                <label className={LABEL}>Category</label>
                <select className={SELECT} value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}>
                  <option value="">— None —</option>
                  {['festival','music','food','sport','cultural','market','nightlife','family','other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Region</label>
                <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
                  {['chania','rethymno','heraklion','lasithi','island-wide'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Organiser</label>
                <input className={INPUT} value={form.organiser ?? ''} onChange={e => set('organiser', e.target.value || null)} />
              </div>
            </div>
          </section>

          {/* Dates */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Start Date & Time *</label>
                <input type={form.all_day ? 'date' : 'datetime-local'} className={INPUT}
                  value={form.start_date?.slice(0, form.all_day ? 10 : 16) ?? ''}
                  onChange={e => set('start_date', e.target.value ? new Date(e.target.value).toISOString() : '')} />
              </div>
              <div>
                <label className={LABEL}>End Date & Time</label>
                <input type={form.all_day ? 'date' : 'datetime-local'} className={INPUT}
                  value={form.end_date?.slice(0, form.all_day ? 10 : 16) ?? ''}
                  onChange={e => set('end_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.all_day} onChange={e => set('all_day', e.target.checked)} className="rounded" />
                  <span className="text-sm">All day</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.recurring} onChange={e => set('recurring', e.target.checked)} className="rounded" />
                  <span className="text-sm">Recurring</span>
                </label>
              </div>
              {form.recurring && (
                <div>
                  <label className={LABEL}>Recurrence Pattern</label>
                  <select className={SELECT} value={form.recurring_pattern ?? ''} onChange={e => set('recurring_pattern', e.target.value || null)}>
                    <option value="">— Select —</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={LABEL}>Location Name</label>
                <input className={INPUT} value={form.location_name ?? ''} onChange={e => set('location_name', e.target.value || null)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Address</label>
                <input className={INPUT} value={form.location_address ?? ''} onChange={e => set('location_address', e.target.value || null)} />
              </div>
              <div>
                <label className={LABEL}>Latitude</label>
                <input type="number" step="any" className={INPUT} value={form.location_lat ?? ''} onChange={e => set('location_lat', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <label className={LABEL}>Longitude</label>
                <input type="number" step="any" className={INPUT} value={form.location_lng ?? ''} onChange={e => set('location_lng', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_free} onChange={e => set('is_free', e.target.checked)} className="rounded" />
                  <span className="text-sm">Free event</span>
                </label>
              </div>
              {!form.is_free && (
                <>
                  <div>
                    <label className={LABEL}>Price From (€)</label>
                    <input type="number" step="0.01" className={INPUT} value={form.price_from ?? ''} onChange={e => set('price_from', e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className={LABEL}>Price Label</label>
                    <input className={INPUT} value={form.price_label ?? ''} onChange={e => set('price_label', e.target.value || null)} placeholder="e.g. From €10 per person" />
                  </div>
                </>
              )}
              <div className="col-span-2">
                <label className={LABEL}>Booking / Tickets URL</label>
                <input type="url" className={INPUT} value={form.booking_url ?? ''} onChange={e => set('booking_url', e.target.value || null)} />
              </div>
            </div>
          </section>

          {/* Visibility */}
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
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-border rounded-full text-[10px] text-red-500 flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <div className="mt-3">
                <FocalPointPicker
                  imageUrl={images[0]}
                  focalPoint={focalPoint}
                  onChange={setFocalPoint}
                />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingCount > 0}
              className="mt-3 px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
              {uploadingCount > 0 ? `Uploading ${uploadingCount}…` : '+ Upload Images'}
            </button>
            {uploadError && <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-sm">{uploadError}</p>}
          </section>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : event ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar view ─────────────────────────────────────────────────────────────

function expandForMonth(events: EventFull[], year: number, month: number): Map<string, EventFull[]> {
  const map = new Map<string, EventFull[]>()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  for (const ev of events) {
    const start = new Date(ev.start_date)

    if (!ev.recurring) {
      const dateStr = ev.start_date.slice(0, 10)
      const d = new Date(dateStr)
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (!map.has(dateStr)) map.set(dateStr, [])
        map.get(dateStr)!.push(ev)
      }
    } else {
      // expand recurring for this month
      let cursor = new Date(start)
      while (cursor <= lastDay) {
        if (cursor >= firstDay) {
          const dateStr = cursor.toISOString().slice(0, 10)
          if (!map.has(dateStr)) map.set(dateStr, [])
          map.get(dateStr)!.push(ev)
        }
        if (ev.recurring_pattern === 'weekly') cursor = new Date(cursor.getTime() + 7 * 86400000)
        else if (ev.recurring_pattern === 'monthly') { cursor = new Date(cursor); cursor.setMonth(cursor.getMonth() + 1) }
        else if (ev.recurring_pattern === 'annual') { cursor = new Date(cursor); cursor.setFullYear(cursor.getFullYear() + 1) }
        else break
      }
    }
  }
  return map
}

function CalendarView({ events, onEdit }: { events: EventFull[]; onEdit: (ev: EventFull) => void }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const eventsByDate = expandForMonth(events, year, month)
  const firstDay = new Date(year, month, 1)
  const startPad = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const todayStr = today.toISOString().slice(0, 10)

  const monthLabel = firstDay.toLocaleDateString('en', { month: 'long', year: 'numeric' })

  function dateStr(day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button onClick={prevMonth} className="px-2 py-1 border border-border rounded-sm text-sm hover:border-navy">←</button>
        <span className="font-semibold text-navy">{monthLabel}</span>
        <button onClick={nextMonth} className="px-2 py-1 border border-border rounded-sm text-sm hover:border-navy">→</button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-sm overflow-hidden">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="bg-gray-50 py-2 text-center text-[10px] font-bold text-tx-mid uppercase">{d}</div>
        ))}
        {cells.map((day, i) => {
          const ds = day ? dateStr(day) : null
          const dayEvents = ds ? (eventsByDate.get(ds) ?? []) : []
          const isToday = ds === todayStr
          return (
            <div key={i} className={`bg-white min-h-[80px] p-1 ${isToday ? 'ring-1 ring-inset ring-navy' : ''}`}>
              {day && (
                <>
                  <div className={`text-[11px] font-bold mb-1 ${isToday ? 'text-navy' : 'text-tx-light'}`}>{day}</div>
                  {dayEvents.slice(0, 3).map(ev => (
                    <button key={ev.id} onClick={() => onEdit(ev)}
                      className="w-full text-left text-[9px] font-semibold px-1 py-0.5 rounded mb-0.5 text-white truncate"
                      style={{ background: CATEGORY_COLORS[ev.category ?? 'other'] ?? '#5A5A5A' }}>
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && <span className="text-[9px] text-tx-light">+{dayEvents.length - 3} more</span>}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EventsSection() {
  const [events, setEvents] = useState<EventFull[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<EventFull | null>(null)
  const [view, setView] = useState<'table' | 'calendar'>('table')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/events')
    const data = await res.json()
    setEvents(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Partial<FormState>) {
    if (editEvent) {
      const res = await fetch(`/api/admin/events/${editEvent.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    } else {
      const res = await fetch('/api/admin/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    }
    setShowForm(false); setEditEvent(null)
    showToast(editEvent ? 'Event updated' : 'Event created')
    load()
  }

  async function handleToggle(ev: EventFull, field: 'is_featured' | 'is_active') {
    await fetch(`/api/admin/events/${ev.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: !ev[field] }),
    })
    load()
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map(id => fetch(`/api/admin/events/${id}`, { method: 'DELETE' })))
    setSelected(new Set()); setConfirmDelete(null)
    showToast(`${ids.length} event(s) deleted`)
    load()
  }

  async function handleBulkToggle(active: boolean) {
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/admin/events/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active }) })
    ))
    setSelected(new Set())
    showToast(`${selected.size} event(s) ${active ? 'activated' : 'deactivated'}`)
    load()
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleAll() {
    setSelected(prev => prev.size === events.length ? new Set() : new Set(events.map(e => e.id)))
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Events</h1>
          <p className="text-sm text-tx-light mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-border rounded-sm overflow-hidden">
            <button onClick={() => setView('table')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === 'table' ? 'bg-navy text-white' : 'text-tx-mid hover:bg-sand'}`}>
              Table
            </button>
            <button onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === 'calendar' ? 'bg-navy text-white' : 'text-tx-mid hover:bg-sand'}`}>
              Calendar
            </button>
          </div>
          <button onClick={() => { setEditEvent(null); setShowForm(true) }}
            className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors">+ New Event</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-navy/5 border border-navy/20 rounded-sm">
          <span className="text-sm font-medium text-navy">{selected.size} selected</span>
          <button onClick={() => handleBulkToggle(true)} className="px-3 py-1.5 text-xs font-semibold bg-teal text-white rounded-sm">Activate all</button>
          <button onClick={() => handleBulkToggle(false)} className="px-3 py-1.5 text-xs font-semibold bg-gray-400 text-white rounded-sm">Deactivate all</button>
          <button onClick={() => setConfirmDelete(Array.from(selected))} className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-sm">Delete selected</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-tx-light hover:text-tx">Clear</button>
        </div>
      )}

      {loading && <p className="text-sm text-tx-light">Loading…</p>}

      {!loading && view === 'calendar' && (
        <CalendarView events={events} onEdit={ev => { setEditEvent(ev); setShowForm(true) }} />
      )}

      {!loading && view === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-3 text-left w-8"><input type="checkbox" checked={selected.size === events.length && events.length > 0} onChange={toggleAll} className="rounded" /></th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Title</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Category</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Date</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Location</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Price</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Featured</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Active</th>
                <th className="pb-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="border-b border-border-light hover:bg-sand/40 transition-colors">
                  <td className="py-2.5 pr-3"><input type="checkbox" checked={selected.has(ev.id)} onChange={() => toggleSelect(ev.id)} className="rounded" /></td>
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-navy">{ev.title}</span>
                    {ev.recurring && <span className="ml-1.5 text-[9px] font-bold text-teal bg-teal/10 px-1 py-0.5 rounded">RECURRING</span>}
                  </td>
                  <td className="py-2.5 pr-4">
                    {ev.category && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ background: CATEGORY_COLORS[ev.category] ?? '#5A5A5A' }}>
                        {ev.category}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-tx-mid">
                    {new Date(ev.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    {!ev.all_day && <span className="ml-1 text-tx-light">{new Date(ev.start_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-tx-light">{ev.location_name ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-xs">{ev.is_free ? <span className="text-teal font-semibold">Free</span> : ev.price_label ?? '—'}</td>
                  <td className="py-2.5 pr-4"><Toggle checked={ev.is_featured} onChange={() => handleToggle(ev, 'is_featured')} /></td>
                  <td className="py-2.5 pr-4"><Toggle checked={ev.is_active} onChange={() => handleToggle(ev, 'is_active')} /></td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditEvent(ev); setShowForm(true) }}
                        className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors">Edit</button>
                      <button onClick={() => setConfirmDelete([ev.id])}
                        className="px-2 py-1 text-[11px] text-red-400 border border-border rounded-sm hover:border-red-300 hover:text-red-500 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-tx-light text-sm">No events yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <EventForm event={editEvent} onSave={handleSave} onClose={() => { setShowForm(false); setEditEvent(null) }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-navy mb-2">Delete {confirmDelete.length} event{confirmDelete.length > 1 ? 's' : ''}?</h3>
            <p className="text-sm text-tx-light mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-border rounded-sm hover:bg-sand">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-sm hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 px-4 py-2.5 bg-navy text-white text-sm rounded-sm shadow-lg z-[70]">{toast}</div>}
    </div>
  )
}
