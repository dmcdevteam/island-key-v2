'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getSession } from '@/lib/utils';
import { useBookingCard } from './booking-card-context';
import type { GuestSession } from '@/lib/types';

const PHONE = '306974176759';
const HIDDEN_ON = ['/admin', '/splash', '/onboard'];

// Card height 72px + 12px gap + 100px normal = 184px when card visible
// BASE_BOTTOM 100px ensures FAB clears the floating bookings pill (48px pill + ~52px gap)
const CARD_H = 72
const CARD_GAP = 12
const BASE_BOTTOM = 100

export function WhatsAppFAB() {
  const pathname = usePathname();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [hidden,  setHidden]  = useState(false);
  const { visible: bookingCardVisible } = useBookingCard();

  useEffect(() => {
    setSession(getSession());
  }, [pathname]);

  useEffect(() => {
    const show = () => setHidden(true);
    const hide = () => setHidden(false);
    window.addEventListener('drawer:open',  show);
    window.addEventListener('drawer:close', hide);
    return () => {
      window.removeEventListener('drawer:open',  show);
      window.removeEventListener('drawer:close', hide);
    };
  }, []);

  // Hide on gate page, listed routes, or when drawer is open
  if (pathname === '/') return null;
  if (HIDDEN_ON.some(p => pathname.startsWith(p))) return null;
  if (hidden) return null;

  const text = session
    ? `Hi, I'm ${session.first_name} staying at ${session.property_name ?? 'my accommodation'} and I have a question about Island Key.`
    : 'Hi, I have a question about Island Key.';

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-[500] transition-all duration-300"
      style={{
        bottom: bookingCardVisible ? BASE_BOTTOM + CARD_H + CARD_GAP : BASE_BOTTOM,
        right: 'max(1rem, calc(50% - 224px))',
      }}
      aria-label="Chat on WhatsApp"
    >
      {/* Pulsing ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />

      {/* Circle button */}
      <span
        className="relative flex items-center justify-center rounded-full shadow-lg"
        style={{ width: 52, height: 52, background: '#25D366' }}
      >
        {/* WhatsApp icon */}
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 2C8.268 2 2 8.268 2 16c0 2.468.668 4.778 1.832 6.762L2 30l7.43-1.8A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
            fill="white"
          />
          <path
            d="M23.5 19.75c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
            fill="#25D366"
          />
        </svg>
      </span>
    </a>
  );
}
