'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasSession } from '@/lib/utils';
import { getClient } from '@/lib/supabase';
import type { Tier, Region } from '@/lib/types';

function EntryRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function route() {
      const p = searchParams.get('p'); // property slug
      const t = searchParams.get('t') as Tier | null;
      const r = searchParams.get('r') as Region | null;

      // ── QR scan path: params present ──────────────────────────────
      if (p && t && r && ['B', 'M', 'P'].includes(t) && ['chania', 'rethymno', 'heraklion', 'lasithi'].includes(r)) {
        const supabase = getClient();
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('slug', p)
          .single();

        localStorage.setItem('ik_qr', JSON.stringify({
          prop: p,
          tier: t,
          region: r,
          property_name: (property as any)?.name ?? null,
        }));

        router.replace('/splash');
        return;
      }

      // ── Returning guest: session exists ────────────────────────────
      if (hasSession()) {
        router.replace('/home');
        return;
      }

      // ── No params, no session: go straight to onboarding ──────────
      router.replace('/onboard');
    }

    route();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="animate-pulse">
        <p className="font-display text-2xl text-navy/30">Loading...</p>
      </div>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse">
          <p className="font-display text-2xl text-navy/30">Loading...</p>
        </div>
      </div>
    }>
      <EntryRouter />
    </Suspense>
  );
}
