'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Property } from '@/lib/types'
import { PropertyForm } from './property-form'

type SortKey = 'name' | 'region' | 'tier' | 'commission_rate' | 'is_active'

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

export function PropertiesSection() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editProperty, setEditProperty] = useState<Property | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    const res = await fetch('/api/admin/properties')
    if (!res.ok) {
      setError(`Failed to load properties (${res.status})`)
      setLoading(false)
      return
    }
    setProperties(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  function sortBy(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...properties].sort((a, b) => {
    let av = a[sortKey] ?? ''
    let bv = b[sortKey] ?? ''
    if (typeof av === 'boolean') av = av ? 1 : 0
    if (typeof bv === 'boolean') bv = bv ? 1 : 0
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  async function handleToggle(id: string, value: boolean) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_active: value } : p))
    const res = await fetch(`/api/admin/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: value }),
    })
    if (!res.ok) setProperties(prev => prev.map(p => p.id === id ? { ...p, is_active: !value } : p))
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/properties/${id}`, { method: 'DELETE' })
    if (res.ok) setProperties(prev => prev.filter(p => p.id !== id))
    else setError('Delete failed')
    setDeletingId(null)
  }

  async function handleSave(data: Partial<Property>) {
    const url = editProperty ? `/api/admin/properties/${editProperty.id}` : '/api/admin/properties'
    const method = editProperty ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Save failed') }
    const saved = await res.json()
    setProperties(prev =>
      editProperty ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    )
    setShowForm(false)
    setEditProperty(null)
  }

  function Th({ label, s }: { label: string; s?: SortKey }) {
    if (!s) return <th className="px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide">{label}</th>
    const active = sortKey === s
    return (
      <th
        className="px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide cursor-pointer select-none hover:text-tx"
        onClick={() => sortBy(s)}
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  if (loading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white rounded-sm border border-border animate-pulse" />)}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-navy">Properties</h1>
          <p className="text-sm text-tx-mid mt-0.5">{properties.length} total</p>
        </div>
        <button
          onClick={() => { setEditProperty(null); setShowForm(true) }}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors"
        >
          + New Property
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm mb-4">{error}</p>}

      <div className="overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-sand border-b border-border">
            <tr>
              <Th label="Name" s="name" />
              <Th label="Slug" />
              <Th label="Region" s="region" />
              <Th label="Tier" s="tier" />
              <Th label="Host" />
              <Th label="Commission" s="commission_rate" />
              <Th label="Active" s="is_active" />
              <Th label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {sorted.map(property => (
              <tr key={property.id} className="hover:bg-sand/40 transition-colors">
                <td className="px-3 py-2.5 font-medium text-navy whitespace-nowrap">{property.name}</td>
                <td className="px-3 py-2.5 text-tx-light font-mono text-xs whitespace-nowrap">{property.slug}</td>
                <td className="px-3 py-2.5 text-tx-mid capitalize whitespace-nowrap">{property.region}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                    property.tier === 'P' ? 'bg-navy text-white' : property.tier === 'M' ? 'bg-teal/15 text-teal-dark' : 'bg-sand text-tx-mid'
                  }`}>
                    {property.tier === 'P' ? 'Premium' : property.tier === 'M' ? 'Mid' : 'Budget'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-tx-mid whitespace-nowrap">{property.host_name ?? '—'}</td>
                <td className="px-3 py-2.5 text-tx-mid whitespace-nowrap">{property.commission_rate}%</td>
                <td className="px-3 py-2.5">
                  <Toggle checked={property.is_active} onChange={() => handleToggle(property.id, !property.is_active)} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditProperty(property); setShowForm(true) }} className="text-xs font-medium text-navy hover:underline">Edit</button>
                    <button onClick={() => handleDelete(property.id, property.name)} disabled={deletingId === property.id} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40">
                      {deletingId === property.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <div className="text-center py-12 text-tx-mid text-sm">No properties yet.</div>}
      </div>

      {showForm && (
        <PropertyForm
          property={editProperty}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditProperty(null) }}
        />
      )}
    </div>
  )
}
