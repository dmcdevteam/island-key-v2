'use client'

import { useState, useEffect, useRef } from 'react'
import type { SmartCard } from '@/lib/types'

type TriggerType = SmartCard['trigger_type']

const TRIGGER_OPTIONS: {
  value: TriggerType
  label: string
  desc: string
  color: string
  badge: string
}[] = [
  { value: 'manual',        label: 'Manual',      desc: 'Always show when active',           color: 'bg-navy/10 text-navy',          badge: 'Manual'       },
  { value: 'weather_hot',   label: '☀️ Hot day',   desc: 'Shows when temperature > 30°C',    color: 'bg-amber-100 text-amber-700',   badge: '☀️ Hot day'   },
  { value: 'weather_windy', label: '💨 Windy',     desc: 'Shows when wind > 25 km/h',        color: 'bg-sky-100 text-sky-700',       badge: '💨 Windy'     },
  { value: 'weather_rainy', label: '🌧️ Rainy',     desc: 'Shows when rain probability > 60%', color: 'bg-blue-100 text-blue-700',    badge: '🌧️ Rainy'    },
  { value: 'weather_clear', label: '✨ Clear day', desc: 'Shows on perfect weather days',     color: 'bg-green-100 text-green-700',   badge: '✨ Clear'     },
  { value: 'time_window',   label: '⏰ Scheduled', desc: 'Show between two dates',            color: 'bg-purple-100 text-purple-700', badge: '⏰ Scheduled' },
]

function triggerOption(value: TriggerType) {
  return TRIGGER_OPTIONS.find(o => o.value === value) ?? TRIGGER_OPTIONS[0]
}

const INPUT  = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL  = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'
const SELECT = `${INPUT} cursor-pointer`

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

type FormState = Omit<SmartCard, 'id' | 'created_at'>

function emptyForm(): FormState {
  return {
    title: '', subtitle: null, image_url: null,
    cta_label: 'Discover →', cta_url: '',
    trigger_type: 'manual', is_active: false,
    valid_from: null, valid_until: null,
    sort_order: 0, notify_guests: false,
  }
}

function CardPreview({ form, imagePreview }: { form: FormState; imagePreview: string | null }) {
  const TRIGGER_BADGE: Partial<Record<TriggerType, string>> = {
    weather_hot: '☀️ Hot day pick', weather_windy: '💨 Wind-proof',
    weather_rainy: '🌧️ Rainy day', weather_clear: '✨ Perfect day',
  }
  const badge = TRIGGER_BADGE[form.trigger_type] ?? null
  const src = imagePreview ?? form.image_url

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-md bg-white border border-border-light"
      style={{ width: 200 }}
    >
      <div className="relative" style={{ height: 120 }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy to-teal" />
        )}
        {badge && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)' }}
          >
            {badge}
          </div>
        )}
      </div>
      <div className="px-2.5 py-2.5">
        <p className="text-[13px] font-semibold text-navy leading-tight line-clamp-2">
          {form.title || 'Card title'}
        </p>
        {form.subtitle && (
          <p className="text-[11px] text-tx-light mt-0.5 truncate">{form.subtitle}</p>
        )}
        <div className="mt-2.5 py-1.5 bg-navy text-white text-[11px] font-semibold rounded-xl text-center">
          {form.cta_label || 'Discover →'}
        </div>
      </div>
    </div>
  )
}

interface CardFormProps {
  card: SmartCard | null
  onSave: (data: FormState) => Promise<void>
  onClose: () => void
}

function CardForm({ card, onSave, onClose }: CardFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(() =>
    card ? {
      title: card.title, subtitle: card.subtitle, image_url: card.image_url,
      cta_label: card.cta_label, cta_url: card.cta_url,
      trigger_type: card.trigger_type, is_active: card.is_active,
      valid_from: card.valid_from, valid_until: card.valid_until,
      sort_order: card.sort_order, notify_guests: card.notify_guests,
    } : emptyForm()
  )
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setUploading(true)
    try {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      fd.append('bucket', 'smart-card-images')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.url) throw new Error(json.error ?? 'Upload failed')
      set('image_url', json.url)
      setImagePreview(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setImagePreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.cta_url.trim()) { setError('CTA URL is required'); return }
    setError('')
    setSaving(true)
    try {
      await onSave({ ...form, sort_order: Number(form.sort_order) || 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  const isWeatherTrigger = ['weather_hot', 'weather_windy', 'weather_rainy', 'weather_clear'].includes(form.trigger_type)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-3xl h-full bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">{card ? 'Edit Card' : 'New Smart Card'}</h2>
          <button onClick={onClose} className="text-tx-light hover:text-tx text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col md:flex-row h-full">

            {/* Form column */}
            <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">

              {/* Content */}
              <section>
                <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Content</h3>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Title *</label>
                    <input
                      className={INPUT}
                      value={form.title}
                      onChange={e => set('title', e.target.value)}
                      placeholder="E.g. Beach Setup Available Today"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Subtitle</label>
                    <input
                      className={INPUT}
                      value={form.subtitle ?? ''}
                      onChange={e => set('subtitle', e.target.value || null)}
                      placeholder="Short supporting text (optional)"
                    />
                  </div>
                </div>
              </section>

              {/* Image */}
              <section>
                <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Image</h3>
                {(form.image_url || imagePreview) && (
                  <div className="relative w-24 h-16 mb-2 rounded-sm overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview ?? form.image_url!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {!imagePreview && (
                      <button
                        type="button"
                        onClick={() => set('image_url', null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-border rounded-full text-[10px] text-red-500 flex items-center justify-center hover:bg-red-50"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 border border-dashed border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : form.image_url ? 'Replace Image' : '+ Upload Image'}
                </button>
                <p className="mt-1 text-[11px] text-tx-light">Leave empty for navy→teal gradient background</p>
                {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
              </section>

              {/* CTA */}
              <section>
                <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Call to Action</h3>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Button Label *</label>
                    <input
                      className={INPUT}
                      value={form.cta_label}
                      onChange={e => set('cta_label', e.target.value)}
                      placeholder="Discover →"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>URL *</label>
                    <input
                      className={INPUT}
                      value={form.cta_url}
                      onChange={e => set('cta_url', e.target.value)}
                      placeholder="/activities, /rentals/essentials, or https://…"
                    />
                    <p className="mt-1 text-[11px] text-tx-light">
                      Internal: /activities — External: starts with https (opens new tab)
                    </p>
                  </div>
                </div>
              </section>

              {/* Trigger */}
              <section>
                <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Display Trigger</h3>
                <div>
                  <label className={LABEL}>Trigger Type *</label>
                  <select
                    className={SELECT}
                    value={form.trigger_type}
                    onChange={e => set('trigger_type', e.target.value as TriggerType)}
                  >
                    {TRIGGER_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
                    ))}
                  </select>
                </div>

                {isWeatherTrigger && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-sm text-[12px] text-amber-800">
                    This card will only appear to guests when the weather in Chania matches the condition.
                    You must also set Active to ON.
                  </div>
                )}

                {form.trigger_type === 'time_window' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Available From</label>
                      <input
                        type="datetime-local"
                        className={INPUT}
                        value={form.valid_from?.slice(0, 16) ?? ''}
                        onChange={e => set('valid_from', e.target.value || null)}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Available Until</label>
                      <input
                        type="datetime-local"
                        className={INPUT}
                        value={form.valid_until?.slice(0, 16) ?? ''}
                        onChange={e => set('valid_until', e.target.value || null)}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Settings */}
              <section>
                <h3 className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3 border-b border-border pb-1.5">Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>Sort Order <span className="font-normal normal-case text-tx-light">(lower = first)</span></label>
                    <input
                      type="number"
                      className={INPUT}
                      value={form.sort_order}
                      onChange={e => set('sort_order', Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-tx">Show to guests</p>
                      <p className="text-[11px] text-tx-light">Appears on the home screen immediately when active</p>
                    </div>
                    <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-tx">Send as notification</p>
                      <p className="text-[11px] text-tx-light">Sends a push notification to all guests on save</p>
                    </div>
                    <Toggle checked={form.notify_guests} onChange={() => set('notify_guests', !form.notify_guests)} />
                  </div>
                </div>
              </section>
            </div>

            {/* Preview column — desktop only */}
            <div className="hidden md:flex flex-col items-center px-6 py-5 border-l border-border bg-gray-50 min-w-[240px]">
              <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-4">Preview</p>
              <CardPreview form={form} imagePreview={imagePreview} />
              <p className="mt-3 text-[10px] text-tx-light text-center">
                Approximate — actual rendering may vary
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex-shrink-0">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
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
            {saving ? 'Saving…' : card ? 'Save Changes' : 'Create Card'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SmartCardsPage() {
  const [cards, setCards] = useState<SmartCard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNow, setActiveNow] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editCard, setEditCard] = useState<SmartCard | null>(null)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function load() {
    setLoading(true)
    const [adminRes, guestRes] = await Promise.all([
      fetch('/api/admin/smart-cards').then(r => r.json()),
      fetch('/api/smart-cards').then(r => r.json()).catch(() => ({ cards: [] })),
    ])
    setCards(Array.isArray(adminRes) ? adminRes : [])
    setActiveNow(Array.isArray(guestRes.cards) ? guestRes.cards.length : 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: FormState) {
    if (editCard) {
      const res = await fetch(`/api/admin/smart-cards/${editCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    } else {
      const res = await fetch('/api/admin/smart-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    }
    setShowForm(false)
    setEditCard(null)
    showToast(editCard ? 'Card updated' : 'Card created')
    load()
  }

  async function handleToggle(card: SmartCard) {
    await fetch(`/api/admin/smart-cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !card.is_active }),
    })
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/smart-cards/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    showToast('Card deleted')
    load()
  }

  const scheduled = cards.filter(
    c => c.valid_from && new Date(c.valid_from) > new Date(),
  ).length

  const stats = [
    { label: 'Active now',   value: activeNow,     desc: "matching today's conditions" },
    { label: 'Total cards',  value: cards.length,  desc: 'in the library'              },
    { label: 'Scheduled',    value: scheduled,     desc: 'with future start dates'     },
  ]

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-navy">Smart Island Feed</h1>
          <p className="text-sm text-tx-light mt-0.5">
            Dynamic cards shown on the guest home screen based on conditions you set.
          </p>
        </div>
        <button
          onClick={() => { setEditCard(null); setShowForm(true) }}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors flex-shrink-0"
        >
          + Add Card
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-border rounded-sm p-4">
            <p className="text-2xl font-bold text-navy">{s.value}</p>
            <p className="text-[11px] font-semibold text-tx-mid mt-0.5">{s.label}</p>
            <p className="text-[10px] text-tx-light">{s.desc}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-tx-light">Loading…</p>}

      {!loading && (
        <div className="space-y-2">
          {cards.map(card => {
            const opt = triggerOption(card.trigger_type)
            return (
              <div
                key={card.id}
                className="flex items-center gap-3 bg-white border border-border rounded-sm p-3 hover:bg-sand/30 transition-colors"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-border-light">
                  {card.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-navy to-teal" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{card.title}</p>
                  {card.subtitle && (
                    <p className="text-[11px] text-tx-light truncate">{card.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${opt.color}`}>
                      {opt.badge}
                    </span>
                    {card.valid_until && (
                      <span className="text-[10px] text-tx-light">
                        Until {new Date(card.valid_until).toLocaleDateString('en-GB')}
                      </span>
                    )}
                    {card.sort_order > 0 && (
                      <span className="text-[10px] text-tx-light">Order: {card.sort_order}</span>
                    )}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex-shrink-0">
                  <Toggle checked={card.is_active} onChange={() => handleToggle(card)} />
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditCard(card); setShowForm(true) }}
                    className="px-2 py-1 text-[11px] text-tx-mid border border-border rounded-sm hover:border-navy hover:text-navy transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(card.id)}
                    className="px-2 py-1 text-[11px] text-red-400 border border-border rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}

          {cards.length === 0 && (
            <div className="py-16 text-center text-tx-light text-sm">
              No smart cards yet — create your first one
            </div>
          )}
        </div>
      )}

      {/* Form drawer */}
      {showForm && (
        <CardForm
          card={editCard}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditCard(null) }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-navy mb-2">Delete this card?</h3>
            <p className="text-sm text-tx-light mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm border border-border rounded-sm hover:bg-sand"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 bg-navy text-white text-sm rounded-sm shadow-lg z-[70]">
          {toast}
        </div>
      )}
    </div>
  )
}
