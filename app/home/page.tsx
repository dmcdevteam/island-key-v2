'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, TIER_LABELS, formatPrice } from '@/lib/utils';
import { BottomNav } from '@/components/ui/bottom-nav';
import { SectionHeader, ActivityMiniCard, ArticleCard } from '@/components/ui/components';
import { ProfileAvatar } from '@/app/_components/profile-avatar';
import { createClient } from '@/lib/supabase';
import { FloatingBookingsPill, type UpcomingBooking } from '@/components/FloatingBookingsPill';
import type { GuestSession, Activity, DealFull, ArticleFull, EventFull } from '@/lib/types';

// ─── Weather ──────────────────────────────────────────────────────────────────
const WEATHER_CACHE_KEY = 'ik_weather_v2'
const WEATHER_TTL_MS    = 30 * 60 * 1000 // 30 minutes

interface WeatherData {
  temp:     number
  code:     number
  wind:     number
  windDir:  number
  uv:       number
  cachedAt: number
}

function wmoIcon(code: number): string {
  if (code === 0)                    return '☀️'
  if (code <= 2)                     return '🌤️'
  if (code === 3)                    return '☁️'
  if (code <= 48)                    return '🌫️'
  if (code <= 67)                    return '🌧️'
  if (code <= 77)                    return '❄️'
  if (code <= 82)                    return '🌦️'
  if (code <= 86)                    return '❄️'
  return '⛈️'
}

function wmoDesc(code: number): string {
  if (code === 0)                    return 'Clear sky'
  if (code === 1)                    return 'Mainly clear'
  if (code === 2)                    return 'Partly cloudy'
  if (code === 3)                    return 'Overcast'
  if (code <= 48)                    return 'Foggy'
  if (code <= 55)                    return 'Drizzle'
  if (code <= 65)                    return 'Rainy'
  if (code <= 67)                    return 'Freezing rain'
  if (code <= 77)                    return 'Snowing'
  if (code <= 82)                    return 'Showers'
  if (code <= 86)                    return 'Snow showers'
  return 'Thunderstorm'
}

function windCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function uvBadge(uv: number): { bg: string; text: string; label: string } {
  if (uv <= 2)  return { bg: '#4CAF50', text: 'white',  label: `UV ${uv}` }
  if (uv <= 5)  return { bg: '#FFC107', text: '#555',   label: `UV ${uv}` }
  if (uv <= 7)  return { bg: '#FF9800', text: 'white',  label: `UV ${uv}` }
  if (uv <= 10) return { bg: '#F44336', text: 'white',  label: `UV ${uv}` }
  return          { bg: '#9C27B0', text: 'white',  label: `UV ${uv}` }
}

function WindArrow({ degrees }: { degrees: number }) {
  return (
    <svg
      width="9" height="9"
      viewBox="0 0 10 10"
      style={{ transform: `rotate(${degrees}deg)`, display: 'inline-block', flexShrink: 0 }}
    >
      <path d="M5 1 L8 8.5 L5 6.8 L2 8.5 Z" fill="currentColor" />
    </svg>
  )
}

function loadCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const parsed: WeatherData = JSON.parse(raw)
    return parsed
  } catch { return null }
}

function saveCachedWeather(data: WeatherData) {
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

async function fetchWeather(): Promise<WeatherData> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=35.5138&longitude=24.0180' +
    '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index' +
    '&wind_speed_unit=kmh&timezone=Europe%2FAthens'
  const res  = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Weather API ${res.status}`)
  const json = await res.json()
  const c    = json.current
  return {
    temp:     Math.round(c.temperature_2m),
    code:     c.weather_code,
    wind:     Math.round(c.wind_speed_10m),
    windDir:  Math.round(c.wind_direction_10m ?? 0),
    uv:       Math.round(c.uv_index ?? 0),
    cachedAt: Date.now(),
  }
}

// ─── Style maps ───────────────────────────────────────────────────────────────
const ARTICLE_STYLES: Record<string, { bg: string; tagColor: string }> = {
  // New categories
  local_guide: { bg: 'linear-gradient(135deg,rgba(26,138,125,0.12),rgba(107,123,94,0.08))',  tagColor: '#1A8A7D' },
  food_drink:  { bg: 'linear-gradient(135deg,rgba(212,133,74,0.08),rgba(196,112,63,0.08))',  tagColor: '#D4854A' },
  culture:     { bg: 'linear-gradient(135deg,rgba(27,45,79,0.08),rgba(26,138,125,0.08))',    tagColor: '#1B2D4F' },
  adventure:   { bg: 'linear-gradient(135deg,rgba(107,123,94,0.08),rgba(26,138,125,0.08))',  tagColor: '#5B7A3D' },
  beaches:     { bg: 'linear-gradient(135deg,rgba(26,138,125,0.07),rgba(52,152,219,0.07))',  tagColor: '#1A8A7D' },
  tips:        { bg: 'linear-gradient(135deg,rgba(212,168,67,0.08),rgba(107,123,94,0.08))',  tagColor: '#D4A843' },
  seasonal:    { bg: 'linear-gradient(135deg,rgba(212,133,74,0.07),rgba(26,138,125,0.07))',  tagColor: '#D4854A' },
  other:       { bg: 'linear-gradient(135deg,rgba(27,45,79,0.05),rgba(107,123,94,0.05))',   tagColor: '#5A5A5A' },
  // Legacy aliases
  guide:       { bg: 'linear-gradient(135deg,rgba(26,138,125,0.12),rgba(107,123,94,0.08))',  tagColor: '#1A8A7D' },
  food:        { bg: 'linear-gradient(135deg,rgba(212,133,74,0.08),rgba(196,112,63,0.08))',  tagColor: '#D4854A' },
  nature:      { bg: 'linear-gradient(135deg,rgba(107,123,94,0.08),rgba(26,138,125,0.08))',  tagColor: '#5B7A3D' },
  events:      { bg: 'linear-gradient(135deg,rgba(212,133,74,0.07),rgba(26,138,125,0.07))',  tagColor: '#D94F4F' },
};
const EVENT_ICONS: Record<string, string> = {
  market: '🛍️', food: '🍽️', music: '🎵', art: '🎨', cinema: '🎬',
  wine: '🍷', wellness: '🧘', festival: '🎉', sport: '⚽',
  cultural: '🏛️', nightlife: '🌙', family: '👨‍👩‍👧', other: '📅',
};

function formatEventWhen(startDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dateStr = startDate.slice(0, 10);
  const label = dateStr === today ? 'Today' : dateStr === tomorrow ? 'Tomorrow'
    : new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  const d = new Date(startDate);
  const timeStr = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${label} · ${timeStr}`;
}

interface HomeData {
  deals:         DealFull[];
  activities:    Activity[];   // featured
  allActivities: Activity[];   // all active (for Explore section)
  articles:      ArticleFull[];
  events:        EventFull[];
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [data, setData] = useState<HomeData>({ deals: [], activities: [], allActivities: [], articles: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [eventsStatus, setEventsStatus] = useState<'loading' | 'empty' | 'data'>('loading');
  const [dealsStatus, setDealsStatus] = useState<'loading' | 'empty' | 'data'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<UpcomingBooking[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/splash'); return; }
    setSession(s);

    // Fetch confirmed future bookings for floating pill
    if (s.guest_id) {
      const guestId = s.guest_id;
      const today   = new Date().toISOString().slice(0, 10);

      const fetchConfirmed = () => {
        fetch(`/api/bookings?guest_id=${encodeURIComponent(guestId)}`)
          .then(r => r.json())
          .then((rows: UpcomingBooking[]) => {
            if (!Array.isArray(rows)) return;
            const future = rows.filter(b => {
              if (b.status !== 'confirmed') return false;
              if (b.item_type === 'transfer') return !!b.pickup_at && b.pickup_at >= new Date().toISOString();
              return b.booking_date >= today;
            });
            setConfirmedBookings(future);
          })
          .catch(() => {});
      };

      fetchConfirmed();

      // Re-query whenever the user returns to this tab/app
      const handleVisibility = () => { if (document.visibilityState === 'visible') fetchConfirmed(); };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function refresh() {
      const cached = loadCachedWeather();
      const stale  = !cached || (Date.now() - cached.cachedAt) > WEATHER_TTL_MS;
      if (cached) setWeather(cached);
      if (stale) {
        try {
          const fresh = await fetchWeather();
          saveCachedWeather(fresh);
          setWeather(fresh);
        } catch { /* keep cached */ }
      }
    }
    refresh();
    const interval = setInterval(refresh, WEATHER_TTL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    const supabase = createClient();

    const dealParams = new URLSearchParams({
      tier: s.tier, region: s.region, featured: 'true', limit: '3',
      ...(s.property_id ? { property_id: s.property_id } : {}),
    });

    Promise.all([
      fetch(`/api/deals?${dealParams}`).then(r => r.json()).catch(() => []),
      supabase.from('activities').select('*').eq('is_featured', true).eq('is_active', true).limit(10),
      supabase.from('activities').select('*').eq('is_active', true).limit(30),
      fetch('/api/articles?limit=3').then(r => r.json()).catch(() => []),
      fetch('/api/events/today').then(r => r.json()).catch(() => []),
    ]).then(([deals, featuredRes, allRes, articles, events]) => {
      const err = featuredRes.error || allRes.error;
      if (err) { setError(err.message); setLoading(false); return; }

      const tier   = s.tier;
      const region = s.region;

      const activities = (featuredRes.data ?? [])
        .filter((a: Activity) => !a.tier_visibility?.length || a.tier_visibility.includes(tier))
        .filter((a: Activity) => a.region === 'island-wide' || a.region === region)
        .slice(0, 5);

      const allActivities = (allRes.data ?? [])
        .filter((a: Activity) => !a.tier_visibility?.length || a.tier_visibility.includes(tier))
        .filter((a: Activity) => a.region === 'island-wide' || a.region === region)
        .slice(0, 12);

      const dealsList = Array.isArray(deals) ? deals : []
      const eventsList = Array.isArray(events) ? events : []
      setData({
        deals: dealsList,
        activities,
        allActivities,
        articles: Array.isArray(articles) ? articles : [],
        events: eventsList,
      });
      setEventsStatus(eventsList.length > 0 ? 'data' : 'empty')
      setDealsStatus(dealsList.length > 0 ? 'data' : 'empty')
      setLoading(false);
    });
  }, []);

  if (!session) return null;

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

  const featuredDeal: DealFull | null = data.deals[0] ?? null;

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[52px] pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 24, width: 'auto' }} />
          <h1 className="font-display text-xl font-normal text-navy">
            Hello, <span className="font-semibold">{session.first_name}</span> 👋
          </h1>
        </div>
        <ProfileAvatar />
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Weather / trip bar */}
        <div className="mx-5 mb-5 p-2.5 px-3.5 bg-white rounded-sm border border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{weather ? wmoIcon(weather.code) : '🌡️'}</span>
              <div>
                {weather ? (
                  <>
                    <p className="text-base font-bold text-navy">{weather.temp}°C</p>
                    <p className="text-[11px] text-tx-light">{wmoDesc(weather.code)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-navy">—°C</p>
                    <p className="text-[11px] text-tx-light">Weather unavailable</p>
                  </>
                )}
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

          {/* Wind + UV row */}
          {weather && (
            <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-border-light">
              <span className="flex items-center gap-1 text-[11px] text-tx-light">
                <WindArrow degrees={weather.windDir} />
                {windCompass(weather.windDir)} {weather.wind} km/h
              </span>
              {(() => {
                const b = uvBadge(weather.uv)
                return (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: b.bg, color: b.text }}
                  >
                    {b.label}
                  </span>
                )
              })()}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load content: {error}
          </div>
        )}

        {/* What's happening today — hidden only when fetch completes with no results */}
        {eventsStatus !== 'empty' && (
          <>
            <SectionHeader title="What&apos;s happening today" linkText="See all →" onLink={() => router.push('/events')} />
            {eventsStatus === 'loading' ? (
              <div className="mx-5 mb-5 space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-[52px] rounded-sm bg-navy/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="mb-5">
                {data.events.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => router.push(`/events/${ev.slug}`)}
                    className="mx-5 mb-2.5 flex gap-2.5 p-2.5 px-3 bg-white rounded-sm border border-border-light items-center cursor-pointer active:bg-sand"
                  >
                    <span className="text-lg">{EVENT_ICONS[ev.category ?? 'other'] ?? '📅'}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-navy">{ev.title}</p>
                      <p className="text-[10px] text-tx-light">
                        {formatEventWhen(ev.start_date)}
                        {ev.location_name ? ` · ${ev.location_name}` : ''}
                        {ev.is_free ? ' · Free entry' : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-teal">→</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Events hero card — always visible */}
        <button
          onClick={() => router.push('/events')}
          className="mx-4 mb-5 block w-[calc(100%-32px)] text-left active:opacity-90 transition-opacity"
          style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 160 }}
        >
          <img
            src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800"
            alt="Events in Chania"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Dark gradient overlay */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 20%, rgba(27,45,79,0.75) 100%)',
            }}
          />
          {/* Text — bottom-left */}
          <div style={{ position: 'absolute', bottom: 14, left: 16, right: 48 }}>
            <p style={{ fontSize: 10, color: 'white', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
              Events &amp; Culture
            </p>
            <p className="font-display" style={{ fontSize: 18, color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
              See what&apos;s on in Chania
            </p>
          </div>
          {/* Arrow — bottom-right */}
          <div style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 20, color: 'white' }}>
            →
          </div>
        </button>

        {/* Deals section — hidden only when fetch completes with no results */}
        {dealsStatus !== 'empty' && (
          <>
            <SectionHeader title="Today&apos;s Deal" linkText="View all →" onLink={() => router.push('/deals')} />
            {dealsStatus === 'loading' ? (
              <div className="mx-5 mb-5 h-[90px] rounded bg-navy/5 animate-pulse" />
            ) : featuredDeal ? (
              <div
                onClick={() => router.push('/deals')}
                className="mx-5 mb-5 p-3.5 rounded cursor-pointer relative overflow-hidden border border-[#F0D9C4] transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #FDF3EB, #FFF8F2)' }}
              >
                {featuredDeal.discount_label && (
                  <span className="absolute top-2.5 right-2.5 bg-teal text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {featuredDeal.discount_label}
                  </span>
                )}
                <h3 className="font-semibold text-sm text-navy mb-0.5 pr-20">{featuredDeal.title}</h3>
                {featuredDeal.short_description && (
                  <p className="text-[11px] text-tx-light mb-1.5">{featuredDeal.short_description}</p>
                )}
                {(featuredDeal.original_price || featuredDeal.deal_price) && (
                  <div className="flex items-baseline gap-2">
                    {featuredDeal.original_price && <span className="text-xs text-tx-light line-through">{formatPrice(featuredDeal.original_price)}</span>}
                    {featuredDeal.deal_price && <span className="text-base font-bold text-terra">{formatPrice(featuredDeal.deal_price)}</span>}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        {/* Recommended for you */}
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
                category={a.category}
                imageUrl={a.images?.[0] ?? null}
                heartItem={{ id: a.id, type: 'activity', slug: a.slug, title: a.title, image: a.images?.[0] ?? null, price: a.price_from ? `€${a.price_from}pp` : null }}
                onClick={() => router.push(`/activities/${a.slug}`)}
              />
            ))}
          </div>
        ) : (
          <p className="px-5 mb-5 text-xs text-tx-light">No featured activities yet.</p>
        )}

        {/* Explore all experiences CTA */}
        <div className="mx-4 mb-6" style={{ marginTop: 24 }}>
          <button
            onClick={() => router.push('/activities')}
            className="w-full flex items-center gap-3 active:opacity-80 transition-opacity"
            style={{
              height: 56,
              borderRadius: 14,
              background: 'transparent',
              border: '2px solid #1A8A7D',
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            <span style={{ fontSize: 20 }}>🗺</span>
            <span className="flex-1 text-left font-semibold" style={{ fontSize: 16, color: '#1A8A7D' }}>
              Explore all experiences
            </span>
            <span style={{ fontSize: 16, color: '#1A8A7D', fontWeight: 700 }}>›</span>
          </button>
        </div>

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
              const style = ARTICLE_STYLES[a.category ?? ''] ?? { bg: ARTICLE_STYLES.guide.bg, tagColor: '#5A5A5A' };
              return (
                <ArticleCard
                  key={a.id}
                  title={a.title}
                  excerpt={a.excerpt ?? ''}
                  category={(a.category ?? 'other').replace('_', ' ')}
                  readTime={a.read_time_minutes ?? 0}
                  bgGradient={style.bg}
                  tagColor={style.tagColor}
                  onClick={() => router.push(`/insights/${a.slug}`)}
                />
              );
            })}
          </div>
        ) : (
          <p className="px-5 mb-5 text-xs text-tx-light">No articles published yet.</p>
        )}

      </div>

      {/* Floating bookings pill */}
      <FloatingBookingsPill bookings={confirmedBookings} />

      <BottomNav />
    </div>
  );
}
