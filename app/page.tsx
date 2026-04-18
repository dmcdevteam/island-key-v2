'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasSession } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { Tier, Region } from '@/lib/types';

// Sets the access cookie client-side so subsequent requests pass middleware
function grantAccessCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'ik_access=1; path=/; max-age=7776000; SameSite=Lax'; // 90 days
}

// ─────────────────────────────────────────────────────────────────────────────
function GatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    async function route() {
      const p = searchParams.get('p');
      const t = searchParams.get('t') as Tier | null;
      const r = searchParams.get('r') as Region | null;

      // ── QR path: valid short params present ──────────────────────────────
      if (
        p && t && r &&
        ['B', 'M', 'P'].includes(t) &&
        ['chania', 'rethymno', 'heraklion', 'lasithi'].includes(r)
      ) {
        let propertyName: string | null = null;
        try {
          const supabase = createClient();
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          );
          const { data } = await Promise.race([
            supabase.from('properties').select('name').eq('slug', p).single(),
            timeout,
          ]);
          propertyName = (data as { name: string } | null)?.name ?? null;
        } catch { /* fall through without property name */ }

        localStorage.setItem('ik_qr', JSON.stringify({
          prop: p, tier: t, region: r, property_name: propertyName,
        }));
        grantAccessCookie();
        router.replace('/splash');
        return;
      }

      // ── Returning guest: session in localStorage ──────────────────────────
      if (hasSession()) {
        grantAccessCookie();
        router.replace('/home');
        return;
      }

      // ── Previously granted access: entered a key but no session yet ───────
      if (localStorage.getItem('ik_access_granted') === 'true') {
        grantAccessCookie();
        router.replace('/onboard');
        return;
      }

      // ── No access: show gate UI ───────────────────────────────────────────
      setReady(true);
    }

    route();
  }, [router, searchParams]);

  async function handleSubmit() {
    if (!key.trim() || loading) return;
    setLoading(true);
    setKeyError('');
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() }),
      });
      const json = await res.json();
      if (json.valid) {
        localStorage.setItem('ik_access_granted', 'true');
        // Cookie already set by the API Set-Cookie header
        router.replace('/onboard');
      } else {
        setKeyError(json.message ?? 'Invalid or expired access key');
      }
    } catch {
      setKeyError('Connection error — please try again');
    }
    setLoading(false);
  }

  // ── Loading / routing ────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#1B2D4F' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_icon_transparent.png"
          alt="Island Key"
          className="animate-pulse opacity-30"
          style={{ height: 80, width: 'auto' }}
        />
      </div>
    );
  }

  // ── Gate UI ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(155deg, #1B2D4F 0%, #1a3a5c 50%, #1A8A7D 100%)' }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_icon_transparent.png"
          alt="Island Key"
          style={{ height: 110, width: 'auto', marginBottom: 20 }}
        />

        {/* Wordmark */}
        <h1 className="font-display text-[38px] font-medium text-white tracking-tight leading-none mb-2 text-center">
          <span className="font-bold">Island</span>{' '}Key
          <span className="inline-block w-2 h-2 bg-teal rounded-full ml-0.5 align-super" />
        </h1>

        {/* Tagline */}
        <p className="text-[11px] text-white/40 tracking-[0.22em] uppercase mb-8 text-center">
          Your island. Unlocked.
        </p>

        {/* Gate explanation */}
        <p className="text-[13px] text-white/55 text-center leading-relaxed mb-8 px-2">
          Island Key is available exclusively to guests of our accommodation partners.
        </p>

        {/* Access key input + button */}
        <div className="w-full mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={key}
              onChange={e => { setKey(e.target.value.toUpperCase()); setKeyError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter access key"
              className="flex-1 px-4 py-3 rounded-sm bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm font-mono tracking-wider outline-none focus:border-white/50 transition-colors"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !key.trim()}
              className="px-5 py-3 bg-teal text-white text-sm font-semibold rounded-sm hover:bg-teal/90 active:scale-[0.97] disabled:opacity-50 transition-all"
            >
              {loading ? '…' : 'Enter'}
            </button>
          </div>
          {keyError && (
            <p className="mt-2 text-[12px] text-red-300 text-center">{keyError}</p>
          )}
        </div>

        {/* Request via WhatsApp */}
        <a
          href="https://wa.me/306974176759?text=Hi%2C%20I%27d%20like%20to%20request%20an%20Island%20Key%20access%20code."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 border border-white/20 rounded-sm text-white/60 text-sm hover:text-white hover:border-white/40 transition-colors"
        >
          <span>💬</span>
          Request an Access Key
        </a>

        {/* Admin link */}
        <a
          href="/admin/login"
          className="mt-10 text-[11px] text-white/20 hover:text-white/35 transition-colors"
        >
          Admin Login
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#1B2D4F' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_icon_transparent.png"
            alt="Island Key"
            className="animate-pulse opacity-30"
            style={{ height: 80, width: 'auto' }}
          />
        </div>
      }
    >
      <GatePage />
    </Suspense>
  );
}
