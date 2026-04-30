'use client'

import { useState, useEffect, useRef } from 'react'
import { slugify } from '@/lib/slugify'
import type { ArticleFull } from '@/lib/types'
import { FocalPointPicker, type FocalPoint } from '@/components/admin/FocalPointPicker'

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const CATEGORIES = ['local_guide','food_drink','culture','adventure','beaches','tips','seasonal','other']

const CATEGORY_LABELS: Record<string, string> = {
  local_guide: '📍 Local Guide', food_drink: '🍽️ Food & Drink', culture: '🏛 Culture',
  adventure: '🧗 Adventure', beaches: '🏖️ Beaches', tips: '💡 Tips',
  seasonal: '🌸 Seasonal', other: '📄 Other',
}

const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' }
function getEffectiveMime(f: File) {
  if (f.type && f.type !== 'application/octet-stream') return f.type
  return EXT_MIME[f.name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function statusBadge(article: ArticleFull) {
  if (!article.is_active) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">Draft</span>
  const pub = article.published_at ? new Date(article.published_at) : null
  if (pub && pub > new Date()) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">Scheduled</span>
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Published</span>
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function estimatedReadTime(text: string): number {
  return Math.max(1, Math.ceil(wordCount(text) / 200))
}

type FormState = Omit<ArticleFull, 'id' | 'created_at'>

function emptyForm(): FormState {
  return {
    title: '', slug: '', subtitle: null, body: null, excerpt: null, category: null,
    author: 'Island Key', author_bio: null, read_time_minutes: null,
    cover_image: null, images: null, tags: null,
    meta_title: null, meta_description: null, og_image: null,
    region: 'chania', is_featured: false, is_active: true,
    sort_order: 0, published_at: new Date().toISOString(),
    focal_x: null, focal_y: null,
  }
}

function ArticleEditor({ article, onSave, onClose }: {
  article: ArticleFull | null
  onSave: (d: Partial<FormState>) => Promise<void>
  onClose: () => void
}) {
  const coverRef = useRef<HTMLInputElement>(null)
  const bodyImgRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [seoOpen, setSeoOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [scheduleMode, setScheduleMode] = useState(false)
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(
    article?.focal_x != null && article?.focal_y != null
      ? { x: article.focal_x, y: article.focal_y }
      : null
  )

  const [form, setForm] = useState<FormState>(() => article ? {
    title: article.title, slug: article.slug, subtitle: article.subtitle, body: article.body,
    excerpt: article.excerpt, category: article.category, author: article.author,
    author_bio: article.author_bio, read_time_minutes: article.read_time_minutes,
    cover_image: article.cover_image, images: article.images, tags: article.tags,
    meta_title: article.meta_title, meta_description: article.meta_description, og_image: article.og_image,
    region: article.region, is_featured: article.is_featured, is_active: article.is_active,
    sort_order: article.sort_order, published_at: article.published_at,
    focal_x: article.focal_x ?? null, focal_y: article.focal_y ?? null,
  } : emptyForm())

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    set('title', title)
    if (!article) set('slug', slugify(title))
    if (!form.meta_title) set('meta_title', title)
  }

  const wc = wordCount(form.body ?? '')
  const readTime = estimatedReadTime(form.body ?? '')

  function addTag() {
    if (!tagInput.trim()) return
    const tags = form.tags ?? []
    if (!tags.includes(tagInput.trim())) set('tags', [...tags, tagInput.trim()])
    setTagInput('')
  }

  function removeTag(tag: string) {
    set('tags', (form.tags ?? []).filter(t => t !== tag))
  }

  async function uploadCover(file: File) {
    if (!SUPPORTED_MIME.has(getEffectiveMime(file))) { setUploadError('Unsupported format — use JPG, WebP, AVIF'); return }
    setUploadingCover(true); setUploadError('')
    const slug = form.slug || slugify(form.title) || undefined
    const fd = new globalThis.FormData()
    fd.append('file', file)
    if (slug) fd.append('slug', slug)
    fd.append('bucket', 'article-images')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    setUploadingCover(false)
    if (json.url) { set('cover_image', json.url); if (!form.og_image) set('og_image', json.url) }
    else setUploadError(json.error ?? 'Upload failed')
  }

  async function handleSubmit() {
    setError(''); setSaving(true)
    try {
      const payload: Partial<FormState> = {
        ...form,
        read_time_minutes: form.read_time_minutes ?? readTime,
        meta_title: form.meta_title || form.title,
        meta_description: form.meta_description || form.excerpt || null,
        og_image: form.og_image || form.cover_image,
        sort_order: Number(form.sort_order) || 0,
        focal_x: focalPoint?.x ?? null,
        focal_y: focalPoint?.y ?? null,
      }
      await onSave(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-tx-light hover:text-navy text-sm">← Back</button>
          <h2 className="font-display text-base text-navy">{article ? 'Edit Article' : 'New Article'}</h2>
        </div>
        <div className="flex items-center gap-3">
          {form.slug && (
            <a href={`/insights/${form.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-tx-mid hover:text-navy border border-border px-3 py-1.5 rounded-sm">Preview ↗</a>
          )}
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light disabled:opacity-50">
            {saving ? 'Saving…' : article ? 'Save Changes' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="mx-6 mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</div>}

      {/* Two-column editor */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left column — body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 border-r border-border">
          <div className="max-w-2xl space-y-5">
            <div>
              <input
                className="w-full text-3xl font-display font-bold text-navy border-none outline-none bg-transparent placeholder-tx-light"
                placeholder="Article title…"
                value={form.title}
                onChange={handleTitleChange}
              />
            </div>
            <div>
              <input
                className="w-full text-lg text-tx-mid border-none outline-none bg-transparent placeholder-tx-light"
                placeholder="Subtitle (optional)…"
                value={form.subtitle ?? ''}
                onChange={e => set('subtitle', e.target.value || null)}
              />
            </div>
            <div>
              <label className={LABEL}>Slug</label>
              <input className={INPUT} value={form.slug} onChange={e => set('slug', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Body</label>
              <textarea
                className="w-full px-3 py-3 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors resize-y font-mono leading-relaxed"
                rows={24}
                placeholder="Write in Markdown…&#10;&#10;# Heading 1&#10;## Heading 2&#10;**bold** *italic* [link](url)&#10;- bullet&#10;> blockquote"
                value={form.body ?? ''}
                onChange={e => set('body', e.target.value || null)}
              />
              <p className="text-[11px] text-tx-light mt-1">
                {wc} word{wc !== 1 ? 's' : ''} · ~{readTime} min read
              </p>
            </div>
          </div>
        </div>

        {/* Right column — settings */}
        <div className="w-80 flex-shrink-0 overflow-y-auto px-5 py-6 space-y-6">

          {/* Publish settings */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Publish</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <button onClick={() => { setScheduleMode(false); set('published_at', new Date().toISOString()) }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${!scheduleMode ? 'bg-navy text-white border-navy' : 'text-tx-mid border-border hover:border-navy'}`}>
                  Publish now
                </button>
                <button onClick={() => setScheduleMode(true)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${scheduleMode ? 'bg-navy text-white border-navy' : 'text-tx-mid border-border hover:border-navy'}`}>
                  Schedule
                </button>
              </div>
              {scheduleMode && (
                <div>
                  <label className={LABEL}>Publish date & time</label>
                  <input type="datetime-local" className={INPUT}
                    value={form.published_at?.slice(0, 16) ?? ''}
                    onChange={e => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-tx">Active</span>
                <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-tx">Featured</span>
                <Toggle checked={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} />
              </div>
            </div>
          </section>

          {/* Category */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Category</h3>
            <select className={SELECT} value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}>
              <option value="">— Select —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </section>

          {/* Author */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Author</h3>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Name</label>
                <input className={INPUT} value={form.author} onChange={e => set('author', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Bio</label>
                <textarea className={`${INPUT} resize-y`} rows={2} value={form.author_bio ?? ''} onChange={e => set('author_bio', e.target.value || null)} />
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Tags</h3>
            <div className="flex gap-2 mb-2 flex-wrap">
              {(form.tags ?? []).map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[11px] bg-navy/5 text-navy px-2 py-0.5 rounded">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-tx-light hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={`${INPUT} flex-1`} placeholder="Add tag…" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
              <button onClick={addTag} className="px-3 py-2 bg-navy text-white text-xs rounded-sm">Add</button>
            </div>
          </section>

          {/* Excerpt */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Excerpt</h3>
            <textarea className={`${INPUT} resize-y`} rows={3} maxLength={200}
              placeholder="Card preview text (max 200 chars)"
              value={form.excerpt ?? ''} onChange={e => set('excerpt', e.target.value || null)} />
            <p className="text-[10px] text-tx-light mt-0.5">{(form.excerpt ?? '').length}/200</p>
          </section>

          {/* Read time */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Read Time</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-tx-light">Auto: ~{readTime} min</span>
              <div className="flex-1">
                <input type="number" min="1" className={INPUT} placeholder="Override…"
                  value={form.read_time_minutes ?? ''} onChange={e => set('read_time_minutes', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          </section>

          {/* Cover image */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Cover Image</h3>
            {form.cover_image && (
              <div className="mb-3 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_image} alt="" className="w-full aspect-video object-cover rounded-sm border border-border" />
                <button onClick={() => set('cover_image', null)}
                  className="absolute top-1 right-1 w-6 h-6 bg-white border border-border rounded-full text-xs text-red-500 flex items-center justify-center">×</button>
              </div>
            )}
            {form.cover_image && (
              <div className="mb-3">
                <FocalPointPicker imageUrl={form.cover_image} focalPoint={focalPoint} onChange={setFocalPoint} />
              </div>
            )}
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
            <button onClick={() => coverRef.current?.click()} disabled={uploadingCover}
              className="w-full px-3 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
              {uploadingCover ? 'Uploading…' : form.cover_image ? 'Replace cover' : '+ Upload cover'}
            </button>
            {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          </section>

          {/* SEO */}
          <section>
            <button onClick={() => setSeoOpen(!seoOpen)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-tx-mid uppercase tracking-widest pb-1.5 border-b border-border mb-3">
              SEO <span>{seoOpen ? '▲' : '▼'}</span>
            </button>
            {seoOpen && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Meta Title</label>
                  <input className={INPUT} value={form.meta_title ?? ''} onChange={e => set('meta_title', e.target.value || null)} placeholder={form.title} />
                </div>
                <div>
                  <label className={LABEL}>Meta Description <span className="font-normal normal-case text-tx-light">(max 160)</span></label>
                  <textarea className={`${INPUT} resize-y`} rows={2} maxLength={160}
                    value={form.meta_description ?? ''} onChange={e => set('meta_description', e.target.value || null)}
                    placeholder={form.excerpt ?? 'Description for search engines…'} />
                </div>
                <div>
                  <label className={LABEL}>OG Image URL</label>
                  <input className={INPUT} value={form.og_image ?? ''} onChange={e => set('og_image', e.target.value || null)} placeholder={form.cover_image ?? ''} />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export function ArticlesSection() {
  const [articles, setArticles] = useState<ArticleFull[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editArticle, setEditArticle] = useState<ArticleFull | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/articles')
    const data = await res.json()
    setArticles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Partial<FormState>) {
    if (editArticle) {
      const res = await fetch(`/api/admin/articles/${editArticle.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    } else {
      const res = await fetch('/api/admin/articles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    }
    setShowEditor(false); setEditArticle(null)
    showToast(editArticle ? 'Article updated' : 'Article created')
    load()
  }

  async function handleToggle(a: ArticleFull, field: 'is_featured' | 'is_active') {
    await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: !a[field] }),
    })
    load()
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map(id => fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })))
    setSelected(new Set()); setConfirmDelete(null)
    showToast(`${ids.length} article(s) deleted`)
    load()
  }

  async function handleBulkToggle(active: boolean) {
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/admin/articles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active }) })
    ))
    setSelected(new Set())
    showToast(`${selected.size} article(s) ${active ? 'activated' : 'deactivated'}`)
    load()
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleAll() {
    setSelected(prev => prev.size === articles.length ? new Set() : new Set(articles.map(a => a.id)))
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Articles</h1>
          <p className="text-sm text-tx-light mt-0.5">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditArticle(null); setShowEditor(true) }}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors">+ New Article</button>
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

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-3 text-left w-8"><input type="checkbox" checked={selected.size === articles.length && articles.length > 0} onChange={toggleAll} className="rounded" /></th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Title</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Category</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Author</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Read time</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Status</th>
                <th className="pb-2 pr-4 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Featured</th>
                <th className="pb-2 text-left text-[11px] font-bold text-tx-mid uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id} className="border-b border-border-light hover:bg-sand/40 transition-colors">
                  <td className="py-2.5 pr-3"><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} className="rounded" /></td>
                  <td className="py-2.5 pr-4 font-medium text-navy max-w-[200px] truncate">{a.title}</td>
                  <td className="py-2.5 pr-4 text-tx-light capitalize text-xs">{a.category?.replace('_', ' ') ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-tx-light text-xs">{a.author}</td>
                  <td className="py-2.5 pr-4 text-tx-light text-xs">{a.read_time_minutes ? `${a.read_time_minutes} min` : '—'}</td>
                  <td className="py-2.5 pr-4">{statusBadge(a)}</td>
                  <td className="py-2.5 pr-4">
                    <Toggle checked={a.is_featured} onChange={() => handleToggle(a, 'is_featured')} />
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditArticle(a); setShowEditor(true) }}
                        className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors">Edit</button>
                      <a href={`/insights/${a.slug}`} target="_blank" rel="noopener noreferrer"
                        className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors">Preview</a>
                      <button onClick={() => setConfirmDelete([a.id])}
                        className="px-2 py-1 text-[11px] text-red-400 border border-border rounded-sm hover:border-red-300 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-tx-light text-sm">No articles yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showEditor && (
        <ArticleEditor article={editArticle} onSave={handleSave} onClose={() => { setShowEditor(false); setEditArticle(null) }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-navy mb-2">Delete {confirmDelete.length} article{confirmDelete.length > 1 ? 's' : ''}?</h3>
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
