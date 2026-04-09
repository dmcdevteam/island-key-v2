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
        let propertyName: string | null = null;

        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase lookup timed out after 5s')), 5000)
          );
          const supabase = getClient();
          const query = supabase
            .from('properties')
            .select('name')
            .eq('slug', p)
            .single();

          const { data: property, error } = await Promise.race([query, timeout]);

          if (error) {
            console.error('[EntryRouter] Supabase property lookup error:', error.message, '| slug:', p);
          } else {
            propertyName = (property as any)?.name ?? null;
          }
        } catch (err: any) {
          console.error('[EntryRouter] Property lookup failed:', err?.message ?? err, '| slug:', p);
          // Fall through — redirect to /onboard without a property name pre-fill
          router.replace('/onboard');
          return;
        }

        localStorage.setItem('ik_qr', JSON.stringify({
          prop: p,
          tier: t,
          region: r,
          property_name: propertyName,
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
