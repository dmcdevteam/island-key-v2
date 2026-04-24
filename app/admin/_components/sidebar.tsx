'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '../login/actions'

const navItems = [
  { href: '/admin/activities', label: 'Activities' },
  { href: '/admin/images',     label: 'Images' },
  { href: '/admin/providers',  label: 'Providers' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/rentals',    label: 'Rentals' },
  { href: '/admin/transfers',  label: 'Transfers' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/info', label: 'Useful Info' },
  { href: '/admin/settings', label: 'Settings' },
]

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
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
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          )
        })}

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

export function AdminShell({ children }: { children: React.ReactNode }) {
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
      <div className="flex-1 flex flex-col min-h-screen md:ml-[210px]">

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

// Keep old name exported so any direct imports still work
export { AdminShell as Sidebar }
