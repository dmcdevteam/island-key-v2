'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Activity, Provider } from '@/lib/types'
import { ActivityForm } from './activity-form'

type SortKey = 'title' | 'category' | 'region' | 'price_from' | 'sort_order' | 'is_featured' | 'is_active'
type SortDir = 'asc' | 'desc'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-teal' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-tx-light opacity-0 group-hover:opacity-50">↕</span>
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

export function ActivitiesSection() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('sort_order')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editActivity, setEditActivity] = useState<Activity | null | 'new'>('new' as const)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Reset the sentinel so form default is 'closed'
  useEffect(() => {
    setEditActivity(null)
  }, [])

  const fetchActivities = useCallback(async () => {
    const res = await fetch('/api/admin/activities')
    if (!res.ok) { setError('Failed to load activities'); return }
    setActivities(await res.json())
    setLoading(false)
  }, [])

  const fetchProviders = useCallback(async () => {
    const res = await fetch('/api/admin/providers')
    if (res.ok) setProviders(await res.json())
  }, [])

  useEffect(() => {
    fetchActivities()
    fetchProviders()
  }, [fetchActivities, fetchProviders])

  function sortBy(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...activities].sort((a, b) => {
    let av = a[sortKey as keyof Activity] ?? ''
    let bv = b[sortKey as keyof Activity] ?? ''
    if (typeof av === 'boolean') av = av ? 1 : 0
    if (typeof bv === 'boolean') bv = bv ? 1 : 0
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  async function handleToggle(id: string, field: 'is_active' | 'is_featured', value: boolean) {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
    const res = await fetch(`/api/admin/activities/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value }),
    })
    if (!res.ok) {
      // revert
      setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: !value } : a))
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/activities/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setActivities(prev => prev.filter(a => a.id !== id))
    } else {
      setError('Delete failed')
    }
    setDeletingId(null)
  }

  async function handleSave(data: Partial<Activity>) {
    const isEdit = editActivity && editActivity !== 'new' && 'id' in editActivity
    const url = isEdit ? `/api/admin/activities/${(editActivity as Activity).id}` : '/api/admin/activities'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Save failed')
    }
    const saved = await res.json()
    setActivities(prev =>
      isEdit
        ? prev.map(a => a.id === saved.id ? saved : a)
        : [saved, ...prev]
    )
    setShowForm(false)
    setEditActivity(null)
  }

  function openNew() {
    setEditActivity(null)
    setShowForm(true)
  }

  function openEdit(activity: Activity) {
    setEditActivity(activity)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditActivity(null)
  }

  function Th({ label, sortable, col }: { label: string; sortable?: SortKey; col?: string }) {
    if (!sortable) {
      return (
        <th className={`px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap ${col ?? ''}`}>
          {label}
        </th>
      )
    }
    return (
      <th
        className={`px-3 py-2.5 text-left text-[10px] font-bold text-tx-mid uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-tx group ${col ?? ''}`}
        onClick={() => sortBy(sortable)}
      >
        {label}
        <SortIcon active={sortKey === sortable} dir={sortDir} />
      </th>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-sm border border-border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-navy">Activities</h1>
          <p className="text-sm text-tx-mid mt-0.5">{activities.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors"
        >
          + New Activity
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm mb-4">{error}</p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-sand border-b border-border">
            <tr>
              <Th label="Title" sortable="title" />
              <Th label="Category" sortable="category" />
              <Th label="Region" sortable="region" />
              <Th label="Price" sortable="price_from" />
              <Th label="Tier" />
              <Th label="Featured" sortable="is_featured" />
              <Th label="Active" sortable="is_active" />
              <Th label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {sorted.map(activity => (
              <tr key={activity.id} className="hover:bg-sand/40 transition-colors">
                <td className="px-3 py-2.5 font-medium text-navy max-w-[220px]">
                  <div className="truncate">{activity.title}</div>
                  <div className="text-[11px] text-tx-light font-normal truncate">{activity.slug}</div>
                </td>
                <td className="px-3 py-2.5 text-tx-mid capitalize whitespace-nowrap">{activity.category}</td>
                <td className="px-3 py-2.5 text-tx-mid capitalize whitespace-nowrap">{activity.region}</td>
                <td className="px-3 py-2.5 text-tx-mid whitespace-nowrap">
                  {activity.price_from != null ? `€${activity.price_from}` : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1 flex-wrap">
                    {(activity.tier_visibility ?? []).map(t => (
                      <span
                        key={t}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t === 'P' ? 'bg-navy text-white' : t === 'M' ? 'bg-teal/15 text-teal-dark' : 'bg-sand text-tx-mid'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Toggle
                    checked={activity.is_featured}
                    onChange={() => handleToggle(activity.id, 'is_featured', !activity.is_featured)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Toggle
                    checked={activity.is_active}
                    onChange={() => handleToggle(activity.id, 'is_active', !activity.is_active)}
                  />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(activity)}
                      className="text-xs font-medium text-navy hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id, activity.title)}
                      disabled={deletingId === activity.id}
                      className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
                    >
                      {deletingId === activity.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-tx-mid text-sm">
            No activities yet. Click "+ New Activity" to get started.
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ActivityForm
          activity={editActivity !== 'new' ? editActivity : null}
          providers={providers}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
