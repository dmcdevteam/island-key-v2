'use client'

import { useEffect, useState } from 'react'

type Notification = {
  id: string
  title: string
  body: string
  type: string
  target: string
  target_property_id: string | null
  target_guest_id: string | null
  scheduled_at: string
  is_active: boolean
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  general:  'General',
  booking:  'Booking',
  weather:  'Weather',
  event:    'Event',
  offer:    'Offer',
  reminder: 'Reminder',
}

const TARGET_LABELS: Record<string, string> = {
  all:      'All guests',
  property: 'Specific property',
  guest:    'Specific guest',
}

const EMPTY_FORM = {
  title: '', body: '', type: 'general', target: 'all',
  target_property_id: '', target_guest_id: '',
  scheduled_at: new Date().toISOString().slice(0, 16),
  is_active: true,
}

const INPUT    = 'w-full px-3 py-2 border border-gray-200 rounded text-sm text-gray-800 bg-white outline-none focus:border-navy transition-colors'
const LABEL    = 'block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1'
const SELECT   = `${INPUT} cursor-pointer`

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  async function loadNotifications() {
    try {
      const res = await fetch('/api/admin/notifications')
      const data = await res.json()
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadNotifications() }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(n: Notification) {
    setForm({
      title:              n.title,
      body:               n.body,
      type:               n.type,
      target:             n.target,
      target_property_id: n.target_property_id ?? '',
      target_guest_id:    n.target_guest_id    ?? '',
      scheduled_at:       n.scheduled_at.slice(0, 16),
      is_active:          n.is_active,
    })
    setEditingId(n.id)
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      }
      const res = editingId
        ? await fetch(`/api/admin/notifications/${editingId}`, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/notifications',              { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Save failed'); setSaving(false); return }
      setShowForm(false)
      setEditingId(null)
      loadNotifications()
    } catch { setError('Save failed') }
    setSaving(false)
  }

  async function toggleActive(n: Notification) {
    await fetch(`/api/admin/notifications/${n.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...n, is_active: !n.is_active }),
    })
    loadNotifications()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this notification?')) return
    await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })
    loadNotifications()
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-navy">Notifications</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded hover:bg-navy/90 transition-colors"
        >
          + New Notification
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm">No notifications yet. Create one to get started.</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-navy/10 text-navy">
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <span className="text-[10px] text-gray-400">{TARGET_LABELS[n.target] ?? n.target}</span>
                  <span className="text-[10px] text-gray-400">{new Date(n.scheduled_at).toLocaleString()}</span>
                  {!n.is_active && (
                    <span className="text-[10px] font-semibold text-red-500">Inactive</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-navy">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(n)}
                  className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                    n.is_active ? 'text-teal bg-teal/10 hover:bg-teal/20' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {n.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => openEdit(n)}
                  className="text-xs text-gray-500 hover:text-navy px-2 py-1 border border-gray-200 rounded hover:border-navy transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40" onClick={() => setShowForm(false)}>
          <div
            className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-display text-lg text-navy">
                {editingId ? 'Edit Notification' : 'New Notification'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Title *</label>
                <input className={INPUT} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Special offer for you" />
              </div>
              <div>
                <label className={LABEL}>Body *</label>
                <textarea className={`${INPUT} resize-y`} rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Notification message..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Type *</label>
                  <select className={SELECT} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Target *</label>
                  <select className={SELECT} value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                    {Object.entries(TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {form.target === 'property' && (
                <div>
                  <label className={LABEL}>Property ID</label>
                  <input className={INPUT} value={form.target_property_id} onChange={e => setForm(f => ({ ...f, target_property_id: e.target.value }))} placeholder="UUID" />
                </div>
              )}
              {form.target === 'guest' && (
                <div>
                  <label className={LABEL}>Guest ID</label>
                  <input className={INPUT} value={form.target_guest_id} onChange={e => setForm(f => ({ ...f, target_guest_id: e.target.value }))} placeholder="UUID" />
                </div>
              )}
              <div>
                <label className={LABEL}>Scheduled at</label>
                <input type="datetime-local" className={INPUT} value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded hover:bg-navy/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
