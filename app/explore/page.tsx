'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/bottom-nav'
import { GlobalSearch } from '@/components/ui/global-search'
import { getSession } from '@/lib/utils'

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
      <div className="px-5 pb-4">
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
      <div className="px-5 pb-4">
        <h1 className="font-display text-2xl font-medium text-navy">Explore the Island</h1>
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

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BottomNav />
    </div>
  )
}
