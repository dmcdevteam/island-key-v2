'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { ProfileAvatar } from '@/app/_components/profile-avatar'

const CATEGORIES = [
  {
    slug: 'car',
    label: 'Cars',
    tagline: 'Economy to luxury — with A/C',
    gradient: 'linear-gradient(135deg, #1B2D4F 0%, #2D4A7A 100%)',
  },
  {
    slug: 'atv_motorbike',
    label: 'ATV & Motorbike',
    tagline: 'Explore every dirt track',
    gradient: 'linear-gradient(135deg, #D4854A 0%, #B8612A 100%)',
  },
  {
    slug: 'bike_ebike',
    label: 'Bike & E-Bike',
    tagline: 'Pedal the coast at your pace',
    gradient: 'linear-gradient(135deg, #1A8A7D 0%, #0D6B60 100%)',
  },
  {
    slug: 'boat',
    label: 'Boat',
    tagline: 'Hidden coves, no crowds',
    gradient: 'linear-gradient(135deg, #2D4A7A 0%, #1A8A7D 100%)',
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
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
            <h1 className="font-display text-xl font-medium text-navy">Rentals</h1>
          </div>
          <ProfileAvatar />
        </div>
        <p className="text-xs text-tx-light mt-0.5">Cars, bikes, boats — delivered to your door</p>
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
                className="relative rounded-2xl overflow-hidden h-[160px] text-left active:scale-[0.97] transition-transform shadow-sm"
                style={heroImage ? undefined : { background: cat.gradient }}
              >
                {heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="font-display text-base font-semibold text-white leading-tight">{cat.label}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 leading-snug">{cat.tagline}</p>
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
              className="relative w-full rounded-2xl overflow-hidden h-[160px] text-left active:scale-[0.97] transition-transform shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="Vacation Essentials" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <p className="font-display text-base font-semibold text-white leading-tight">Vacation Essentials</p>
                <p className="text-[11px] text-white/70 mt-0.5 leading-snug">Beach gear, baby equipment, camping &amp; more</p>
              </div>
            </button>
          )
        })()}
      </div>

      <BottomNav />
    </div>
  )
}
