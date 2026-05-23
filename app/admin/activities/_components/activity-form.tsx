'use client'

import { useState, useRef } from 'react'
import type { Activity, Provider } from '@/lib/types'
import { CATEGORY_LABELS, MOOD_LABELS } from '@/lib/utils'
import { FocalPointPicker, type FocalPoint } from '@/components/admin/FocalPointPicker'
import { ImageUploadGuide } from '@/components/admin/ImageUploadGuide'

type FormData = Omit<Activity, 'id' | 'created_at' | 'updated_at'> & { notify_guests?: boolean }

interface Props {
  activity: Activity | null
  providers: Provider[]
  onSave: (data: Partial<FormData>) => Promise<void>
  onClose: () => void
}

interface ImageItem {
  url: string
  alt: string
}

interface ActivitySlim {
  id: string
  slug: string
  title: string
  category: string
}

// ── File type validation ──────────────────────────────────────────────────
const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif',
}

function getEffectiveMime(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

function initImages(activity: Activity | null): ImageItem[] {
  const urls  = activity?.images ?? []
  const alts  = activity?.image_alts ?? []
  return urls.map((url, i) => ({ url, alt: alts[i] ?? '' }))
}

export function ActivityForm({ activity, providers, onSave, onClose }: Props) {
  const fileInputRef         = useRef<HTMLInputElement>(null)
  const coverInputRef        = useRef<HTMLInputElement>(null)
  const folderInputRef       = useRef<HTMLInputElement>(null)
  const [saving, setSaving]               = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState('')
  const [error, setError]                 = useState('')
  const [uploadError, setUploadError]     = useState('')
  const [dragIndex, setDragIndex]         = useState<number | null>(null)

  const [imageWide,   setImageWide]   = useState<string | null>(activity?.image_wide   ?? null)
  const [imageSquare, setImageSquare] = useState<string | null>(activity?.image_square ?? null)
  const [focalSq, setFocalSq] = useState<FocalPoint | null>(
    activity?.focal_sq_x != null && activity?.focal_sq_y != null
      ? { x: activity.focal_sq_x, y: activity.focal_sq_y }
      : null
  )

  // Folder upload state
  const [folderName, setFolderName]           = useState<string | null>(null)
  const [folderMatch, setFolderMatch]         = useState<ActivitySlim | null | undefined>(undefined) // undefined = not checked yet
  const [folderFiles, setFolderFiles]         = useState<File[]>([])
  const [folderUploading, setFolderUploading] = useState(false)
  const [folderProgress, setFolderProgress]   = useState(0)
  const [folderError, setFolderError]         = useState('')
  const [folderSuccess, setFolderSuccess]     = useState('')

  const [imageItems, setImageItems] = useState<ImageItem[]>(() => initImages(activity))
  const [notifyGuests, setNotifyGuests] = useState(false)
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(
    activity?.focal_x != null && activity?.focal_y != null
      ? { x: activity.focal_x, y: activity.focal_y }
      : null
  )

  const [form, setForm] = useState({
    title:               activity?.title ?? '',
    slug:                activity?.slug ?? '',
    description:         activity?.description ?? '',
    category:            activity?.category ?? 'on_water',
    secondary_categories: activity?.secondary_categories ?? ([] as string[]),
    region:              (activity?.region ?? 'chania') as string,
    tier_visibility:     activity?.tier_visibility ?? (['B', 'M', 'P'] as string[]),
    price_from:          activity?.price_from?.toString() ?? '',
    price_to:            activity?.price_to?.toString() ?? '',
    currency:            activity?.currency ?? 'EUR',
    duration:            activity?.duration ?? '',
    season:              activity?.season ?? '',
    availability_text:   activity?.availability_text ?? '',
    max_group_size:      activity?.max_group_size?.toString() ?? '',
    languages:           activity?.languages?.join(', ') ?? 'en',
    meeting_point:       activity?.meeting_point ?? '',
    meeting_coords:      activity?.meeting_coords ?? '',
    includes:            activity?.includes?.join('\n') ?? '',
    not_included:        activity?.not_included?.join('\n') ?? '',
    external_rating:     activity?.external_rating?.toString() ?? '',
    external_rating_count: activity?.external_rating_count?.toString() ?? '',
    external_rating_source: activity?.external_rating_source ?? '',
    good_to_know:        activity?.good_to_know ?? '',
    cancellation_policy: activity?.cancellation_policy ?? 'Free cancellation up to 24 hours',
    provider_id:         activity?.provider_id ?? '',
    item_type:           activity?.item_type ?? 'activity',
    sort_order:          activity?.sort_order?.toString() ?? '0',
    is_featured:         activity?.is_featured ?? false,
    is_active:           activity?.is_active ?? true,
    is_boat_activity:    activity?.is_boat_activity ?? false,
    mood_tags:           activity?.mood_tags ?? ([] as string[]),
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

  function toggleSecondaryCategory(cat: string) {
    set(
      'secondary_categories',
      form.secondary_categories.includes(cat)
        ? form.secondary_categories.filter(c => c !== cat)
        : [...form.secondary_categories, cat]
    )
  }

  function toggleMoodTag(mood: string) {
    set(
      'mood_tags',
      form.mood_tags.includes(mood)
        ? form.mood_tags.filter(m => m !== mood)
        : [...form.mood_tags, mood]
    )
  }

  // ── Cover image upload (Sharp variants) ──────────────────────────────────
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (coverInputRef.current) coverInputRef.current.value = ''

    const mime = getEffectiveMime(file)
    if (!SUPPORTED_MIME.has(mime)) {
      setCoverUploadError(`Unsupported format — use JPG, WebP, or AVIF`)
      return
    }
    setCoverUploadError('')
    setUploadingCover(true)

    const slug = form.slug || slugify(form.title) || undefined
    const fd = new globalThis.FormData()
    fd.append('file', file)
    if (slug) fd.append('slug', slug)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.wide && json.square) {
        setImageWide(json.wide)
        setImageSquare(json.square)
      } else {
        setCoverUploadError(json.error ?? 'Upload failed')
      }
    } catch (err) {
      setCoverUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploadingCover(false)
  }

  // ── Multi-image upload ────────────────────────────────────────────────────
  async function handleFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadError('')

    // Filter by MIME type client-side before sending to server
    const rejected: string[] = []
    const toUpload: File[] = []
    for (const file of files) {
      const mime = getEffectiveMime(file)
      if (!SUPPORTED_MIME.has(mime)) {
        const ext = file.name.split('.').pop()?.toUpperCase() ?? 'unknown'
        rejected.push(`${file.name} — ${ext} format is not supported. Please convert to JPG, WebP, or AVIF.`)
      } else {
        toUpload.push(file)
      }
    }

    if (rejected.length) setUploadError(rejected.join('\n'))
    if (!toUpload.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const slug = form.slug || slugify(form.title) || undefined
    const title = form.title || undefined

    setUploadingCount(toUpload.length)

    const results = await Promise.allSettled(
      toUpload.map(async (file) => {
        const fd = new globalThis.FormData()
        fd.append('file', file)
        if (slug)  fd.append('slug',  slug)
        if (title) fd.append('title', title)

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        let json: Record<string, string>
        try {
          json = await res.json()
        } catch {
          throw new Error(`Server error ${res.status} — check Vercel logs`)
        }
        if (!json.url) throw new Error(json.error ?? `Upload failed (${res.status})`)
        return { url: json.url, alt: '' } as ImageItem
      })
    )

    setUploadingCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''

    const succeeded: ImageItem[] = []
    const uploadFailed: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') succeeded.push(r.value)
      else uploadFailed.push(r.reason instanceof Error ? r.reason.message : 'Upload failed')
    }

    if (succeeded.length) setImageItems(prev => [...prev, ...succeeded])
    if (uploadFailed.length) {
      const existing = rejected.length ? rejected.join('\n') + '\n' : ''
      setUploadError(existing + uploadFailed.join('\n'))
    }
  }

  // ── Folder upload ─────────────────────────────────────────────────────────
  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (folderInputRef.current) folderInputRef.current.value = ''

    setFolderError('')
    setFolderSuccess('')
    setFolderMatch(undefined)

    // Extract folder name from first file's webkitRelativePath (e.g. "slug/photo.jpg" → "slug")
    const firstPath = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath ?? ''
    const detectedFolder = firstPath.split('/')[0] || files[0].name.split('.')[0]
    setFolderName(detectedFolder)
    setFolderFiles(files)

    // Check if folder name matches any activity slug
    try {
      const res = await fetch('/api/admin/activities')
      if (res.ok) {
        const all: ActivitySlim[] = await res.json()
        const matched = all.find(a => a.slug === detectedFolder) ?? null
        setFolderMatch(matched)
      }
    } catch {
      // Non-fatal — just show no match
      setFolderMatch(null)
    }
  }

  async function handleFolderUpload() {
    if (!folderFiles.length || !folderName) return
    setFolderUploading(true)
    setFolderError('')
    setFolderSuccess('')
    setFolderProgress(0)

    // Filter unsupported types before uploading
    const rejectedFiles: string[] = []
    const validFiles: File[] = []
    for (const file of folderFiles) {
      const mime = getEffectiveMime(file)
      if (!SUPPORTED_MIME.has(mime)) {
        const ext = file.name.split('.').pop()?.toUpperCase() ?? 'unknown'
        rejectedFiles.push(`${file.name} — ${ext} not supported (use JPG, WebP, or AVIF)`)
      } else {
        validFiles.push(file)
      }
    }

    if (rejectedFiles.length) {
      setFolderError(`${rejectedFiles.length} file${rejectedFiles.length > 1 ? 's' : ''} skipped (unsupported format — convert to JPG or WebP): ${rejectedFiles.join(', ')}`)
    }

    if (validFiles.length === 0) {
      setFolderUploading(false)
      return
    }

    const uploadedUrls: string[] = []
    let done = 0

    for (const file of validFiles) {
      try {
        const fd = new globalThis.FormData()
        fd.append('file', file)
        fd.append('slug', folderName)
        if (form.title) fd.append('title', form.title)

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        let json: Record<string, string>
        try { json = await res.json() } catch { json = { error: `Server error ${res.status}` } }
        if (json.url) uploadedUrls.push(json.url)
        else if (json.error) { setFolderError(e => e ? `${e}\n${json.error}` : json.error); break }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setFolderError(e => e ? `${e}\n${msg}` : msg)
        break
      }
      done++
      setFolderProgress(Math.round((done / validFiles.length) * 100))
    }

    setFolderUploading(false)

    if (uploadedUrls.length === 0) return

    // If matched activity, link images via API
    if (folderMatch) {
      const alts = uploadedUrls.map((_, i) =>
        `${folderMatch.title} — ${folderMatch.category} experience, photo ${i + 1}`
      )
      const linkRes = await fetch('/api/admin/images/link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: folderMatch.id, urls: uploadedUrls, alts }),
      })
      const linkJson = await linkRes.json()
      if (linkRes.ok) {
        setFolderSuccess(
          `${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded and linked to "${folderMatch.title}"`
        )
      } else {
        setFolderError(`Uploaded but failed to link: ${linkJson.error}`)
      }
    } else {
      setFolderSuccess(
        `${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded to activity-images/${folderName}/ — not linked to any activity`
      )
    }

    // Reset
    setFolderFiles([])
    setFolderName(null)
    setFolderMatch(undefined)
  }

  function clearFolderSelection() {
    setFolderFiles([])
    setFolderName(null)
    setFolderMatch(undefined)
    setFolderError('')
    setFolderSuccess('')
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  function updateAlt(index: number, alt: string) {
    setImageItems(prev => prev.map((item, i) => i === index ? { ...item, alt } : item))
  }

  function removeImage(index: number) {
    setImageItems(prev => prev.filter((_, i) => i !== index))
  }

  function setCover(index: number) {
    if (index === 0) return
    setImageItems(prev => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setImageItems(prev => {
      const next = [...prev]
      const [item] = next.splice(dragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setDragIndex(index)
  }

  function handleDragEnd() {
    setDragIndex(null)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload: Partial<FormData> = {
        title:               form.title,
        slug:                form.slug || slugify(form.title),
        description:         form.description,
        category:            form.category as Activity['category'],
        region:              form.region as Activity['region'],
        tier_visibility:     form.tier_visibility as Activity['tier_visibility'],
        price_from:          form.price_from ? parseFloat(form.price_from) : null,
        price_to:            form.price_to ? parseFloat(form.price_to) : null,
        currency:            form.currency,
        duration:            form.duration || null,
        season:              form.season || null,
        availability_text:   form.availability_text || null,
        max_group_size:      form.max_group_size ? parseInt(form.max_group_size) : null,
        languages:           form.languages.split(',').map((l: string) => l.trim()).filter(Boolean),
        meeting_point:       form.meeting_point || null,
        meeting_coords:      form.meeting_coords || null,
        includes:            form.includes ? form.includes.split('\n').map((l: string) => l.trim()).filter(Boolean) : null,
        not_included:        form.not_included ? form.not_included.split('\n').map((l: string) => l.trim()).filter(Boolean) : null,
        external_rating:     form.external_rating ? parseFloat(form.external_rating) : null,
        external_rating_count: form.external_rating_count ? parseInt(form.external_rating_count) : null,
        external_rating_source: form.external_rating_source || null,
        good_to_know:        form.good_to_know || null,
        cancellation_policy: form.cancellation_policy || null,
        provider_id:         form.provider_id || null,
        secondary_categories: form.secondary_categories.length > 0 ? form.secondary_categories : null,
        images:              imageItems.map(i => i.url),
        image_alts:          imageItems.map(i => i.alt),
        image_wide:          imageWide,
        image_square:        imageSquare,
        focal_x:             focalPoint?.x ?? null,
        focal_y:             focalPoint?.y ?? null,
        focal_sq_x:          focalSq?.x ?? null,
        focal_sq_y:          focalSq?.y ?? null,
        item_type:           form.item_type as 'activity' | 'service',
        sort_order:          parseInt(form.sort_order) || 0,
        is_featured:         form.is_featured,
        is_active:           form.is_active,
        is_boat_activity:    form.is_boat_activity,
        mood_tags:           form.mood_tags.length > 0 ? form.mood_tags : [],
        notify_guests:       notifyGuests,
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
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
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
              <div className="col-span-2">
                <label className={LABEL}>Secondary Categories</label>
                <p className="text-[11px] text-tx-light mb-2">Activity also appears under these categories</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([key]) => key !== form.category)
                    .map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleSecondaryCategory(key)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-colors ${
                          form.secondary_categories.includes(key)
                            ? 'bg-navy text-white border-navy'
                            : 'bg-white text-tx-mid border-border hover:border-navy/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Mood Tags</label>
                <p className="text-[11px] text-tx-light mb-2">Select all moods that apply to this activity</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(MOOD_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleMoodTag(key)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-colors ${
                        form.mood_tags.includes(key)
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-tx-mid border-border hover:border-navy/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                <label className={LABEL}>Not Included (one per line)</label>
                <textarea
                  className={`${INPUT} resize-y`}
                  rows={3}
                  placeholder={"Guide\nFood\nTransport to meeting point"}
                  value={form.not_included}
                  onChange={e => set('not_included', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>External Rating (e.g. from GYG)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className={INPUT}
                    placeholder="4.9"
                    value={form.external_rating}
                    onChange={e => set('external_rating', e.target.value)}
                  />
                  <input
                    type="number"
                    className={INPUT}
                    placeholder="274 reviews"
                    value={form.external_rating_count}
                    onChange={e => set('external_rating_count', e.target.value)}
                  />
                  <input
                    className={INPUT}
                    placeholder="GYG / TripAdvisor"
                    value={form.external_rating_source}
                    onChange={e => set('external_rating_source', e.target.value)}
                  />
                </div>
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

          {/* Cover Image (Sharp variants) */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Cover Image</h3>
            <ImageUploadGuide />

            {/* Wide + Square previews */}
            {(imageWide || imageSquare) && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {imageWide && (
                  <div>
                    <p className="text-[10px] font-bold text-tx-light uppercase tracking-wide mb-1">Wide (1200×675)</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageWide} alt="" className="w-full rounded-sm border border-border" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setImageWide(null)}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-600">Remove</button>
                  </div>
                )}
                {imageSquare && (
                  <div>
                    <p className="text-[10px] font-bold text-tx-light uppercase tracking-wide mb-1">Square (600×600)</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSquare} alt="" className="w-full rounded-sm border border-border" style={{ aspectRatio: '1/1', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setImageSquare(null)}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-600">Remove</button>
                  </div>
                )}
              </div>
            )}

            {/* Focal point pickers */}
            {imageWide && (
              <div className="mb-3">
                <FocalPointPicker
                  imageUrl={imageWide}
                  focalPoint={focalPoint}
                  onChange={setFocalPoint}
                  aspect="16/9"
                  label="Wide focal point — drag to set hero crop anchor"
                />
              </div>
            )}
            {imageSquare && (
              <div className="mb-3">
                <FocalPointPicker
                  imageUrl={imageSquare}
                  focalPoint={focalSq}
                  onChange={setFocalSq}
                  aspect="1/1"
                  label="Square focal point — drag to set thumbnail crop anchor"
                />
              </div>
            )}

            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
              className="px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
              {uploadingCover ? 'Processing…' : imageWide ? '↺ Replace Cover' : '+ Upload Cover Image'}
            </button>
            {coverUploadError && <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-sm">{coverUploadError}</p>}
          </section>

          {/* Images */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">
              Gallery Images
              {imageItems.length > 0 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-tx-light">
                  — drag to reorder · first image is cover
                </span>
              )}
            </h3>

            {/* Image grid */}
            {imageItems.length > 0 && (
              <div className="space-y-2 mb-3">
                {imageItems.map((item, i) => (
                  <div
                    key={item.url}
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`flex gap-3 items-start p-2 border rounded-sm cursor-grab active:cursor-grabbing transition-colors ${
                      dragIndex === i ? 'border-navy bg-sand' : 'border-border bg-white hover:border-navy/40'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="w-20 h-14 object-cover rounded-sm"
                      />
                      {i === 0 && (
                        <span className="absolute top-0.5 left-0.5 bg-navy text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none">
                          COVER
                        </span>
                      )}
                    </div>

                    {/* Alt text */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-bold text-tx-light uppercase tracking-wide mb-1">
                        Alt text (SEO)
                      </label>
                      <input
                        type="text"
                        placeholder="Describe this image…"
                        value={item.alt}
                        onChange={e => updateAlt(i, e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => setCover(i)}
                          title="Set as cover"
                          className="text-[11px] text-tx-mid hover:text-navy px-1.5 py-1 border border-border rounded-sm hover:border-navy transition-colors"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        title="Remove"
                        className="text-[11px] text-tx-light hover:text-red-500 px-1.5 py-1 border border-border rounded-sm hover:border-red-300 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCount > 0}
              className="px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
            >
              {uploadingCount > 0
                ? `Uploading ${uploadingCount} image${uploadingCount > 1 ? 's' : ''}…`
                : '+ Upload Images'}
            </button>
            {uploadError && (
              <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-sm">{uploadError}</p>
            )}
          </section>

          {/* Folder / Bulk Import */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Bulk Import (Folder)</h3>
            <p className="text-[12px] text-tx-light mb-3">
              Select a folder named after an activity slug — images upload to Supabase Storage and auto-link to the matching activity.
            </p>

            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error — webkitdirectory is not in HTMLInputElement types
              webkitdirectory=""
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFolderSelect}
            />

            {!folderName ? (
              <button
                type="button"
                onClick={() => { setFolderSuccess(''); setFolderError(''); folderInputRef.current?.click() }}
                className="px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors"
              >
                + Upload Folder
              </button>
            ) : (
              <div className="border border-border rounded-sm p-3 space-y-2.5">
                {/* Folder name */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-tx">
                    📁 {folderName}
                    <span className="font-normal text-tx-light ml-1.5">({folderFiles.length} files)</span>
                  </span>
                  <button type="button" onClick={clearFolderSelection} className="text-[11px] text-tx-light hover:text-red-500">
                    Clear
                  </button>
                </div>

                {/* Match status */}
                {folderMatch === undefined && (
                  <p className="text-[12px] text-tx-light">Checking slug match…</p>
                )}
                {folderMatch && (
                  <p className="text-[12px] text-teal bg-teal/10 px-2.5 py-1.5 rounded-sm">
                    Folder matched to: <strong>{folderMatch.title}</strong> — images will be linked to this activity
                  </p>
                )}
                {folderMatch === null && (
                  <p className="text-[12px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-sm">
                    No activity found with slug &ldquo;{folderName}&rdquo; — images will upload but not auto-link
                  </p>
                )}

                {/* Progress bar */}
                {folderUploading && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal transition-all duration-300"
                      style={{ width: `${folderProgress}%` }}
                    />
                  </div>
                )}

                {/* Upload button */}
                {!folderUploading && folderMatch !== undefined && (
                  <button
                    type="button"
                    onClick={handleFolderUpload}
                    disabled={folderUploading}
                    className="px-4 py-1.5 bg-navy text-white text-sm font-medium rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50"
                  >
                    {folderUploading ? `Uploading… ${folderProgress}%` : `Upload ${folderFiles.length} images`}
                  </button>
                )}
              </div>
            )}

            {folderError && (
              <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-sm">{folderError}</p>
            )}
            {folderSuccess && (
              <p className="mt-2 text-xs text-teal bg-teal/10 px-3 py-1.5 rounded-sm">{folderSuccess}</p>
            )}
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
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_boat_activity} onChange={e => set('is_boat_activity', e.target.checked)} className="rounded" />
                  <div>
                    <span className="text-sm text-tx font-medium">Boat Activity</span>
                    <p className="text-[11px] text-tx-light">Mark to include in Boat Rentals daily experiences</p>
                  </div>
                </label>
              </div>
              {!activity && (
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={notifyGuests} onChange={e => setNotifyGuests(e.target.checked)} className="rounded" />
                    <div>
                      <span className="text-sm text-tx font-medium">Notify guests</span>
                      <p className="text-[11px] text-tx-light">Send a push notification to all guests on publish</p>
                    </div>
                  </label>
                </div>
              )}
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
