'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '../login/actions'

const ACTIVITIES_SUBNAV = [
  { href: '/admin/activities',           label: 'Listings' },
  { href: '/admin/activities/providers', label: 'Providers' },
  { href: '/admin/activities/images',    label: 'Images' },
]

const SERVICES_SUBNAV = [
  { href: '/admin/services',           label: 'Listings' },
  { href: '/admin/services/providers', label: 'Providers' },
  { href: '/admin/services/images',    label: 'Images' },
]

const RENTALS_SUBNAV = [
  { href: '/admin/rentals/cars',       label: 'Cars' },
  { href: '/admin/rentals/atv',        label: 'ATVs & Motorbikes' },
  { href: '/admin/rentals/bikes',      label: 'Bikes & E-Bikes' },
  { href: '/admin/rentals/boats',      label: 'Boats' },
  { href: '/admin/rentals/essentials', label: 'Vacation Essentials' },
  { href: '/admin/rentals/settings',   label: 'Rental Settings' },
]

const TRANSFERS_SUBNAV = [
  { href: '/admin/transfer-bookings',  label: 'Bookings' },
  { href: '/admin/transfer-pricing',   label: 'Pricing' },
  { href: '/admin/transfer-providers', label: 'Providers' },
  { href: '/admin/change-requests',    label: 'Change Requests' },
  { href: '/admin/transfers/images',   label: 'Images' },
]

const STANDALONE_LINKS = [
  { href: '/admin/enquiries',  label: 'All Enquiries' },
  { href: '/admin/deals',      label: 'Deals' },
  { href: '/admin/events',     label: 'Events' },
  { href: '/admin/articles',   label: 'Articles' },
  { href: '/admin/info',       label: 'Useful Info' },
  { href: '/admin/settings',   label: 'Settings' },
]

type NavCounts = {
  activity: number; service: number; rental: number
  bike_rental: number; boat_rental: number; transfer: number
  essentials: number; total: number
}

const EMPTY_COUNTS: NavCounts = {
  activity: 0, service: 0, rental: 0,
  bike_rental: 0, boat_rental: 0, transfer: 0,
  essentials: 0, total: 0,
}

function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-[#1A8A7D] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
      {label}
    </p>
  )
}

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<NavCounts>(EMPTY_COUNTS)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/admin/enquiry-counts')
        if (res.ok) {
          const data = await res.json()
          setCounts({ ...EMPTY_COUNTS, ...data.counts })
        }
      } catch {}
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60_000)
    return () => clearInterval(interval)
  }, [])

  function NavLink({ href, label, sub = false, badge = 0, exact = false }: {
    href: string; label: string; sub?: boolean; badge?: number; exact?: boolean
  }) {
    const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'))
    return (
      <Link
        href={href}
        onClick={onNavClick}
        className={`flex items-center gap-1 rounded transition-colors ${
          sub ? 'pl-5 pr-3 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px] font-medium'
        } ${
          isActive
            ? sub
              ? 'border-l-2 border-teal ml-[-1px] pl-[19px] text-white bg-white/10'
              : 'bg-white/15 text-white'
            : sub
              ? 'text-white/45 hover:text-white hover:bg-white/10'
              : 'text-white/55 hover:text-white hover:bg-white/10'
        }`}
      >
        <span>{label}</span>
        <Badge count={badge} />
      </Link>
    )
  }

  function SubGroup({ label, items, badgeMap = {} }: {
    label: string
    items: { href: string; label: string }[]
    badgeMap?: Partial<Record<string, number>>
  }) {
    return (
      <div className="pb-0.5">
        <GroupLabel label={label} />
        <div className="ml-1 border-l border-white/10 pl-0.5 space-y-0.5">
          {items.map(item => (
            <NavLink key={item.href} href={item.href} label={item.label} sub badge={badgeMap[item.href] ?? 0} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Logo + Preview button */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-white font-bold tracking-tight">Island Key</span>
        </div>
        <span className="text-[9px] font-bold text-white/40 tracking-[0.25em] uppercase">Admin Panel</span>
        <button
          type="button"
          onClick={() => {
            document.cookie = 'ik_access=1; path=/; max-age=7776000; SameSite=Lax';
            localStorage.setItem('ik_admin_preview', '1');
            localStorage.removeItem('ik_session');
            window.open('/', '_blank');
          }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-white/25 rounded text-[12px] font-semibold text-white/70 hover:text-white hover:border-white/50 transition-colors"
        >
          ⚙ Preview App
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">

        {/* Activities group */}
        <SubGroup label="Activities" items={ACTIVITIES_SUBNAV} badgeMap={{
          '/admin/activities': counts.activity,
        }} />

        {/* Services group */}
        <SubGroup label="Services" items={SERVICES_SUBNAV} badgeMap={{
          '/admin/services': counts.service,
        }} />

        {/* Properties — standalone */}
        <NavLink href="/admin/properties" label="Properties" />

        {/* Rentals group */}
        <SubGroup label="Rentals" items={RENTALS_SUBNAV} badgeMap={{
          '/admin/rentals/cars':      counts.rental,
          '/admin/rentals/bikes':     counts.bike_rental,
          '/admin/rentals/boats':     counts.boat_rental,
          '/admin/rentals/essentials': counts.essentials,
        }} />

        {/* Transfers group */}
        <SubGroup label="Transfers" items={TRANSFERS_SUBNAV} badgeMap={{
          '/admin/transfer-bookings': counts.transfer,
        }} />

        {/* Standalone links */}
        <div className="pt-2 space-y-0.5">
          {STANDALONE_LINKS.map(item => (
            <NavLink key={item.href} href={item.href} label={item.label}
              badge={item.href === '/admin/enquiries' ? counts.total : 0} />
          ))}
        </div>

        <div className="border-t border-white/10 mt-2 pt-2">
          <NavLink href="/admin/qr" label="QR Codes" />
        </div>
      </nav>

      {/* Footer: live app link + logout */}
      <div className="px-2.5 pb-4 pt-2 border-t border-white/10 flex-shrink-0 space-y-0.5">
        <a
          href="https://app.islandkey.gr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 rounded text-[13px] font-medium text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          View live app ↗
        </a>
        <button
          type="button"
          onClick={() => {
            document.cookie = 'ik_access=; path=/; max-age=0; SameSite=Lax';
            localStorage.removeItem('ik_session');
            localStorage.removeItem('ik_access_granted');
            localStorage.removeItem('ik_admin_preview');
            window.open('/', '_blank');
          }}
          className="w-full text-left px-3 py-2 text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          Test as Guest
        </button>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}

// Bare navy shell — login page only, no hooks
function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1B2D4F' }}>
      {children}
    </div>
  )
}

// Full admin shell — all hooks called unconditionally, no early returns
function FullShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar whenever route changes (after mobile nav tap)
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: always visible, fixed left */}
      {/* Mobile: slides in from left as overlay */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[210px] flex flex-col bg-navy z-40
          transition-transform duration-200
          md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <NavContent onNavClick={() => setOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[210px] min-w-0 overflow-x-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-navy sticky top-0 z-20 flex-shrink-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-white/80 hover:text-white text-xl w-8 h-8 flex items-center justify-center"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="font-display text-base text-white font-bold tracking-tight">Island Key Admin</span>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

// Router — only usePathname here, used immediately, no other hooks
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/admin/login') {
    return <LoginShell>{children}</LoginShell>
  }
  return <FullShell>{children}</FullShell>
}

export { AdminShell as Sidebar }
