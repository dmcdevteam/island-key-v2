'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ServiceSubcategory } from '@/lib/types'

const FALLBACK_IMAGES: Record<string, string> = {
  wellness_health:      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
  family_care:          'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=600',
  food_dining:          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
  villa_lifestyle:      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
  private_experiences:  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
}

export default function InHouseSubcategoriesPage() {
  const router = useRouter()
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services/subcategories?category=in_house')
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
            <h1 className="font-display text-lg font-medium text-navy leading-tight">In-House Services</h1>
            <p className="text-[11px] text-tx-light">Professionals delivered to your door</p>
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
                  onClick={() => router.push(`/services/in-house/${cat.subcategory.replace(/_/g, '-')}`)}
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
