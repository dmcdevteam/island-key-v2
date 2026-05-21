'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { getSession } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/home',       icon: '🏠',  label: 'Home' },
  { href: '/activities', icon: '🧭',  label: 'Activities' },
  { href: '/rentals',    icon: '🚙',  label: 'Rentals' },
  { href: '/transfers',  icon: '🚐',  label: 'Transfers' },
  { href: '/info',       icon: 'ℹ️',  label: 'Info' },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const session = getSession();
      if (!session?.guest_id) return;
      const params = new URLSearchParams({ guest_id: session.guest_id });
      if (session.property_id) params.set('property_id', session.property_id);
      fetch(`/api/notifications?${params}`)
        .then(r => r.json())
        .then(data => {
          const notifs = Array.isArray(data.notifications) ? data.notifications : [];
          setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
        })
        .catch(() => {});
    } catch {}
  }, []);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[78px] bg-white border-t border-border-light flex pt-1.5 pb-6 z-50">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all',
              'active:scale-95'
            )}
          >
            <span
              className={clsx(
                'text-[17px] transition-opacity',
                isActive ? 'opacity-100' : 'opacity-30'
              )}
            >
              {item.icon}
            </span>
            <span
              className={clsx(
                'text-[9px] font-semibold transition-colors',
                isActive ? 'text-teal font-bold' : 'text-tx-light'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Notifications bell */}
      <Link
        href="/notifications"
        className={clsx(
          'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95',
        )}
      >
        <span className="relative inline-flex">
          <span className={clsx('text-[17px] transition-opacity', pathname.startsWith('/notifications') ? 'opacity-100' : 'opacity-30')}>
            🔔
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-teal text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        <span className={clsx('text-[9px] font-semibold transition-colors', pathname.startsWith('/notifications') ? 'text-teal font-bold' : 'text-tx-light')}>
          Alerts
        </span>
      </Link>
    </nav>
  );
}
