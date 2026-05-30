'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Compass, Car, Sparkles, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home',     Icon: Home,     label: 'Home'        },
  { href: '/explore',  Icon: Compass,  label: 'Explore'     },
  { href: '/move',     Icon: Car,      label: 'Move Around' },
  { href: '/services', Icon: Sparkles, label: 'Services'    },
  { href: '/profile',  Icon: User,     label: 'Profile'     },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[78px] bg-white border-t border-border-light flex pt-1.5 pb-6 z-50">
      {NAV_ITEMS.map(({ href, Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.75}
              className={isActive ? 'text-teal' : 'text-tx-light'}
            />
            <span
              className={`text-[9px] font-semibold transition-colors leading-none mt-0.5 ${
                isActive ? 'text-teal' : 'text-tx-light'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
