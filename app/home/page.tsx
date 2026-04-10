'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, TIER_LABELS, timeRemaining, formatPrice } from '@/lib/utils';
import { BottomNav } from '@/components/ui/bottom-nav';
import { TierBadge, SectionHeader, ActivityMiniCard, ArticleCard } from '@/components/ui/components';
import { createClient } from '@/lib/supabase';
import type { GuestSession, Deal, Activity, Article, CalendarEvent } from '@/lib/types';

// ─── Style maps (derived from category, since DB doesn't store them) ───
const ACTIVITY_ICONS: Record<string, string> = {
  sea: '🌊', land: '⛰️', table: '🍷', culture: '🏛️', adventure: '🧗', wellness: '🧘',
};
const ACTIVITY_GRADIENTS: Record<string, string> = {
  sea:       'linear-gradient(135deg,rgba(26,138,125,0.08),rgba(27,45,79,0.08))',
  land:      'linear-gradient(135deg,rgba(27,45,79,0.08),rgba(26,138,125,0.08))',
  table:     'linear-gradient(135deg,rgba(26,138,125,0.08),rgba(212,133,74,0.08))',
  culture:   'linear-gradient(135deg,rgba(122,107,93,0.08),rgba(196,112,63,0.08))',
  adventure: 'linear-gradient(135deg,rgba(139,111,71,0.08),rgba(107,123,94,0.08))',
  wellness:  'linear-gradient(135deg,rgba(26,138,125,0.08),rgba(232,245,243,0.08))',
};
const ARTICLE_STYLES: Record<string, { bg: string; tagColor: string }> = {
  guide:   { bg: 'linear-gradient(135deg,rgba(26,138,125,0.12),rgba(107,123,94,0.08))',  tagColor: '#1A8A7D' },
  food:    { bg: 'linear-gradient(135deg,rgba(212,133,74,0.08),rgba(196,112,63,0.08))',  tagColor: '#D4854A' },
  culture: { bg: 'linear-gradient(135deg,rgba(27,45,79,0.08),rgba(26,138,125,0.08))',    tagColor: '#1B2D4F' },
  nature:  { bg: 'linear-gradient(135deg,rgba(107,123,94,0.08),rgba(26,138,125,0.08))',  tagColor: '#5B7A3D' },
  events:  { bg: 'linear-gradient(135deg,rgba(212,133,74,0.07),rgba(26,138,125,0.07))',  tagColor: '#D94F4F' },
  tips:    { bg: 'linear-gradient(135deg,rgba(212,168,67,0.08),rgba(107,123,94,0.08))',  tagColor: '#D4A843' },
};
const EVENT_ICONS: Record<string, string> = {
  market: '🛍️', food: '🍽️', music: '🎵', art: '🎨', cinema: '🎬',
  wine: '🍷', wellness: '🧘', festival: '🎉', sport: '⚽', other: '📅',
};

function formatEventWhen(dateStr: string, timeStart: string | null): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const label = dateStr === today ? 'Today' : dateStr === tomorrow ? 'Tomorrow'
    : new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  return timeStart ? `${label} · ${timeStart.slice(0, 5)}` : label;
}

interface HomeData {
  deals: Deal[];
  activities: Activity[];
  articles: Article[];
  events: CalendarEvent[];
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [data, setData] = useState<HomeData>({ deals: [], activities: [], articles: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0); // for live countdown re-render

  // Redirect if no session
  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/splash'); return; }
    setSession(s);
  }, [router]);

  // Live countdown tick every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all four in parallel once session is available
  useEffect(() => {
    const s = getSession();
    if (!s) return;
    const supabase = createClient();

    Promise.all([
      // 1. Featured deals — filter by tier + region in JS (view already filters active/unexpired)
      supabase.from('active_deals').select('*').limit(10),
      // 2. Featured activities
      supabase.from('activities').select('*').eq('is_featured', true).eq('is_active', true).limit(10),
      // 3. Latest articles
      supabase.from('published_articles').select('*').limit(3),
      // 4. Upcoming events
      supabase.from('upcoming_events').select('*').limit(3),
    ]).then(([dealsRes, activitiesRes, articlesRes, eventsRes]) => {
      const err = dealsRes.error || activitiesRes.error || articlesRes.error || eventsRes.error;
      if (err) { setError(err.message); setLoading(false); return; }

      // Apply tier + region filters
      const tier = s.tier;
      const region = s.region;

      const deals = (dealsRes.data ?? [])
        .filter(d => !d.tier_visibility?.length || d.tier_visibility.includes(tier))
        .filter(d => d.region === region)
        .slice(0, 3);

      const activities = (activitiesRes.data ?? [])
        .filter(a => !a.tier_visibility?.length || a.tier_visibility.includes(tier))
        .filter(a => a.region === 'island-wide' || a.region === region)
        .slice(0, 5);

      setData({
        deals,
        activities,
        articles: articlesRes.data ?? [],
        events: eventsRes.data ?? [],
      });
      setLoading(false);
    });
  }, []);

  if (!session) return null;

  // Use UTC date strings throughout to avoid timezone-shift bugs with date-only values
  const todayStr = new Date().toISOString().slice(0, 10);
  const checkIn  = session.check_in  ?? '';
  const checkOut = session.check_out ?? '';

  const tripStatus = (() => {
    if (!checkIn) return { type: 'unknown' as const };
    if (todayStr < checkIn) {
      const daysUntil = Math.round((new Date(checkIn).getTime() - new Date(todayStr).getTime()) / 86400000);
      return { type: 'before' as const, daysUntil };
    }
    if (checkOut && todayStr > checkOut) {
      return { type: 'after' as const };
    }
    const dayNum = Math.round((new Date(todayStr).getTime() - new Date(checkIn).getTime()) / 86400000) + 1;
    const length = checkOut
      ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 7;
    return { type: 'during' as const, dayNum, length };
  })();

  const featuredDeal = data.deals[0] ?? null;

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[52px] pb-3">
        <h1 className="font-display text-xl font-normal text-navy">
          Hello, <span className="font-semibold">{session.first_name}</span> 👋
        </h1>
        <TierBadge tier={session.tier} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Weather / trip bar */}
        <div className="mx-5 mb-3 p-2.5 px-3.5 bg-white rounded-sm flex items-center justify-between border border-border-light">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">☀️</span>
            <div>
              <p className="text-base font-bold text-navy">26°C</p>
              <p className="text-[11px] text-tx-light">Sunny, light breeze</p>
            </div>
          </div>
          <div className="text-right">
            {tripStatus.type === 'before' && (
              <>
                <p className="text-xs font-semibold text-tx-mid">Trip starts in {tripStatus.daysUntil} {tripStatus.daysUntil === 1 ? 'day' : 'days'}</p>
                <p className="text-[11px] text-tx-light">
                  {new Date(checkIn + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </>
            )}
            {tripStatus.type === 'during' && (
              <>
                <p className="text-xs font-semibold text-tx-mid">Day {tripStatus.dayNum} of {tripStatus.length}</p>
                <p className="text-[11px] text-tx-light">
                  {new Date(checkIn + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </>
            )}
            {tripStatus.type === 'after' && (
              <p className="text-xs font-semibold text-tx-mid">We hope you enjoyed your stay!</p>
            )}
            {tripStatus.type === 'unknown' && (
              <p className="text-xs font-semibold text-tx-mid">Welcome to Crete</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-5 gap-[7px] mx-5 mb-5">
          {[
            { icon: '🧭', label: 'Activities', href: '/activities' },
            { icon: '⚡', label: 'Deals', href: '/deals' },
            { icon: '🚙', label: 'Rentals', href: '/rentals' },
            { icon: '🚐', label: 'Transfers', href: '/transfers' },
            { icon: 'ℹ️', label: 'Info', href: '/info' },
          ].map(action => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center gap-1.5 py-3 px-1 bg-white rounded border border-border-light transition-all active:scale-[0.94] active:bg-sand"
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-[9px] font-bold text-tx-mid text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load content: {error}
          </div>
        )}

        {/* Today's Deal spotlight */}
        <SectionHeader title="Today's Deal" linkText="View all →" onLink={() => router.push('/deals')} />
        {loading ? (
          <div className="mx-5 mb-5 h-[90px] rounded bg-navy/5 animate-pulse" />
        ) : featuredDeal ? (
          <div
            onClick={() => router.push('/deals')}
            className="mx-5 mb-5 p-3.5 rounded cursor-pointer relative overflow-hidden border border-[#F0D9C4] transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #FDF3EB, #FFF8F2)' }}
          >
            <span className="absolute top-2.5 right-2.5 bg-deal text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {timeRemaining(featuredDeal.expires_at)}
            </span>
            <h3 className="font-semibold text-sm text-navy mb-0.5 pr-20">{featuredDeal.title}</h3>
            <p className="text-[11px] text-tx-light mb-1.5">
              {featuredDeal.provider_name ?? ''}
              {featuredDeal.available_seats ? ` · ${featuredDeal.available_seats} seats left` : ''}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-tx-light line-through">{formatPrice(featuredDeal.original_price)}</span>
              <span className="text-base font-bold text-terra">{formatPrice(featuredDeal.deal_price)}</span>
            </div>
          </div>
        ) : (
          <p className="mx-5 mb-5 text-xs text-tx-light">No active deals right now — check back soon.</p>
        )}

        {/* Recommended activities */}
        <SectionHeader title="Recommended for you" linkText="See all →" onLink={() => router.push('/activities')} />
        {loading ? (
          <div className="flex gap-2.5 px-5 mb-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[190px] h-[155px] rounded bg-navy/5 animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : data.activities.length > 0 ? (
          <div className="flex gap-2.5 px-5 overflow-x-auto snap-x snap-mandatory no-scrollbar mb-5">
            {data.activities.map(a => (
              <ActivityMiniCard
                key={a.id}
                title={a.title}
                subtitle={[a.duration, a.meeting_point].filter(Boolean).join(' · ')}
                priceFrom={a.price_from ?? 0}
                icon={ACTIVITY_ICONS[a.category] ?? '🌟'}
                bgGradient={ACTIVITY_GRADIENTS[a.category] ?? ACTIVITY_GRADIENTS.culture}
                onClick={() => router.push(`/activities/${a.slug}`)}
              />
            ))}
          </div>
        ) : (
          <p className="px-5 mb-5 text-xs text-tx-light">No featured activities yet.</p>
        )}

        {/* Local Insights */}
        <SectionHeader title="Local Insights" linkText="Read more →" onLink={() => router.push('/insights')} />
        {loading ? (
          <div className="flex gap-2.5 px-5 mb-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[240px] h-[175px] rounded bg-navy/5 animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : data.articles.length > 0 ? (
          <div className="flex gap-2.5 px-5 overflow-x-auto snap-x no-scrollbar mb-5">
            {data.articles.map(a => {
              const style = ARTICLE_STYLES[a.category] ?? { bg: ARTICLE_STYLES.guide.bg, tagColor: '#5A5A5A' };
              return (
                <ArticleCard
                  key={a.id}
                  title={a.title}
                  excerpt={a.excerpt ?? ''}
                  category={a.category.charAt(0).toUpperCase() + a.category.slice(1)}
                  readTime={a.read_time_min}
                  bgGradient={style.bg}
                  tagColor={style.tagColor}
                  onClick={() => router.push('/insights')}
                />
              );
            })}
          </div>
        ) : (
          <p className="px-5 mb-5 text-xs text-tx-light">No articles published yet.</p>
        )}

        {/* What's happening */}
        <SectionHeader title="What's happening" linkText="See calendar →" onLink={() => router.push('/events')} />
        {loading ? (
          <div className="mx-5 mb-5 space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-[52px] rounded-sm bg-navy/5 animate-pulse" />
            ))}
          </div>
        ) : data.events.length > 0 ? (
          <div className="mb-5">
            {data.events.map(ev => (
              <div
                key={ev.id}
                onClick={() => router.push('/events')}
                className="mx-5 mb-2.5 flex gap-2.5 p-2.5 px-3 bg-white rounded-sm border border-border-light items-center cursor-pointer active:bg-sand"
              >
                <span className="text-lg">{EVENT_ICONS[ev.category] ?? '📅'}</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-navy">{ev.title}</p>
                  <p className="text-[10px] text-tx-light">
                    {formatEventWhen(ev.date, ev.time_start)}
                    {ev.location ? ` · ${ev.location}` : ''}
                    {ev.is_free ? ' · Free entry' : ''}
                  </p>
                </div>
                <span className="text-[11px] text-teal">→</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 mb-5 text-xs text-tx-light">No upcoming events in the next 30 days.</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
