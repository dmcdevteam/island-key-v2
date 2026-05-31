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
    <div className="min-h-screen bg-white flex flex-col pb-[90px]">
      {/* Header */}
      <div className="flex items-end justify-between px-5 pt-[52px] pb-2">
        <div>
          <p className="text-[11px] font-semibold text-tx-light uppercase tracking-[0.14em] mb-1">Island Key</p>
          <h1 className="font-display text-[36px] font-light text-ink leading-none">Discover</h1>
        </div>
        <Link href="/notifications" className="relative inline-flex active:scale-90 transition-transform mb-1">
          <span className="text-[22px] opacity-60">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-ember text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      <p className="px-5 text-[13px] text-tx-mid mb-4">Experiences, culture &amp; local life</p>

      {/* Search bar */}
      <div className="px-5 pb-5">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-mist border border-border rounded-2xl px-4 py-3 text-left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-[14px] text-tx-light flex-1">Search activities, events…</span>
        </button>
      </div>

      {/* Editorial cards */}
      <div className="px-5 flex flex-col gap-4">
        {CARDS.map((card, i) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className="card-cinema relative w-full overflow-hidden text-left"
            style={{ height: i === 0 ? 260 : 200 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="scrim absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="font-display text-[26px] font-light text-white leading-tight">{card.title}</p>
              <p className="text-[13px] text-white/65 mt-1 leading-snug">{card.subtitle}</p>
            </div>
            {/* Lime circle arrow */}
            <div className="absolute bottom-5 right-5 w-9 h-9 rounded-full bg-lime flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BottomNav />
    </div>
  )
}
