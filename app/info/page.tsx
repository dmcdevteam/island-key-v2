'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/bottom-nav';
import { InfoCard } from '@/components/ui/components';
import { createClient } from '@/lib/supabase';
import type { InfoPage } from '@/lib/types';

export default function InfoPage() {
  const router = useRouter();
  const [items, setItems] = useState<InfoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('info_pages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-medium text-navy">Useful Info</h1>
        </div>
        <p className="text-xs text-tx-light mt-0.5">Everything you need, offline-ready</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="grid grid-cols-2 gap-2.5 px-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-navy/5 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="mx-5 mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load info pages: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-2.5 px-5">
            {items.map(item => (
              <InfoCard
                key={item.slug}
                icon={item.icon ?? '📄'}
                title={item.title}
                onClick={() => router.push(`/info/${item.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
