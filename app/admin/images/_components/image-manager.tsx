'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Format support ─────────────────────────────────────────────────────────────
const SUPPORTED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function getUrlExt(url: string): string {
  return url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
}

function isUrlSupported(url: string): boolean {
  return SUPPORTED_EXTS.has(getUrlExt(url))
}

function getExtBadge(url: string) {
  const ext = getUrlExt(url).toUpperCase() || '?'
  const supported = isUrlSupported(url)
  return { ext, supported }
}

function getFileName(url: string): string {
  return url.split('?')[0].split('/').pop() ?? url
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FolderData {
  name: string
  urls: string[]
  fileNames: string[]
  storagePaths: string[]
}

interface ActivitySummary {
  id: string
  slug: string
  title: string
  category: string
  images: string[] | null
  image_alts: string[] | null
}

interface FolderView {
  folder: FolderData
  activity: ActivitySummary | null
  orderedUrls: string[]
  orderedAlts: string[]
  isDirty: boolean
}

type FilterMode = 'all' | 'supported' | 'unsupported'

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildFolderViews(folders: FolderData[], activities: ActivitySummary[]): FolderView[] {
  return folders.map(folder => {
    const activity = activities.find(a => a.slug === folder.name) ?? null
    let orderedUrls: string[]
    let orderedAlts: string[]

    if (activity && activity.images && activity.images.length > 0) {
      const linkedUrls = activity.images
      const linkedAlts = activity.image_alts ?? []
      const extraUrls  = folder.urls.filter(u => !linkedUrls.includes(u))
      orderedUrls = [...linkedUrls, ...extraUrls]
      orderedAlts = [...linkedAlts, ...extraUrls.map(() => '')]
    } else {
      orderedUrls = [...folder.urls]
      orderedAlts = folder.urls.map(() => '')
    }

    return { folder, activity, orderedUrls, orderedAlts, isDirty: false }
  })
}

// ── Slug Reference Panel ──────────────────────────────────────────────────────
function SlugReference({ activities }: { activities: ActivitySummary[] }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const filtered = activities.filter(a =>
    !filter || a.title.toLowerCase().includes(filter.toLowerCase()) || a.slug.includes(filter.toLowerCase())
  )

  return (
    <div className="mb-5 border border-border rounded-sm bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sand transition-colors"
      >
        <span className="text-[12px] font-semibold text-tx-mid uppercase tracking-wide">
          Activity slug reference
          <span className="ml-2 font-normal normal-case text-tx-light">({activities.length} activities — folder name must match slug exactly)</span>
        </span>
        <span className="text-tx-light text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="px-4 py-2 border-b border-border">
            <input
              type="text"
              placeholder="Filter by title or slug…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors"
            />
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border-light">
            {filtered.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2 hover:bg-sand/50">
                <span className="text-[13px] text-tx">{a.title}</span>
                <span className="text-[12px] font-mono text-tx-mid bg-sand px-2 py-0.5 rounded select-all">{a.slug}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-4 text-sm text-tx-light text-center">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ImageManager() {
  const [views, setViews]           = useState<FolderView[]>([])
  const [activities, setActivities] = useState<ActivitySummary[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  // Per-folder saving/deleting state
  const [saving, setSaving]     = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})

  // Per-folder drag state
  const [dragState, setDragState] = useState<{ folder: string; fromIndex: number } | null>(null)

  // Bulk delete selection (storage paths)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Ref for "View unsupported" scroll target
  const unsupportedRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/images')
      if (!res.ok) { setError(`Failed to load (${res.status})`); setLoading(false); return }
      const { folders, activities } = await res.json()
      setActivities(activities)
      setViews(buildFolderViews(folders, activities))
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalUnsupported = views.reduce(
    (acc, v) => acc + v.orderedUrls.filter(u => !isUrlSupported(u)).length, 0
  )
  const allUnsupportedPaths = views.flatMap(v =>
    v.orderedUrls
      .filter(u => !isUrlSupported(u))
      .map(u => `${v.folder.name}/${getFileName(u)}`)
  )

  // ── Selection helpers ────────────────────────────────────────────────────────
  function toggleSelect(storagePath: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(storagePath) ? next.delete(storagePath) : next.add(storagePath)
      return next
    })
  }

  function selectAllUnsupported() {
    setSelected(new Set(allUnsupportedPaths))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  // ── Reorder ─────────────────────────────────────────────────────────────────
  function handleDragStart(folderName: string, fromIndex: number) {
    setDragState({ folder: folderName, fromIndex })
  }

  function handleDragOver(e: React.DragEvent, folderName: string, toIndex: number) {
    e.preventDefault()
    if (!dragState || dragState.folder !== folderName || dragState.fromIndex === toIndex) return
    setViews(prev => prev.map(v => {
      if (v.folder.name !== folderName) return v
      const urls = [...v.orderedUrls]
      const alts = [...v.orderedAlts]
      const [u] = urls.splice(dragState.fromIndex, 1)
      const [a] = alts.splice(dragState.fromIndex, 1)
      urls.splice(toIndex, 0, u)
      alts.splice(toIndex, 0, a)
      return { ...v, orderedUrls: urls, orderedAlts: alts, isDirty: true }
    }))
    setDragState({ folder: folderName, fromIndex: toIndex })
  }

  function handleDragEnd() { setDragState(null) }

  // ── Set cover ────────────────────────────────────────────────────────────────
  function setCover(folderName: string, index: number) {
    if (index === 0) return
    setViews(prev => prev.map(v => {
      if (v.folder.name !== folderName) return v
      const urls = [...v.orderedUrls]
      const alts = [...v.orderedAlts]
      const [u] = urls.splice(index, 1)
      const [a] = alts.splice(index, 1)
      urls.unshift(u)
      alts.unshift(a)
      return { ...v, orderedUrls: urls, orderedAlts: alts, isDirty: true }
    }))
  }

  // ── Save order ───────────────────────────────────────────────────────────────
  async function saveOrder(view: FolderView) {
    if (!view.activity) return
    setSaving(s => ({ ...s, [view.folder.name]: true }))
    try {
      const res = await fetch(`/api/admin/activities/${view.activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: view.orderedUrls, image_alts: view.orderedAlts }),
      })
      if (!res.ok) {
        const j = await res.json()
        alert(`Save failed: ${j.error}`)
      } else {
        setViews(prev => prev.map(v =>
          v.folder.name === view.folder.name ? { ...v, isDirty: false } : v
        ))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
    setSaving(s => ({ ...s, [view.folder.name]: false }))
  }

  // ── Delete single image ──────────────────────────────────────────────────────
  async function deleteImage(view: FolderView, urlIndex: number, skipConfirm = false) {
    const url = view.orderedUrls[urlIndex]
    const fileName = getFileName(url)
    const storagePath = `${view.folder.name}/${fileName}`

    if (!skipConfirm && !confirm('Delete this image? This cannot be undone.')) return
    setDeleting(d => ({ ...d, [storagePath]: true }))

    try {
      const storageRes = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: storagePath }),
      })
      if (!storageRes.ok) {
        const j = await storageRes.json()
        alert(`Storage delete failed: ${j.error}`)
        setDeleting(d => ({ ...d, [storagePath]: false }))
        return
      }

      if (view.activity) {
        const newUrls = view.orderedUrls.filter((_, i) => i !== urlIndex)
        const newAlts = view.orderedAlts.filter((_, i) => i !== urlIndex)
        await fetch(`/api/admin/activities/${view.activity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: newUrls, image_alts: newAlts }),
        })
      }

      setViews(prev => prev.map(v => {
        if (v.folder.name !== view.folder.name) return v
        const newUrls = v.orderedUrls.filter((_, i) => i !== urlIndex)
        const newAlts = v.orderedAlts.filter((_, i) => i !== urlIndex)
        return { ...v, orderedUrls: newUrls, orderedAlts: newAlts, isDirty: false }
      }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
    setDeleting(d => ({ ...d, [storagePath]: false }))
  }

  // ── Bulk delete selected ─────────────────────────────────────────────────────
  async function deleteSelected() {
    if (selected.size === 0) return
    if (!confirm(`Permanently delete ${selected.size} unsupported image${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return

    setBulkDeleting(true)
    const paths = Array.from(selected)

    // Delete from storage
    await Promise.all(paths.map(path =>
      fetch('/api/admin/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
    ))

    // Update affected activities — group paths by folder
    const byFolder: Record<string, string[]> = {}
    for (const path of paths) {
      const [folder, ...rest] = path.split('/')
      const file = rest.join('/')
      ;(byFolder[folder] ??= []).push(file)
    }

    for (const [folderName, fileNames] of Object.entries(byFolder)) {
      const view = views.find(v => v.folder.name === folderName)
      if (!view?.activity) continue
      const newUrls = view.orderedUrls.filter(u => !fileNames.includes(getFileName(u)))
      const newAlts = view.orderedAlts.filter((_, i) => !fileNames.includes(getFileName(view.orderedUrls[i])))
      await fetch(`/api/admin/activities/${view.activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newUrls, image_alts: newAlts }),
      })
    }

    await load()
    setBulkDeleting(false)
  }

  // ── Delete folder ─────────────────────────────────────────────────────────────
  async function deleteFolder(view: FolderView) {
    const { name } = view.folder
    if (!confirm(`Delete all images in "${name}"? This cannot be undone.`)) return
    setDeleting(d => ({ ...d, [`folder:${name}`]: true }))

    try {
      const storageRes = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: name }),
      })
      if (!storageRes.ok) {
        const j = await storageRes.json()
        alert(`Storage delete failed: ${j.error}`)
        setDeleting(d => ({ ...d, [`folder:${name}`]: false }))
        return
      }

      if (view.activity) {
        await fetch(`/api/admin/activities/${view.activity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: [], image_alts: [] }),
        })
      }

      setViews(prev => prev.filter(v => v.folder.name !== name))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
    setDeleting(d => ({ ...d, [`folder:${name}`]: false }))
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-white rounded border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 text-sm text-red-600 flex items-center justify-between">
        {error}
        <button onClick={load} className="text-xs font-semibold text-red-700 underline ml-4">Retry</button>
      </div>
    )
  }

  const linked   = views.filter(v => v.activity !== null)
  const unlinked = views.filter(v => v.activity === null)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Image Manager</h1>
          <p className="text-sm text-tx-mid mt-0.5">
            {views.length} folder{views.length !== 1 ? 's' : ''} in storage
            {unlinked.length > 0 && ` · ${unlinked.length} unlinked`}
          </p>
        </div>
        <button
          onClick={load}
          className="w-full sm:w-auto px-4 py-2 border border-border rounded-sm text-sm text-tx-mid hover:text-navy hover:border-navy transition-colors"
        >
          Refresh
        </button>
      </div>

      {views.length === 0 && (
        <div className="text-center py-16 text-tx-mid text-sm bg-white rounded border border-border">
          No folders found in activity-images bucket.
        </div>
      )}

      {/* Unsupported files banner */}
      {totalUnsupported > 0 && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700 flex items-center justify-between gap-3">
          <span>
            <strong>{totalUnsupported} image{totalUnsupported > 1 ? 's' : ''}</strong> have unsupported formats and won&apos;t appear in the app.
          </span>
          <button
            type="button"
            onClick={() => {
              setFilterMode('unsupported')
              setTimeout(() => unsupportedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
            }}
            className="text-red-700 font-semibold underline whitespace-nowrap hover:text-red-800"
          >
            View unsupported ↓
          </button>
        </div>
      )}

      <SlugReference activities={activities} />

      {/* Unlinked warning */}
      {unlinked.length > 0 && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-sm text-sm text-amber-800">
          {unlinked.length} folder{unlinked.length !== 1 ? 's' : ''} not matched to any activity slug — upload the images and link them manually, or rename the folder to match an activity slug.
        </div>
      )}

      {/* Filter toggle */}
      {views.length > 0 && (
        <div className="mb-5 flex items-center gap-1">
          {(['all', 'supported', 'unsupported'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-sm border transition-colors capitalize ${
                filterMode === mode
                  ? mode === 'unsupported'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-navy border-navy text-white'
                  : 'bg-white border-border text-tx-mid hover:border-navy hover:text-navy'
              }`}
            >
              {mode}
              {mode === 'unsupported' && totalUnsupported > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1 py-0.5 rounded ${filterMode === 'unsupported' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                  {totalUnsupported}
                </span>
              )}
            </button>
          ))}

          {/* Bulk delete controls — only in unsupported mode */}
          {filterMode === 'unsupported' && totalUnsupported > 0 && (
            <div className="ml-auto flex items-center gap-2">
              {selected.size === 0 ? (
                <button
                  type="button"
                  onClick={selectAllUnsupported}
                  className="text-[12px] font-semibold text-tx-mid hover:text-navy underline"
                >
                  Select all ({totalUnsupported})
                </button>
              ) : (
                <>
                  <span className="text-[12px] text-tx-mid">{selected.size} selected</span>
                  <button type="button" onClick={clearSelection} className="text-[11px] text-tx-light hover:text-tx underline">
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={bulkDeleting}
                    className="px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Folder cards */}
      <div className="space-y-6" ref={unsupportedRef}>
        {views.map(view => {
          const { folder, activity, orderedUrls, orderedAlts, isDirty } = view
          const isUnlinked = !activity
          const isFolderDeleting = deleting[`folder:${folder.name}`]

          // Apply filter
          const displayIndices = orderedUrls.reduce<number[]>((acc, url, i) => {
            if (filterMode === 'supported'   &&  isUrlSupported(url)) acc.push(i)
            else if (filterMode === 'unsupported' && !isUrlSupported(url)) acc.push(i)
            else if (filterMode === 'all') acc.push(i)
            return acc
          }, [])

          if (displayIndices.length === 0) return null

          return (
            <div
              key={folder.name}
              className={`bg-white rounded border ${isUnlinked ? 'border-amber-300' : 'border-border'} overflow-hidden`}
            >
              {/* Folder header */}
              <div className={`px-4 py-3 flex items-center justify-between ${isUnlinked ? 'bg-amber-50' : 'bg-sand'} border-b ${isUnlinked ? 'border-amber-200' : 'border-border'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[13px] text-navy">📁 {folder.name}</span>
                    {isUnlinked ? (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wide">Unlinked</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-teal/15 text-teal px-1.5 py-0.5 rounded uppercase tracking-wide">Linked</span>
                    )}
                  </div>
                  {activity && (
                    <p className="text-[12px] text-tx-mid mt-0.5">
                      {activity.title}
                      <span className="ml-1.5 text-[11px] text-tx-light font-mono">{activity.slug}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-tx-light mt-0.5">
                    {orderedUrls.length} image{orderedUrls.length !== 1 ? 's' : ''}
                    {filterMode !== 'all' && ` · showing ${displayIndices.length}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isDirty && activity && (
                    <button
                      onClick={() => saveOrder(view)}
                      disabled={saving[folder.name]}
                      className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-light disabled:opacity-50 transition-colors"
                    >
                      {saving[folder.name] ? 'Saving…' : 'Save Order'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteFolder(view)}
                    disabled={isFolderDeleting}
                    className="px-3 py-1.5 border border-red-200 text-red-500 text-xs font-semibold rounded-sm hover:bg-red-50 disabled:opacity-40 transition-colors"
                  >
                    {isFolderDeleting ? 'Deleting…' : 'Delete Folder'}
                  </button>
                </div>
              </div>

              {/* Image grid */}
              <div className="p-3 flex flex-wrap gap-2">
                {displayIndices.map(i => {
                  const url       = orderedUrls[i]
                  const fileName  = getFileName(url)
                  const storagePath = `${folder.name}/${fileName}`
                  const isDeleting  = deleting[storagePath]
                  const isDragging  = dragState?.folder === folder.name && dragState.fromIndex === i
                  const { ext, supported } = getExtBadge(url)
                  const isChecked = selected.has(storagePath)

                  return (
                    <div
                      key={url}
                      draggable={supported} // don't allow reordering unsupported
                      onDragStart={() => supported && handleDragStart(folder.name, i)}
                      onDragOver={e => supported && handleDragOver(e, folder.name, i)}
                      onDragEnd={handleDragEnd}
                      className={`relative group transition-all ${
                        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
                      } ${supported ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      {/* Thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={supported ? url : undefined}
                        alt={orderedAlts[i] || folder.name}
                        draggable={false}
                        className={`w-28 h-20 object-cover rounded-sm border ${
                          supported
                            ? 'border-border'
                            : 'border-red-200 opacity-40 bg-red-50'
                        }`}
                      />

                      {/* Placeholder for unsupported (can't render) */}
                      {!supported && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 rounded-sm">
                          <span className="text-lg">⚠️</span>
                          <span className="text-[9px] font-mono text-red-500 mt-0.5">{ext}</span>
                        </div>
                      )}

                      {/* Format badge */}
                      <span className={`absolute top-1 right-1 text-[8px] font-bold px-1 py-0.5 rounded leading-none ${
                        supported
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {ext}
                      </span>

                      {/* Cover badge */}
                      {i === 0 && supported && (
                        <span className="absolute top-1 left-1 bg-navy text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none pointer-events-none">
                          ★ COVER
                        </span>
                      )}

                      {/* Filename label */}
                      <div className="mt-1 w-28 text-[9px] text-tx-light font-mono truncate" title={fileName}>
                        {fileName}
                      </div>

                      {/* Checkbox for unsupported (visible in unsupported filter mode) */}
                      {!supported && filterMode === 'unsupported' && (
                        <button
                          type="button"
                          onClick={() => toggleSelect(storagePath)}
                          className={`absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                            isChecked
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-white/90 border-gray-400 text-transparent hover:border-red-400'
                          }`}
                        >
                          ✓
                        </button>
                      )}

                      {/* Hover overlay actions */}
                      <div className="absolute inset-0 mb-5 bg-black/0 group-hover:bg-black/30 transition-colors rounded-sm flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {i !== 0 && supported && (
                          <button
                            type="button"
                            onClick={() => setCover(folder.name, i)}
                            title="Set as cover"
                            className="w-6 h-6 bg-white/90 rounded-full text-[11px] font-bold text-navy flex items-center justify-center hover:bg-white"
                          >
                            ★
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteImage(view, i)}
                          disabled={isDeleting}
                          title="Delete image"
                          className="w-6 h-6 bg-red-500/90 rounded-full text-[11px] font-bold text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>

                      {isDeleting && (
                        <div className="absolute inset-0 mb-5 bg-white/70 rounded-sm flex items-center justify-center">
                          <span className="text-[10px] text-tx-mid">…</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Unlinked hint */}
              {isUnlinked && (
                <div className="px-4 py-2.5 border-t border-amber-200 bg-amber-50/60 text-[11px] text-amber-700">
                  Folder name must match an activity slug to auto-link. Current name: <span className="font-mono font-semibold">{folder.name}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
