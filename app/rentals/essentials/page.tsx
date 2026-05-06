'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RentalEssentialsCategory } from '@/lib/types'

const CATEGORY_ORDER = ['beach', 'baby', 'camping', 'sport', 'comfort', 'other']

const FALLBACK_IMAGES: Record<string, string> = {
  beach:   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  baby:    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
  camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600',
  sport:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
  comfort: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
  other:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
}

export default function EssentialsLandingPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<RentalEssentialsCategory[]>([])
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/rentals/essentials-categories').then(r => r.json()),
      fetch('/api/rentals/essentials').then(r => r.json()),
    ]).then(([catData, itemData]) => {
      setCategories(Array.isArray(catData.categories) ? catData.categories : [])
      const cats = new Set<string>(
        (Array.isArray(itemData.essentials) ? itemData.essentials : []).map((e: { category: string }) => e.category)
      )
      setActiveCats(cats)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const visibleCategories = CATEGORY_ORDER
    .map(slug => categories.find(c => c.category === slug))
    .filter((c): c is RentalEssentialsCategory => !!c && activeCats.has(c.category))

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-navy text-sm">←</button>
          <div>
            <h1 className="font-display text-lg font-medium text-navy leading-tight">Vacation Essentials</h1>
            <p className="text-[11px] text-tx-light">Delivered to your door</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-tx-light text-sm">Loading…</p>
        </div>
      )}

      {!loading && visibleCategories.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-tx-light text-sm text-center">No essentials listed yet — check back soon.</p>
        </div>
      )}

      {!loading && visibleCategories.length > 0 && (
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {visibleCategories.map(cat => {
              const heroImage = cat.image_wide ?? cat.image_url ?? FALLBACK_IMAGES[cat.category] ?? null
              return (
                <button
                  key={cat.category}
                  onClick={() => router.push(`/rentals/essentials/${cat.category}`)}
                  className="relative rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform shadow-sm"
                  style={{ aspectRatio: '3/2' }}
                >
                  {heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImage} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-navy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-sm font-semibold text-white leading-tight">{cat.label}</p>
                    {cat.tagline && (
                      <p className="text-[10px] text-white/70 mt-0.5 leading-snug">{cat.tagline}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
