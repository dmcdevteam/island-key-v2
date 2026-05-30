'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ServiceSubcategory } from '@/lib/types'

const FALLBACK_IMAGES: Record<string, string> = {
  fitness_sports:  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
  arts_dance:      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600',
  workshops:       'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600',
  social_culture:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600',
}

export default function LocalizeSubcategoriesPage() {
  const router = useRouter()
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services/subcategories?category=localize')
      .then(r => r.json())
      .then(d => { setSubcategories(Array.isArray(d.subcategories) ? d.subcategories : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/services')} className="text-navy text-sm">←</button>
          <div>
            <h1 className="font-display text-lg font-medium text-navy leading-tight">Join the Locals</h1>
            <p className="text-[11px] text-tx-light">Shuffle with locals — classes, groups and community</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-tx-light text-sm">Loading…</p>
        </div>
      )}

      {!loading && subcategories.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-tx-light text-sm text-center">No services available yet — check back soon.</p>
        </div>
      )}

      {!loading && subcategories.length > 0 && (
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {subcategories.map(cat => {
              const heroImage = cat.image_wide ?? cat.image_url ?? FALLBACK_IMAGES[cat.subcategory] ?? null
              return (
                <button
                  key={cat.subcategory}
                  onClick={() => router.push(`/services/localize/${cat.subcategory.replace(/_/g, '-')}`)}
                  className="relative rounded-2xl overflow-hidden h-[160px] text-left active:scale-[0.97] transition-transform shadow-sm"
                >
                  {heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImage} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-navy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
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
