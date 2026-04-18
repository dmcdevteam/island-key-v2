'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '../login/actions'

const navItems = [
  { href: '/admin/activities', label: 'Activities' },
  { href: '/admin/providers', label: 'Providers' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/info', label: 'Useful Info' },
  { href: '/admin/settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 h-full w-[210px] flex flex-col bg-navy z-40">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-white font-bold tracking-tight">Island Key</span>
        </div>
        <span className="text-[9px] font-bold text-white/40 tracking-[0.25em] uppercase">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Logout */}
      <div className="px-2.5 pb-4 pt-2 border-t border-white/10">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
