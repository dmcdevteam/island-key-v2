'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/bottom-nav';
import { DealCard } from '@/components/ui/components';
import { createClient } from '@/lib/supabase';
import type { Deal } from '@/lib/types';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('active_deals')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setDeals(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-medium text-navy">Last-Minute Deals</h1>
        </div>
        <p className="text-xs text-tx-light mt-0.5">Exclusive prices, limited availability</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded bg-navy/5 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load deals: {error}
          </div>
        )}

        {!loading && !error && deals.length === 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-navy/5 text-tx-light text-sm text-center">
            No active deals right now — check back soon.
          </div>
        )}

        {!loading && !error && deals.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {deals.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() => router.push('/activities/deal-detail')}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
