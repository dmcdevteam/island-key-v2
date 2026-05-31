'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/bottom-nav'
import { ServicesHeroBanner } from '@/components/ui/services-hero-banner'
import { GlobalSearch } from '@/components/ui/global-search'
import { getSession } from '@/lib/utils'

export default function ServicesPage() {
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
          <h1 className="font-display text-xl font-medium text-navy">Services</h1>
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

      {/* Hero banner */}
      <ServicesHeroBanner />

      <div className="flex-1 overflow-y-auto px-5 space-y-3 pt-4">
        {/* Three category cards */}
        <button
          onClick={() => router.push('/services/in-house')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800"
            alt="In-House Services"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">In-House Services</p>
            <p className="text-[13px] text-white/75 mt-1">Professionals delivered to your door</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

        <button
          onClick={() => router.push('/services/reservations')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
            alt="Restaurants, Access & Event Planning"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">Restaurants, Access &amp; Event Planning</p>
            <p className="text-[13px] text-white/75 mt-1">The best seats, tables and stages in Crete</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

        <button
          onClick={() => router.push('/services/localize')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800"
            alt="Join the Locals"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">Join the Locals</p>
            <p className="text-[13px] text-white/75 mt-1">Shuffle with locals — classes, groups and community experiences</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

        <button
          onClick={() => router.push('/rentals/essentials')}
          className="relative w-full rounded-2xl overflow-hidden h-[200px] text-left active:scale-[0.98] transition-transform shadow-sm block"
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #D4854A 0%, #1B2D4F 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-semibold text-white leading-tight">Vacation Essentials</p>
            <p className="text-[13px] text-white/75 mt-1">Beach gear, baby equipment, camping supplies — delivered</p>
          </div>
          <div className="absolute bottom-4 right-4 text-white text-xl">→</div>
        </button>

      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BottomNav />
    </div>
  )
}
