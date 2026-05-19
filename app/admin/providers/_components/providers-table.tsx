'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Provider } from '@/lib/types'
import { ProviderForm } from './provider-form'

type SortKey = 'name' | 'type' | 'region' | 'commission_rate' | 'is_active'

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

export function ProvidersSection({ typeFilter }: { typeFilter?: string }) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editProvider, setEditProvider] = useState<Provider | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    const res = await fetch('/api/admin/providers')
    if (!res.ok) {
      setError(`Failed to load providers (${res.status})`)
      setLoading(false)
      return
    }
    const all = await res.json()
    setProviders(typeFilter ? all.filter((p: Provider) => p.type === typeFilter) : all)
    setLoading(false)
  }, [typeFilter])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  function sortBy(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...providers].sort((a, b) => {
    let av = a[sortKey] ?? ''
    let bv = b[sortKey] ?? ''
    if (typeof av === 'boolean') av = av ? 1 : 0
    if (typeof bv === 'boolean') bv = bv ? 1 : 0
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  async function handleToggle(id: string, value: boolean) {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active: value } : p))
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: value }),
    })
    if (!res.ok) setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active: !value } : p))
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' })
    if (res.ok) setProviders(prev => prev.filter(p => p.id !== id))
    else setError('Delete failed')
    setDeletingId(null)
  }

  async function handleSave(data: Partial<Provider>) {
    const url = editProvider ? `/api/admin/providers/${editProvider.id}` : '/api/admin/providers'
    const method = editProvider ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Save failed') }
    const saved = await res.json()
    setProviders(prev => editProvider ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev])
    setShowForm(false)
    setEditProvider(null)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded border border-border animate-pulse" />)}
      </div>
    )
  }

  if (error && providers.length === 0) {
    return <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 text-sm text-red-600">{error}</div>
  }

  function Th({ label, s }: { label: string; s?: SortKey }) {
    if (!s) return <th className="px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap">{label}</th>
    const active = sortKey === s
    return (
      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-tx" onClick={() => sortBy(s)}>
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl text-navy">
            {typeFilter ? `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Providers` : 'Providers'}
          </h1>
          <p className="text-sm text-tx-mid mt-0.5">{providers.length} total</p>
        </div>
        <button
          onClick={() => { setEditProvider(null); setShowForm(true) }}
          className="w-full sm:w-auto px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors"
        >
          + New Provider
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm mb-4">{error}</p>}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-sand border-b border-border">
            <tr>
              <Th label="Name" s="name" />
              <Th label="Type" s="type" />
              <Th label="Category" />
              <Th label="Region" s="region" />
              <Th label="Commission" s="commission_rate" />
              <Th label="Contact" />
              <Th label="Active" s="is_active" />
              <Th label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {sorted.map(provider => (
              <tr key={provider.id} className="hover:bg-sand/40 transition-colors">
                <td className="px-3 py-2.5 font-medium text-navy whitespace-nowrap">{provider.name}</td>
                <td className="px-3 py-2.5 text-tx-mid capitalize whitespace-nowrap">{provider.type}</td>
                <td className="px-3 py-2.5 text-tx-mid capitalize whitespace-nowrap">{provider.category ?? '—'}</td>
                <td className="px-3 py-2.5 text-tx-mid capitalize whitespace-nowrap">{provider.region}</td>
                <td className="px-3 py-2.5 text-tx-mid whitespace-nowrap">{provider.commission_rate}%</td>
                <td className="px-3 py-2.5 text-tx-mid whitespace-nowrap">
                  {provider.contact_phone
                    ? <a href={`tel:${provider.contact_phone}`} className="hover:underline text-navy">{provider.contact_phone}</a>
                    : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <Toggle checked={provider.is_active} onChange={() => handleToggle(provider.id, !provider.is_active)} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditProvider(provider); setShowForm(true) }} className="text-xs font-medium text-navy hover:underline">Edit</button>
                    <button onClick={() => handleDelete(provider.id, provider.name)} disabled={deletingId === provider.id} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40">
                      {deletingId === provider.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <div className="text-center py-12 text-tx-mid text-sm">No providers yet.</div>}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {sorted.length === 0 && <div className="text-center py-12 text-tx-mid text-sm">No providers yet.</div>}
        {sorted.map(provider => (
          <div key={provider.id} className="bg-white rounded border border-border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-navy text-sm">{provider.name}</div>
                <div className="text-[11px] text-tx-light mt-0.5">{provider.contact_phone ?? provider.email ?? '—'}</div>
              </div>
              <Toggle checked={provider.is_active} onChange={() => handleToggle(provider.id, !provider.is_active)} />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[11px] bg-sand text-tx-mid px-2 py-0.5 rounded capitalize">{provider.type}</span>
              {provider.category && <span className="text-[11px] bg-sand text-tx-mid px-2 py-0.5 rounded capitalize">{provider.category}</span>}
              <span className="text-[11px] bg-sand text-tx-mid px-2 py-0.5 rounded capitalize">{provider.region}</span>
              <span className="text-[11px] text-tx-mid font-medium">{provider.commission_rate}% commission</span>
            </div>
            <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-border-light">
              <button onClick={() => { setEditProvider(provider); setShowForm(true) }} className="text-xs font-semibold text-navy">Edit</button>
              <button onClick={() => handleDelete(provider.id, provider.name)} disabled={deletingId === provider.id} className="text-xs font-semibold text-red-500 disabled:opacity-40">
                {deletingId === provider.id ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ProviderForm
          provider={editProvider}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditProvider(null) }}
          defaultType={typeFilter}
        />
      )}
    </div>
  )
}
