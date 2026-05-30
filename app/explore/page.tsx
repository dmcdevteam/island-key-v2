'use client'

import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'

const CARDS = [
  {
    href:     '/activities',
    image:    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80',
    title:    'Experiences',
    subtitle: 'Sailing, hiking, cooking and 40+ curated activities',
  },
  {
    href:     '/events',
    image:    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    title:    'Events & Culture',
    subtitle: 'Festivals, markets, music and local happenings',
  },
  {
    href:     '/services/localize',
    image:    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    title:    'Join the Locals',
    subtitle: 'Fitness classes, dance, workshops and community life',
  },
]

export default function ExplorePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-5">
        <h1 className="font-display text-2xl font-medium text-navy">Explore Crete</h1>
        <p className="text-sm text-tx-light mt-1">Experiences, culture and local life</p>
      </div>

      {/* Editorial cards */}
      <div className="px-5 flex flex-col gap-4">
        {CARDS.map(card => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className="relative w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform shadow-md"
            style={{ height: 200 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="font-display text-[24px] text-white leading-tight">{card.title}</p>
              <p className="text-[13px] text-white/70 mt-1 leading-snug">{card.subtitle}</p>
            </div>
            <div className="absolute bottom-5 right-5 text-white text-xl opacity-80">→</div>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
