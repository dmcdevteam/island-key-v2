'use client'

import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'

const RENTAL_CARDS = [
  { icon: '🚗', label: 'Rent a Car',      href: '/rentals/search?category=car'          },
  { icon: '🚲', label: 'Bikes & E-Bikes', href: '/rentals/search?category=bike_ebike'   },
  { icon: '🛵', label: 'ATVs & Scooters', href: '/rentals/search?category=atv_motorbike' },
  { icon: '⛵', label: 'Rent a Boat',     href: '/rentals/search?category=boat'          },
]

export default function MovePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-5">
        <h1 className="font-display text-2xl font-medium text-navy">Move Around</h1>
        <p className="text-sm text-tx-light mt-1">Rentals and transfers across Chania</p>
      </div>

      <div className="px-5 flex flex-col gap-6">

        {/* Section A — Rent Something */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-lg font-medium text-navy">Rent Something</h2>
            <p className="text-[11px] text-tx-light">Delivered to your door</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RENTAL_CARDS.map(card => (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                className="bg-white rounded-2xl border border-border-light shadow-sm py-6 flex flex-col items-center gap-2.5 active:scale-[0.97] transition-transform"
              >
                <span className="text-[32px] leading-none">{card.icon}</span>
                <span className="text-[13px] font-semibold text-navy">{card.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light" />

        {/* Section B — Get There */}
        <div>
          <h2 className="font-display text-lg font-medium text-navy mb-3">Get There</h2>
          <button
            onClick={() => router.push('/transfers')}
            className="w-full bg-navy rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <span className="text-[28px] leading-none flex-shrink-0">✈️</span>
              <div className="text-left">
                <p className="font-display text-[20px] text-white leading-tight">Transfers</p>
                <p className="text-[13px] text-white/70 mt-0.5 leading-snug">
                  Airport, port and private transfers across Crete
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-teal rounded-full text-white text-[13px] font-semibold flex-shrink-0 ml-4">
              Book →
            </div>
          </button>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
