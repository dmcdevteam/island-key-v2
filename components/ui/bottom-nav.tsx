'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Compass, Car, Sparkles, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home',     Icon: Home,     label: 'Home'     },
  { href: '/explore',  Icon: Compass,  label: 'Explore'  },
  { href: '/move',     Icon: Car,      label: 'Move'     },
  { href: '/services', Icon: Sparkles, label: 'Services' },
  { href: '/profile',  Icon: User,     label: 'Profile'  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50"
    >
      {/*
        Outer pill — ink black, multi-layer shadow, inset highlight on top edge
        All items sit inside with tight gap; active item expands via flex
      */}
      <div
        className="pill-nav flex items-center gap-1 px-2 py-2"
        style={{ paddingBottom: 'max(8px, calc(8px + env(safe-area-inset-bottom, 0px) * 0.4))' }}
      >
        {NAV_ITEMS.map(({ href, Icon, label }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex items-center justify-center rounded-full',
                'transition-all duration-300',
                'active:scale-[0.92]',
                isActive
                  ? 'gap-2 px-4 py-2.5 bg-lime'
                  : 'w-11 h-11 hover:bg-white/10',
              ].join(' ')}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <Icon
                size={isActive ? 17 : 20}
                strokeWidth={isActive ? 2.5 : 1.75}
                className={
                  isActive
                    ? 'text-ink flex-shrink-0'
                    : 'text-white/55 flex-shrink-0'
                }
              />
              {isActive && (
                <span className="text-ink text-[13px] font-semibold leading-none whitespace-nowrap select-none">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
