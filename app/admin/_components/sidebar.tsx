'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '../login/actions'

const PRE_RENTALS = [
  { href: '/admin/activities', label: 'Activities' },
  { href: '/admin/services',   label: 'Services' },
  { href: '/admin/bookings',   label: 'Bookings' },
  { href: '/admin/images',     label: 'Images' },
  { href: '/admin/providers',  label: 'Providers' },
  { href: '/admin/properties', label: 'Properties' },
]

const RENTALS_SUBNAV = [
  { href: '/admin/rentals/cars',       label: 'Cars' },
  { href: '/admin/rentals/atv',        label: 'ATVs & Motorbikes' },
  { href: '/admin/rentals/bikes',      label: 'Bikes & E-Bikes' },
  { href: '/admin/rentals/boats',      label: 'Boats' },
  { href: '/admin/rentals/essentials', label: 'Vacation Essentials' },
  { href: '/admin/rentals/settings',   label: 'Rental Settings' },
]

const POST_RENTALS = [
  { href: '/admin/transfers',           label: 'Transfers' },
  { href: '/admin/transfer-bookings',  label: 'Transfer Bookings' },
  { href: '/admin/transfer-pricing',   label: 'Transfer Pricing' },
  { href: '/admin/transfer-providers', label: 'Transfer Providers' },
  { href: '/admin/change-requests', label: 'Change Requests' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/info', label: 'Useful Info' },
  { href: '/admin/settings', label: 'Settings' },
]

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()

  function NavLink({ href, label, sub = false }: { href: string; label: string; sub?: boolean }) {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        onClick={onNavClick}
        className={`flex items-center rounded transition-colors ${
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
        {label}
      </Link>
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
            localStorage.removeItem('ik_session'); // fresh preview — start from gate
            window.open('/', '_blank');
          }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-white/25 rounded text-[12px] font-semibold text-white/70 hover:text-white hover:border-white/50 transition-colors"
        >
          ⚙ Preview App
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {PRE_RENTALS.map(item => <NavLink key={item.href} href={item.href} label={item.label} />)}

        {/* Rentals group */}
        <div className="pt-1 pb-0.5">
          <p className="px-3 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Rentals</p>
          <div className="ml-1 border-l border-white/10 pl-0.5 space-y-0.5">
            {RENTALS_SUBNAV.map(item => <NavLink key={item.href} href={item.href} label={item.label} sub />)}
          </div>
        </div>

        {POST_RENTALS.map(item => <NavLink key={item.href} href={item.href} label={item.label} />)}

        <div className="border-t border-white/10 mt-2 pt-2">
          <Link
            href="/admin/qr"
            onClick={onNavClick}
            className={`flex items-center px-3 py-2 rounded text-[13px] font-medium transition-colors ${
              pathname.startsWith('/admin/qr')
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:text-white hover:bg-white/10'
            }`}
          >
            QR Codes
          </Link>
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
