'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AdminPreviewPill() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Read localStorage on every navigation
  useEffect(() => {
    setActive(localStorage.getItem('ik_admin_preview') === '1');
  }, [pathname]);

  // Don't render on admin pages or when not in preview mode
  if (!active || pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Backdrop to close dropdown */}
      {open && (
        <div className="fixed inset-0 z-[900]" onClick={() => setOpen(false)} />
      )}

      <div className="fixed top-3 right-3 z-[1000]">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 bg-navy text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg tracking-wide"
        >
          ⚙ Admin Preview
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-sm shadow-xl py-1 min-w-[170px]">
            <button
              onClick={() => { setOpen(false); router.push('/admin'); }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-tx hover:bg-sand transition-colors"
            >
              Go to Admin Panel
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('ik_admin_preview');
                setActive(false);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-tx hover:bg-sand transition-colors border-t border-border-light"
            >
              Exit Preview
            </button>
          </div>
        )}
      </div>
    </>
  );
}
