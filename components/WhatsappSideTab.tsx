'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const PHONE = '306974176759';
const MESSAGE = 'Hi, I need help with my Island Key booking.';
const HREF = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
const HIDDEN_ON = ['/admin', '/splash', '/onboard'];

export function WhatsappSideTab() {
  const pathname  = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [hidden,   setHidden]   = useState(false);

  // Collapse when bookings drawer opens
  useEffect(() => {
    const collapse = () => setHidden(true);
    const reveal   = () => setHidden(false);
    window.addEventListener('drawer:open',  collapse);
    window.addEventListener('drawer:close', reveal);
    return () => {
      window.removeEventListener('drawer:open',  collapse);
      window.removeEventListener('drawer:close', reveal);
    };
  }, []);

  // Auto-collapse after 4 seconds
  useEffect(() => {
    if (!expanded) return;
    const t = setTimeout(() => setExpanded(false), 4000);
    return () => clearTimeout(t);
  }, [expanded]);

  if (pathname === '/') return null;
  if (HIDDEN_ON.some(p => pathname.startsWith(p))) return null;
  if (hidden) return null;

  function handleClick() {
    if (!expanded) {
      setExpanded(true);
    } else {
      window.open(HREF, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={expanded ? 'Chat with us on WhatsApp' : 'Open WhatsApp chat'}
      style={{
        position:        'fixed',
        right:           0,
        top:             '50%',
        transform:       'translateY(-50%)',
        zIndex:          40,
        height:          80,
        width:           expanded ? 140 : 28,
        background:      '#1A8A7D',
        borderRadius:    '8px 0 0 8px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'flex-start',
        paddingLeft:     expanded ? 10 : 5,
        overflow:        'hidden',
        boxShadow:       '-2px 2px 12px rgba(0,0,0,0.18)',
        transition:      'width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor:          'pointer',
        border:          'none',
        outline:         'none',
        whiteSpace:      'nowrap',
      }}
    >
      {/* WhatsApp icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M16 2C8.268 2 2 8.268 2 16c0 2.468.668 4.778 1.832 6.762L2 30l7.43-1.8A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
          fill="white"
        />
        <path
          d="M23.5 19.75c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
          fill="#1A8A7D"
        />
      </svg>

      {/* Label — only visible when expanded */}
      <span
        style={{
          marginLeft:  8,
          color:       'white',
          fontSize:    13,
          fontWeight:  600,
          opacity:     expanded ? 1 : 0,
          transition:  'opacity 150ms ease',
          pointerEvents: 'none',
        }}
      >
        Chat with us
      </span>
    </button>
  );
}
