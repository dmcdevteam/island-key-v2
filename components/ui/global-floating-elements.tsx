'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSession } from '@/lib/utils'
import { useEssentialsCart } from '@/lib/essentials-cart'

// ── Element 1: Confirmed bookings pill ────────────────────────────────────────

function ConfirmedBookingsPill({ count }: { count: number }) {
  const router = useRouter()
  if (count === 0) return null

  return (
    <>
      <style>{`
        @keyframes ik-gpulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        .ik-gpulse { animation: ik-gpulse 2s ease-in-out infinite; }
      `}</style>
      <button
        onClick={() => router.push('/profile')}
        className="fixed left-1/2 -translate-x-1/2 z-[49] flex items-center gap-2.5 bg-white rounded-full shadow-elevated px-5 py-3 active:scale-[0.98] transition-transform whitespace-nowrap"
        style={{ bottom: '108px' }}
        aria-label={`${count} confirmed booking${count !== 1 ? 's' : ''} — view profile`}
      >
        <span className="ik-gpulse flex-shrink-0 w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-[14px] font-medium text-navy">
          {count} confirmed booking{count !== 1 ? 's' : ''}
        </span>
      </button>
    </>
  )
}

// ── Element 2: Pending cart floating card ─────────────────────────────────────

function PendingCartCard({ pillShowing }: { pillShowing: boolean }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { cartCount } = useEssentialsCart()

  // Store the cartCount at the time of dismiss; reappear if count grows past it
  const [dismissedAt, setDismissedAt] = useState<number>(-1) // -1 = not yet initialised
  const initialised = dismissedAt !== -1

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ik_cart_dismissed_at')
      setDismissedAt(stored !== null ? Number(stored) : 0)
    } catch {
      setDismissedAt(0)
    }
  }, [])

  // Track previous cartCount so we only re-show when count *increases*
  const prevCountRef = useRef(cartCount)
  useEffect(() => {
    if (!initialised) return
    if (cartCount > prevCountRef.current && cartCount > dismissedAt) {
      // New items added after dismiss — clear dismissed flag
      setDismissedAt(0)
      try { sessionStorage.removeItem('ik_cart_dismissed_at') } catch {}
    }
    prevCountRef.current = cartCount
  }, [cartCount, dismissedAt, initialised])

  function dismiss() {
    setDismissedAt(cartCount)
    try { sessionStorage.setItem('ik_cart_dismissed_at', String(cartCount)) } catch {}
  }

  const hidden =
    !initialised ||
    cartCount === 0 ||
    cartCount <= dismissedAt ||
    pathname === '/rentals/essentials/cart'

  if (hidden) return null

  // Sit above the confirmed pill when both are visible
  // New floating nav sits at bottom-7 (~28px) with ~56px height → top edge at ~84px
  // Stack: cart card above bookings pill above nav
  const bottomPx = pillShowing ? 180 : 108

  return (
    <div
      className="fixed right-4 z-[49] w-[280px] bg-navy rounded-2xl shadow-xl p-4 transition-all"
      style={{ bottom: bottomPx }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-teal text-base leading-none">🛒</span>
          <span className="text-[13px] font-semibold text-white">Items awaiting enquiry</span>
        </div>
        <button
          onClick={dismiss}
          className="text-white/50 hover:text-white/90 text-xl leading-none -mr-0.5 -mt-0.5 flex-shrink-0"
          aria-label="Dismiss"
        >×</button>
      </div>

      {/* Middle */}
      <p className="text-[12px] text-white/70 mb-3">
        {cartCount} item{cartCount !== 1 ? 's' : ''} in your Essentials cart
      </p>

      {/* CTA */}
      <button
        onClick={() => router.push('/rentals/essentials/cart')}
        className="w-full py-2 bg-teal text-white text-sm font-semibold rounded-full active:scale-[0.98] transition-transform"
      >
        Complete Enquiry →
      </button>
    </div>
  )
}

// ── Exported: renders both elements, coordinates positioning ──────────────────

export function GlobalFloatingElements() {
  const [confirmedCount, setConfirmedCount] = useState(0)

  useEffect(() => {
    try {
      const session = getSession()
      if (!session?.guest_id) return
      fetch(`/api/bookings?guest_id=${encodeURIComponent(session.guest_id)}`)
        .then(r => r.json())
        .then((rows: any[]) => {
          if (!Array.isArray(rows)) return
          setConfirmedCount(rows.filter(b => b.status === 'confirmed').length)
        })
        .catch(() => {})
    } catch {}
  }, [])

  return (
    <>
      <ConfirmedBookingsPill count={confirmedCount} />
      <PendingCartCard pillShowing={confirmedCount > 0} />
    </>
  )
}
