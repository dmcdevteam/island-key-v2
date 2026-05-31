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

  const SERVICE_CARDS = [
    {
      href:     '/services/in-house',
      image:    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      alt:      'In-House Services',
      title:    'In-House Services',
      subtitle: 'Professionals delivered to your door',
    },
    {
      href:     '/services/reservations',
      image:    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      alt:      'Restaurants & Access',
      title:    'Restaurants, Access & Events',
      subtitle: 'The best seats, tables and stages in Crete',
    },
    {
      href:     '/services/localize',
      image:    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      alt:      'Join the Locals',
      title:    'Join the Locals',
      subtitle: 'Classes, groups and community experiences',
    },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col pb-[90px]">
      {/* Header */}
      <div className="flex items-end justify-between px-5 pt-[52px] pb-2">
        <div>
          <p className="text-[11px] font-semibold text-tx-light uppercase tracking-[0.14em] mb-1">Island Key</p>
          <h1 className="font-display text-[36px] font-light text-ink leading-none">Services</h1>
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

      <p className="px-5 text-[13px] text-tx-mid mb-4">Your personal concierge — anything you need</p>

      {/* Hero banner */}
      <ServicesHeroBanner />

      <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-3">
        {/* Photo cards */}
        {SERVICE_CARDS.map(card => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className="card-cinema relative w-full overflow-hidden text-left h-[200px] block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt={card.alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="scrim absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-display text-[22px] font-light text-white leading-tight">{card.title}</p>
              <p className="text-[13px] text-white/65 mt-1">{card.subtitle}</p>
            </div>
            <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-lime flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        ))}

        {/* Essentials — ink/lime gradient */}
        <button
          onClick={() => router.push('/rentals/essentials')}
          className="card-cinema relative w-full overflow-hidden text-left h-[200px] block"
        >
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #141E08 60%, #1A2A0A 100%)' }}
          />
          {/* Subtle lime glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(200,241,53,0.18) 0%, transparent 60%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-[22px] font-light text-white leading-tight">Vacation Essentials</p>
            <p className="text-[13px] text-white/60 mt-1">Beach gear, baby equipment, camping supplies — delivered</p>
          </div>
          <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-lime flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </button>

      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BottomNav />
    </div>
  )
}
