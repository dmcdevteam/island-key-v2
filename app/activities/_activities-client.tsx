'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/ui/bottom-nav';
import { CategoryChip, ActivityCard } from '@/components/ui/components';
import { CATEGORY_LABELS, MOOD_LABELS, getSession } from '@/lib/utils';
import { getActivitySuitability, type WeatherData } from '@/lib/weather-suitability';
import type { Activity } from '@/lib/types';

const REGIONS = [
  { key: 'all',       label: 'All' },
  { key: 'chania',    label: 'Chania' },
  { key: 'rethymno',  label: 'Rethymno' },
  { key: 'heraklion', label: 'Heraklion' },
  { key: 'lasithi',   label: 'Agios Nikolaos' },
];

export default function ActivitiesClient({ initialActivities }: { initialActivities: Activity[] }) {
  const router = useRouter();
  const sp     = useSearchParams();
  const session = getSession();
  const urlCategory = sp.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory ?? null);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [activeRegion] = useState(session?.region ?? 'all');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch('/api/weather/forecast')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setWeather(data) })
      .catch(() => { /* fail silently — no dots shown */ })
  }, []);

  function toggleMood(mood: string) {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  }

  // All filtering is done client-side — no network requests on filter changes
  const filtered = initialActivities
    .filter(a => a.item_type === 'activity')
    .filter(a => activeRegion === 'all' || a.region === 'island-wide' || a.region === activeRegion)
    .filter(a => !session || !a.tier_visibility?.length || a.tier_visibility.includes(session.tier))
    .filter(a => {
      if (!selectedCategory) return true;
      return a.category === selectedCategory ||
        (Array.isArray(a.secondary_categories) && a.secondary_categories.includes(selectedCategory));
    })
    .filter(a => {
      if (!selectedMoods.length) return true;
      return selectedMoods.some(m => a.mood_tags?.includes(m));
    })
    .sort((a, b) => (a.sort_order - b.sort_order) || a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-white flex flex-col pb-[90px]">
      {/* Editorial header */}
      <div className="px-5 pt-[52px] pb-4">
        <p className="text-[11px] font-semibold text-tx-light uppercase tracking-[0.14em] mb-1">Island Key</p>
        <h1 className="font-display text-[36px] font-light text-ink leading-none">
          Experiences
        </h1>
        <p className="text-[13px] text-tx-mid mt-2">Curated by locals · vetted for quality</p>
      </div>

      {/* Category chips (single-select) */}
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-2 flex-shrink-0">
        <CategoryChip
          label="All"
          active={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
        />
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <CategoryChip
            key={key}
            label={label}
            active={selectedCategory === key}
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
          />
        ))}
      </div>

      {/* Mood chips (multi-select) */}
      <div className="px-5 mb-4 flex-shrink-0">
        <p className="text-[10px] font-semibold text-tx-light uppercase tracking-wider mb-2">Vibe</p>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {Object.entries(MOOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleMood(key)}
              className={`px-3 py-[5px] rounded-full text-[11px] font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                selectedMoods.includes(key)
                  ? 'bg-lime text-ink border-transparent'
                  : 'bg-transparent text-tx-light border-border hover:border-ink/30 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Boat trips banner */}
      {selectedCategory === 'boat_trips' && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-lime/20 border border-lime/40">
          <p className="text-sm font-semibold text-ink">Boat trip experiences</p>
          <p className="text-xs text-tx-mid mt-0.5">Organised tours and daily cruises in Crete</p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex flex-col gap-3">
          {filtered.map((activity, i) => {
            const suitability = weather && activity.weather_driven !== false
              ? getActivitySuitability(activity.category, weather, activity.is_boat_activity)
              : null
            return (
              <ActivityCard
                key={activity.id}
                title={activity.title}
                description={activity.description}
                category={activity.category}
                priceFrom={activity.price_from ?? 0}
                duration={activity.duration ?? ''}
                imageUrl={activity.images?.[0] ?? null}
                focalPoint={activity.focal_x != null && activity.focal_y != null ? { x: activity.focal_x, y: activity.focal_y } : null}
                externalRating={activity.external_rating}
                externalRatingCount={activity.external_rating_count}
                externalRatingSource={activity.external_rating_source}
                heartItem={{ id: activity.id, type: 'activity', slug: activity.slug, title: activity.title, image: activity.images?.[0] ?? null, price: activity.price_from ? `€${activity.price_from}pp` : null }}
                priority={i < 2}
                suitability={suitability}
                onClick={() => router.push(`/activities/${activity.slug}`)}
              />
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-tx-light text-sm mt-12">No activities in this category yet.</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
