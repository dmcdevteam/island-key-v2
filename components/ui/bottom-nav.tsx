'use client';

import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/home',       icon: '🏠',  label: 'Home' },
  { href: '/activities', icon: '🧭',  label: 'Activities' },
  { href: '/rentals',    icon: '🚙',  label: 'Rentals' },
  { href: '/transfers',  icon: '🚐',  label: 'Transfers' },
  { href: '/info',       icon: 'ℹ️',  label: 'Info' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[78px] bg-white border-t border-border-light flex pt-1.5 pb-6 z-50 max-w-[100vw]">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
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
          </button>
        );
      })}
    </nav>
  );
}
