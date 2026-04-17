'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/bottom-nav';
import { CategoryChip, ActivityCard } from '@/components/ui/components';
import { ACTIVITY_CATEGORIES, getSession } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { Activity } from '@/lib/types';


const REGIONS = [
  { key: 'all',      label: 'All' },
  { key: 'chania',   label: 'Chania' },
  { key: 'rethymno', label: 'Rethymno' },
  { key: 'heraklion',label: 'Heraklion' },
  { key: 'lasithi',  label: 'Agios Nikolaos' },
];

type Tab = 'activity' | 'service' | 'deals';

export default function ActivitiesPage() {
  const router = useRouter();
  const session = getSession();
  const [activeTab, setActiveTab] = useState<Tab>('activity');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRegion, setActiveRegion] = useState(session?.region ?? 'all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('activities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('title')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setActivities(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = activities
    // Tab filter: activity vs service
    .filter(a => a.item_type === activeTab)
    // Region filter: 'all' shows everything; otherwise match selected region (+ island-wide)
    .filter(a => activeRegion === 'all' || a.region === 'island-wide' || a.region === activeRegion)
    // Tier filter: guest's tier must be in tier_visibility (skip if no session)
    .filter(a => !session || !a.tier_visibility?.length || a.tier_visibility.includes(session.tier))
    // Category filter
    .filter(a => activeCategory === 'all' || a.category === activeCategory);

  const emptyMessage = activeTab === 'service'
    ? 'No services available yet.'
    : 'No activities in this category yet.';

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-medium text-navy">Explore</h1>
        </div>
        <p className="text-xs text-tx-light mt-0.5">Curated by locals, vetted for quality</p>
      </div>

      {/* Primary tabs: Activities · Services · Deals */}
      <div className="flex gap-2 px-5 mb-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all border-[1.5px] flex-shrink-0 ${
            activeTab === 'activity'
              ? 'bg-navy text-white border-navy'
              : 'bg-white text-tx-mid border-border hover:border-navy/30'
          }`}
        >
          Activities
        </button>
        <button
          onClick={() => setActiveTab('service')}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all border-[1.5px] flex-shrink-0 ${
            activeTab === 'service'
              ? 'bg-navy text-white border-navy'
              : 'bg-white text-tx-mid border-border hover:border-navy/30'
          }`}
        >
          Services
        </button>
        <button
          onClick={() => router.push('/deals')}
          className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all border-[1.5px] flex-shrink-0 bg-white text-tx-mid border-border hover:border-navy/30"
        >
          Deals
        </button>
      </div>

      {activeTab === 'activity' && (
        <>
          {/* Region selector */}
          <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-2 flex-shrink-0">
            {REGIONS.map(r => (
              <CategoryChip
                key={r.key}
                label={r.label}
                active={activeRegion === r.key}
                onClick={() => setActiveRegion(r.key)}
              />
            ))}
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-3 flex-shrink-0">
            {ACTIVITY_CATEGORIES.map(cat => (
              <CategoryChip
                key={cat.key}
                label={cat.key === 'all' ? 'All' : cat.label}
                icon={cat.icon || undefined}
                active={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
              />
            ))}
          </div>
        </>
      )}

      {activeTab === 'service' && (
        <div className="px-5 mb-3 flex-shrink-0">
          <p className="text-xs text-tx-light">The provider comes to you — at your villa or accommodation.</p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2.5 bg-white rounded border border-border-light">
                <div className="w-[78px] h-[78px] rounded-sm bg-navy/5 animate-pulse flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="h-3.5 bg-navy/5 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-navy/5 rounded animate-pulse" />
                  <div className="h-3 bg-navy/5 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-2.5">
            {filtered.map(activity => (
              <ActivityCard
                key={activity.id}
                title={activity.title}
                description={activity.description}
                category={activity.category}
                priceFrom={activity.price_from ?? 0}
                duration={activity.duration ?? ''}
                imageUrl={activity.images?.[0] ?? null}
                onClick={() => router.push(`/activities/${activity.slug}`)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-tx-light text-sm mt-12">{emptyMessage}</p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
