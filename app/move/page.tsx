'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/bottom-nav'
import { GlobalSearch } from '@/components/ui/global-search'
import { getSession } from '@/lib/utils'

const RENTAL_CARDS = [
  { icon: '🚗', label: 'Rent a Car',      href: '/rentals/search?category=car'          },
  { icon: '🚲', label: 'Bikes & E-Bikes', href: '/rentals/search?category=bike_ebike'   },
  { icon: '🛵', label: 'ATVs & Scooters', href: '/rentals/search?category=atv_motorbike' },
  { icon: '⛵', label: 'Rent a Boat',     href: '/rentals/search?category=boat'          },
]

export default function MovePage() {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const s = getSession()
    if (!s?.guest_id) return
    const params = new URLSearchParams({ guest_id: s.guest_id })
    if (s.property_id) params.set('property_id', s.property_id)
    fetch(`/api/notifications?${params}`)
      .then(r => r.json())
      .then(data => {
        const notifs = Array.isArray(data.notifications) ? data.notifications : []
        setUnreadCount(notifs.filter((n: any) => !n.is_read).length)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
        </div>
        <Link href="/notifications" className="relative inline-flex active:scale-90 transition-transform">
          <span className="text-[22px] opacity-70">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Search bar */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-white border border-border-light rounded-2xl px-4 py-3 shadow-sm text-left"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-[15px] font-normal italic text-[#9CA3AF] flex-1">What are you looking for today?</span>
        </button>
      </div>

      {/* Page title */}
      <div className="px-5 pb-5">
        <h1 className="font-display text-2xl font-medium text-navy">Move Around</h1>
        <p className="text-sm text-tx-light mt-1">Rentals and transfers across the Island</p>
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
            className="w-full relative rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            style={{ minHeight: 160 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80"
              alt="Transfers"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(27,45,79,0.85) 0%, rgba(27,45,79,0.3) 50%, transparent 100%)' }}
            />
            <div className="relative z-10 p-5 flex items-end justify-between" style={{ minHeight: 160 }}>
              <div className="text-left">
                <p className="font-display text-[20px] text-white leading-tight">Transfers</p>
                <p className="text-[13px] text-white/70 mt-0.5 leading-snug">
                  Airport, port and private transfers across Crete
                </p>
              </div>
              <div className="px-3 py-1.5 bg-teal rounded-full text-white text-[13px] font-semibold flex-shrink-0 ml-4">
                Book →
              </div>
            </div>
          </button>
        </div>

      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BottomNav />
    </div>
  )
}
