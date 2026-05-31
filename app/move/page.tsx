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
    <div className="min-h-screen bg-white flex flex-col pb-[90px]">
      {/* Header */}
      <div className="flex items-end justify-between px-5 pt-[52px] pb-2">
        <div>
          <p className="text-[11px] font-semibold text-tx-light uppercase tracking-[0.14em] mb-1">Island Key</p>
          <h1 className="font-display text-[36px] font-light text-ink leading-none">Move Around</h1>
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

      <p className="px-5 text-[13px] text-tx-mid mb-4">Rentals &amp; transfers across the island</p>

      {/* Search bar */}
      <div className="px-5 pb-5">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-mist border border-border rounded-2xl px-4 py-3 text-left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-[14px] text-tx-light flex-1">Search rentals, transfers…</span>
        </button>
      </div>

      <div className="px-5 flex flex-col gap-7">

        {/* Section A — Rent Something */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-[20px] font-light text-ink">Rent Something</h2>
            <p className="text-[11px] text-tx-light">Delivered to your door</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RENTAL_CARDS.map(card => (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                className="bg-mist rounded-2xl py-6 flex flex-col items-center gap-2.5 active:scale-[0.97] transition-transform"
              >
                <span className="text-[34px] leading-none">{card.icon}</span>
                <span className="text-[13px] font-semibold text-ink">{card.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Section B — Get There */}
        <div>
          <h2 className="font-display text-[20px] font-light text-ink mb-3">Get There</h2>
          <button
            onClick={() => router.push('/transfers')}
            className="card-cinema w-full relative overflow-hidden active:scale-[0.98] transition-transform"
            style={{ height: 180 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80"
              alt="Transfers"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="scrim absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
              <div className="text-left">
                <p className="font-display text-[22px] font-light text-white leading-tight">Transfers</p>
                <p className="text-[13px] text-white/65 mt-0.5 leading-snug">
                  Airport, port &amp; private — across Crete
                </p>
              </div>
              <div className="px-4 py-2 bg-lime rounded-full text-ink text-[13px] font-semibold flex-shrink-0 ml-4">
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
