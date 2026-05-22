'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/home',       icon: '🏠',  label: 'Home' },
  { href: '/activities', icon: '🧭',  label: 'Experiences' },
  { href: '/rentals',    icon: '🚙',  label: 'Rentals' },
  { href: '/transfers',  icon: '🚐',  label: 'Transfers' },
  { href: '/wishlist',   icon: '🤍',  label: 'Wishlist' },
  { href: '/profile',    icon: '👤',  label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

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
    </nav>
  );
}
