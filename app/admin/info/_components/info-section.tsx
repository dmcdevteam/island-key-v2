'use client'

import { useState, useEffect } from 'react'
import { slugify } from '@/lib/slugify'
import type { InfoPageFull } from '@/lib/types'

const INPUT = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

const CATEGORIES = ['emergency','transport','health','money','connectivity','language','culture','practical','other']
const CATEGORY_LABELS: Record<string, string> = {
  emergency: 'Emergency', transport: 'Transport', health: 'Health',
  money: 'Money', connectivity: 'Connectivity', language: 'Language',
  culture: 'Culture', practical: 'Practical', other: 'Other',
}
const CATEGORY_OPTION_LABELS: Record<string, string> = {
  emergency: '🚨 Emergency', transport: '🚗 Transport', health: '💊 Health',
  money: '💳 Money', connectivity: '📱 Connectivity', language: '🇬🇷 Language',
  culture: '🫒 Culture', practical: '🏖️ Practical', other: '📄 Other',
}
const CATEGORY_ICONS: Record<string, string> = {
  emergency: '🚨', transport: '🚗', health: '💊', money: '💳',
  connectivity: '📱', language: '🇬🇷', culture: '🫒', practical: '🏖️', other: '📄',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

type FormState = Omit<InfoPageFull, 'id' | 'created_at'>
type ContentMode = 'simple' | 'sections'

function emptyForm(): FormState {
  return {
    title: '', slug: '', category: null, icon: null,
    content: null, sections: null, region: 'chania',
    is_active: true, sort_order: 0,
  }
}

function InfoForm({ page, onSave, onClose }: {
  page: InfoPageFull | null
  onSave: (d: Partial<FormState>) => Promise<void>
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [contentMode, setContentMode] = useState<ContentMode>(
    page?.sections ? 'sections' : 'simple'
  )

  const [form, setForm] = useState<FormState>(() => page ? {
    title: page.title, slug: page.slug, category: page.category, icon: page.icon,
    content: page.content, sections: page.sections, region: page.region,
    is_active: page.is_active, sort_order: page.sort_order,
  } : emptyForm())

  const [sectionItems, setSectionItems] = useState<{ heading: string; content: string }[]>(
    page?.sections ?? [{ heading: '', content: '' }]
  )

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    set('title', title)
    if (!page) set('slug', slugify(title))
  }

  function handleCategoryChange(cat: string) {
    set('category', cat || null)
    if (!form.icon && cat) set('icon', CATEGORY_ICONS[cat] ?? null)
  }

  function addSection() {
    setSectionItems(prev => [...prev, { heading: '', content: '' }])
  }

  function updateSection(i: number, field: 'heading' | 'content', value: string) {
    setSectionItems(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s))
  }

  function moveSection(i: number, dir: -1 | 1) {
    setSectionItems(prev => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function removeSection(i: number) {
    setSectionItems(prev => prev.filter((_, j) => j !== i))
  }

  async function handleSubmit() {
    setError(''); setSaving(true)
    try {
      await onSave({
        ...form,
        sections: contentMode === 'sections' ? sectionItems.filter(s => s.heading || s.content) : null,
        content: contentMode === 'simple' ? form.content : null,
        sort_order: Number(form.sort_order) || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40" onClick={onClose}>
      <div className="relative w-full md:max-w-2xl h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">{page ? 'Edit Info Page' : 'New Info Page'}</h2>
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
              <div>
                <label className={LABEL}>Category</label>
                <select className={SELECT} value={form.category ?? ''} onChange={e => handleCategoryChange(e.target.value)}>
                  <option value="">— None —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_OPTION_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Icon (emoji)</label>
                <input className={INPUT} value={form.icon ?? ''} onChange={e => set('icon', e.target.value || null)} placeholder="e.g. 🚨" />
              </div>
              <div>
                <label className={LABEL}>Region</label>
                <select className={SELECT} value={form.region} onChange={e => set('region', e.target.value)}>
                  {['chania','rethymno','heraklion','lasithi','island-wide'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-4 pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>
          </section>

          {/* Content mode */}
          <section>
            <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Content</h3>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setContentMode('simple')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${contentMode === 'simple' ? 'bg-navy text-white border-navy' : 'text-tx-mid border-border hover:border-navy'}`}>
                Simple (Markdown)
              </button>
              <button onClick={() => setContentMode('sections')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${contentMode === 'sections' ? 'bg-navy text-white border-navy' : 'text-tx-mid border-border hover:border-navy'}`}>
                Sections Builder
              </button>
            </div>

            {contentMode === 'simple' && (
              <textarea className={`${INPUT} resize-y font-mono`} rows={12}
                placeholder="Write in Markdown…"
                value={form.content ?? ''} onChange={e => set('content', e.target.value || null)} />
            )}

            {contentMode === 'sections' && (
              <div className="space-y-4">
                {sectionItems.map((s, i) => (
                  <div key={i} className="border border-border rounded-sm p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-tx-mid uppercase">Section {i + 1}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0}
                          className="text-[11px] px-1.5 py-0.5 border border-border rounded-sm text-tx-light hover:text-navy disabled:opacity-30">↑</button>
                        <button type="button" onClick={() => moveSection(i, 1)} disabled={i === sectionItems.length - 1}
                          className="text-[11px] px-1.5 py-0.5 border border-border rounded-sm text-tx-light hover:text-navy disabled:opacity-30">↓</button>
                        <button type="button" onClick={() => removeSection(i)}
                          className="text-[11px] px-1.5 py-0.5 border border-border rounded-sm text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                    <input className={INPUT} placeholder="Section heading…"
                      value={s.heading} onChange={e => updateSection(i, 'heading', e.target.value)} />
                    <textarea className={`${INPUT} resize-y font-mono`} rows={4} placeholder="Section content (Markdown)…"
                      value={s.content} onChange={e => updateSection(i, 'content', e.target.value)} />
                  </div>
                ))}
                <button type="button" onClick={addSection}
                  className="w-full px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors">
                  + Add Section
                </button>
              </div>
            )}
          </section>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : page ? 'Save Changes' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InfoSection() {
  const [pages, setPages] = useState<InfoPageFull[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPage, setEditPage] = useState<InfoPageFull | null>(null)
  const [activeCat, setActiveCat] = useState('all')
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/info-pages')
    const data = await res.json()
    setPages(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Partial<FormState>) {
    if (editPage) {
      const res = await fetch(`/api/admin/info-pages/${editPage.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    } else {
      const res = await fetch('/api/admin/info-pages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    }
    setShowForm(false); setEditPage(null)
    showToast(editPage ? 'Page updated' : 'Page created')
    load()
  }

  async function handleToggle(page: InfoPageFull) {
    await fetch(`/api/admin/info-pages/${page.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !page.is_active }),
    })
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/info-pages/${id}`, { method: 'DELETE' })
    setConfirmDelete(null); showToast('Page deleted'); load()
  }

  const activeCats = ['all', ...Array.from(new Set(pages.map(p => p.category).filter(Boolean)))] as string[]
  const filtered = activeCat === 'all' ? pages : pages.filter(p => p.category === activeCat)

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Useful Info</h1>
          <p className="text-sm text-tx-light mt-0.5">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditPage(null); setShowForm(true) }}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors">+ New Page</button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {activeCats.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${activeCat === cat ? 'bg-navy text-white border-navy' : 'text-tx-mid border-border hover:border-navy'}`}>
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {loading && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-navy/5 rounded-sm animate-pulse" />)}</div>}

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(page => (
            <div key={page.id} className="bg-white border border-border rounded-sm p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{page.icon ?? '📄'}</span>
                <Toggle checked={page.is_active} onChange={() => handleToggle(page)} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-navy leading-tight">{page.title}</h3>
                {page.category && (
                  <span className="text-[10px] font-bold text-tx-mid capitalize">{page.category}</span>
                )}
              </div>
              <div className="flex gap-1.5 mt-auto pt-2">
                <button onClick={() => { setEditPage(page); setShowForm(true) }}
                  className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors">Edit</button>
                <button onClick={() => setConfirmDelete(page.id)}
                  className="px-2 py-1.5 text-[11px] text-red-400 border border-border rounded-sm hover:border-red-300 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-tx-light text-sm">No info pages yet</div>
          )}
        </div>
      )}

      {showForm && (
        <InfoForm page={editPage} onSave={handleSave} onClose={() => { setShowForm(false); setEditPage(null) }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-navy mb-2">Delete this page?</h3>
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
