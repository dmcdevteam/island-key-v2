'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import type { InfoPageFull } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  emergency: 'Emergency', transport: 'Transport', health: 'Health',
  money: 'Money', connectivity: 'Connectivity', language: 'Language',
  culture: 'Culture', practical: 'Practical', other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  emergency: 'bg-red-50 text-red-600', transport: 'bg-blue-50 text-blue-600',
  health: 'bg-green-50 text-green-700', money: 'bg-amber-50 text-amber-700',
  connectivity: 'bg-purple-50 text-purple-700', language: 'bg-teal/10 text-teal',
  culture: 'bg-orange-50 text-orange-600', practical: 'bg-navy/5 text-navy',
  other: 'bg-gray-50 text-gray-600',
}

export default function InfoPage() {
  const router = useRouter()
  const [pages, setPages] = useState<InfoPageFull[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [])

  useEffect(() => {
    fetch('/api/info-pages')
      .then(r => r.json())
      .then(data => { setPages(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const activeCats = ['all', ...Array.from(new Set(pages.map(p => p.category).filter(Boolean)))] as string[]
  const filtered = activeCat === 'all' ? pages : pages.filter(p => p.category === activeCat)

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
          You&apos;re viewing a cached version — offline mode
        </div>
      )}

      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-medium text-navy">Useful Info</h1>
        </div>
        <p className="text-xs text-tx-light mt-0.5">Everything you need for your stay in Crete</p>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4 flex-shrink-0">
        {activeCats.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-3.5 py-[7px] rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border-[1.5px] flex-shrink-0 ${
              activeCat === cat ? 'bg-navy text-white border-navy' : 'bg-white text-tx-mid border-border hover:border-navy/30'
            }`}>
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-navy/5 rounded-sm animate-pulse" />)}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => (
              <button key={item.slug} onClick={() => router.push(`/info/${item.slug}`)}
                className="text-left bg-white border border-border-light rounded-sm p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform">
                <span className="text-2xl">{item.icon ?? '📄'}</span>
                <div>
                  <h3 className="font-semibold text-sm text-navy leading-tight">{item.title}</h3>
                  {item.category && (
                    <span className={`inline-block text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded ${CATEGORY_COLORS[item.category] ?? 'bg-gray-50 text-gray-600'}`}>
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-teal font-semibold self-end">View →</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 py-12 text-center text-tx-light text-sm">No info pages in this category.</div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
