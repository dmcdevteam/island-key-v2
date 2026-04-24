'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AccessKey } from '@/lib/types'

// ── Auto-generate key in IK-XXXX-XXXX format ─────────────────────────────────
function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusable chars
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `IK-${seg()}-${seg()}`
}

const INPUT  = 'w-full px-3 py-2 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors'
const LABEL  = 'block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1'

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Create form ───────────────────────────────────────────────────────────────
interface CreateFormProps {
  onCreated: (key: AccessKey) => void
  onClose: () => void
}

function CreateForm({ onCreated, onClose }: CreateFormProps) {
  const [form, setForm] = useState({
    key:            '',
    label:          '',
    uses_remaining: '',
    expires_at:     '',
    is_active:      true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.key.trim()) { setError('Key is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/access-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key:            form.key.trim().toUpperCase(),
          label:          form.label || null,
          uses_remaining: form.uses_remaining ? parseInt(form.uses_remaining) : null,
          expires_at:     form.expires_at || null,
          is_active:      form.is_active,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Create failed'); setSaving(false); return }
      onCreated(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:justify-end bg-black/40" onClick={onClose}>
      <div
        className="relative w-full md:max-w-md h-full bg-white shadow-modal flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg text-navy">New Access Key</h2>
          <button type="button" onClick={onClose} className="text-tx-light hover:text-tx text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={LABEL}>Key *</label>
            <div className="flex gap-2">
              <input
                className={INPUT}
                value={form.key}
                onChange={e => set('key', e.target.value.toUpperCase())}
                placeholder="IK-XXXX-XXXX"
                style={{ fontFamily: 'monospace' }}
              />
              <button
                type="button"
                onClick={() => set('key', generateKey())}
                className="px-3 py-2 border border-border rounded-sm text-sm text-tx-mid hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
              >
                Auto
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>Label</label>
            <input
              className={INPUT}
              value={form.label}
              onChange={e => set('label', e.target.value)}
              placeholder="e.g. Press trip — John Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Uses limit (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                className={INPUT}
                value={form.uses_remaining}
                onChange={e => set('uses_remaining', e.target.value)}
                placeholder="∞"
              />
            </div>
            <div>
              <label className={LABEL}>Expires (blank = never)</label>
              <input
                type="date"
                className={INPUT}
                value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
            <span className="text-sm text-tx">Active</span>
          </label>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-tx-mid border border-border rounded-sm hover:bg-sand transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Key'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Testing Tools section ─────────────────────────────────────────────────────
function TestingTools() {
  const [clearing, setClearing]   = useState(false)
  const [clearMsg, setClearMsg]   = useState('')
  const [clearError, setClearError] = useState('')

  async function handleClearSessions() {
    if (!confirm('Delete ALL guest records from the database? This cannot be undone.')) return
    setClearing(true)
    setClearMsg('')
    setClearError('')
    try {
      const res = await fetch('/api/admin/clear-sessions', { method: 'POST' })
      const json = await res.json()
      if (res.ok) setClearMsg('All guest sessions cleared.')
      else setClearError(json.error ?? 'Failed to clear sessions')
    } catch {
      setClearError('Network error')
    }
    setClearing(false)
  }

  return (
    <div className="mt-10 border border-border rounded-sm bg-white overflow-hidden">
      <div className="px-5 py-3 bg-sand border-b border-border">
        <h2 className="font-semibold text-navy text-[15px]">Testing Tools</h2>
      </div>
      <div className="px-5 py-5 space-y-5">

        {/* Clear all sessions */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-tx">Clear all sessions</p>
            <p className="text-[12px] text-tx-light mt-0.5">
              Deletes every row in the <code className="font-mono bg-sand px-1 rounded">guests</code> table — useful for resetting between test runs.
            </p>
            {clearMsg   && <p className="mt-2 text-[12px] text-teal">{clearMsg}</p>}
            {clearError && <p className="mt-2 text-[12px] text-red-500">{clearError}</p>}
          </div>
          <button
            onClick={handleClearSessions}
            disabled={clearing}
            className="flex-shrink-0 px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {clearing ? 'Clearing…' : 'Clear all sessions'}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light" />

        {/* Reset my session */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-tx">Reset my session</p>
            <p className="text-[12px] text-tx-light mt-0.5">
              Clears the <code className="font-mono bg-sand px-1 rounded">ik_access</code> cookie and redirects to the gate page — lets you test the access flow without opening DevTools.
            </p>
          </div>
          <a
            href="/api/reset-session"
            className="flex-shrink-0 px-4 py-2 border border-border text-tx-mid text-sm font-semibold rounded-sm hover:border-navy hover:text-navy transition-colors text-center"
          >
            Reset my session
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light" />

        {/* DevTools note */}
        <p className="text-[12px] text-tx-light leading-relaxed">
          <span className="font-semibold text-tx-mid">Full browser reset:</span> to clear localStorage and all cookies at once, go to DevTools → Application → Storage → Clear site data for app.islandkey.gr.
        </p>

      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function AccessKeyManager() {
  const [keys, setKeys]           = useState<AccessKey[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/access-keys')
    if (res.ok) setKeys(await res.json())
    else setError(`Failed to load (${res.status})`)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(id: string, current: boolean) {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !current } : k))
    const res = await fetch(`/api/admin/access-keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (!res.ok) setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: current } : k))
  }

  async function handleDelete(id: string, keyText: string) {
    if (!confirm(`Delete key "${keyText}"? This cannot be undone.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/access-keys/${id}`, { method: 'DELETE' })
    if (res.ok) setKeys(prev => prev.filter(k => k.id !== id))
    else setError('Delete failed')
    setDeletingId(null)
  }

  function handleCreated(key: AccessKey) {
    setKeys(prev => [key, ...prev])
    setShowCreate(false)
  }

  if (loading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white rounded border border-border animate-pulse" />)}</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-navy text-lg">Access Keys</h2>
          <p className="text-sm text-tx-mid mt-0.5">{keys.length} key{keys.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors"
        >
          + Create Key
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm mb-4">{error}</p>}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-sand border-b border-border">
            <tr>
              {['Key', 'Label', 'Total Uses', 'Uses Left', 'Expires', 'Active', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {keys.map(k => (
              <tr key={k.id} className="hover:bg-sand/40 transition-colors">
                <td className="px-3 py-2.5 font-mono font-semibold text-navy text-[13px] whitespace-nowrap">{k.key}</td>
                <td className="px-3 py-2.5 text-tx-mid max-w-[180px] truncate">{k.label ?? <span className="text-tx-light italic">—</span>}</td>
                <td className="px-3 py-2.5 text-tx-mid text-center">{k.total_uses ?? 0}</td>
                <td className="px-3 py-2.5 text-tx-mid text-center">{k.uses_remaining ?? <span className="text-tx-light">∞</span>}</td>
                <td className="px-3 py-2.5 text-tx-mid whitespace-nowrap">
                  {k.expires_at
                    ? new Date(k.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : <span className="text-tx-light">Never</span>}
                </td>
                <td className="px-3 py-2.5">
                  <Toggle checked={k.is_active} onChange={() => handleToggle(k.id, k.is_active)} />
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => handleDelete(k.id, k.key)}
                    disabled={deletingId === k.id}
                    className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
                  >
                    {deletingId === k.id ? '…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {keys.length === 0 && (
          <div className="text-center py-12 text-tx-mid text-sm">No access keys yet. Click "+ Create Key" to add one.</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {keys.length === 0 && <div className="text-center py-10 text-tx-mid text-sm">No access keys yet.</div>}
        {keys.map(k => (
          <div key={k.id} className="bg-white rounded border border-border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="font-mono font-semibold text-navy text-sm">{k.key}</span>
              <Toggle checked={k.is_active} onChange={() => handleToggle(k.id, k.is_active)} />
            </div>
            {k.label && <p className="text-[12px] text-tx-mid mt-1">{k.label}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-tx-light">
              <span>Uses: {k.total_uses ?? 0}</span>
              <span>Left: {k.uses_remaining ?? '∞'}</span>
              <span>Expires: {k.expires_at ? new Date(k.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'Never'}</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-border-light">
              <button
                onClick={() => handleDelete(k.id, k.key)}
                disabled={deletingId === k.id}
                className="text-xs font-semibold text-red-500 disabled:opacity-40"
              >
                {deletingId === k.id ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateForm onCreated={handleCreated} onClose={() => setShowCreate(false)} />}

      <TestingTools />
    </div>
  )
}
