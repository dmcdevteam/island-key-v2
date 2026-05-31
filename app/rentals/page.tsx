'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'

const CATEGORIES = [
  {
    slug: 'car',
    label: 'Cars',
    tagline: 'Economy to luxury — with A/C',
    gradient: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A0A 100%)',
  },
  {
    slug: 'atv_motorbike',
    label: 'ATV & Scooters',
    tagline: 'Explore every dirt track',
    gradient: 'linear-gradient(160deg, #1A0D00 0%, #2A1800 100%)',
  },
  {
    slug: 'bike_ebike',
    label: 'Bikes & E-Bikes',
    tagline: 'Pedal the coast at your pace',
    gradient: 'linear-gradient(160deg, #0A1A10 0%, #122A18 100%)',
  },
  {
    slug: 'boat',
    label: 'Boats',
    tagline: 'Hidden coves, no crowds',
    gradient: 'linear-gradient(160deg, #0A0F1A 0%, #0D1E2A 100%)',
  },
]

export default function RentalsLandingPage() {
  const router = useRouter()
  const [catImages, setCatImages] = useState<Record<string, string | null>>({})

  useEffect(() => {
    fetch('/api/rentals/category-images')
      .then(r => r.json())
      .then(data => { if (data && typeof data === 'object') setCatImages(data) })
      .catch(() => {/* use gradients */})
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-5">
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-[0.14em] mb-1">Island Key</p>
        <h1 className="font-display text-[36px] font-light text-ink leading-none">Rentals</h1>
        <p className="text-[13px] text-tx-mid mt-1.5">Cars, bikes, boats — delivered to your door</p>
      </div>

      <div className="flex-1 px-5 space-y-3">
        {/* 2×2 category grid */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => {
            const heroImage = catImages[cat.slug] ?? null
            return (
              <button
                key={cat.slug}
                onClick={() => router.push(`/rentals/search?category=${cat.slug}`)}
                className="card-cinema relative overflow-hidden h-[160px] text-left"
                style={heroImage ? undefined : { background: cat.gradient }}
              >
                {heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="scrim absolute inset-0" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="font-display text-[16px] font-light text-white leading-tight">{cat.label}</p>
                  <p className="text-[11px] text-white/60 mt-0.5 leading-snug">{cat.tagline}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Vacation Essentials */}
        {(() => {
          const heroImage = catImages['essentials'] ?? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'
          return (
            <button
              onClick={() => router.push('/rentals/essentials')}
              className="card-cinema relative w-full overflow-hidden h-[220px] text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="Vacation Essentials" className="absolute inset-0 w-full h-full object-cover" />
              <div className="scrim absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-display text-[20px] font-light text-white leading-tight">Vacation Essentials</p>
                <p className="text-[12px] text-white/60 mt-0.5 leading-snug">Beach gear, baby equipment, camping &amp; more</p>
              </div>
              <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-lime flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          )
        })()}
      </div>

      <BottomNav />
    </div>
  )
}
