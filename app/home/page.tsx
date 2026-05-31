'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/utils';
import { BottomNav } from '@/components/ui/bottom-nav';
import { SectionHeader, ActivityMiniCard, ArticleCard } from '@/components/ui/components';
import { GlobalSearch } from '@/components/ui/global-search';
import { createClient } from '@/lib/supabase';
import type { GuestSession, Activity, DealFull, ArticleFull, EventFull } from '@/lib/types';
import { SmartFeed } from './_components/smart-feed';

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

function DealCountdown({ validUntil }: { validUntil: string | null }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    function calc() {
      if (!validUntil) { setTimeLeft(''); return }
      const diff = new Date(validUntil).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h >= 48) {
        setTimeLeft(`${Math.floor(h / 24)}d ${h % 24}h`)
      } else {
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      }
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [validUntil])
  return <>{timeLeft}</>
}

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/splash'); return; }
    setSession(s);
    // Show welcome sheet once after onboarding
    if (!localStorage.getItem('ik_welcomed')) {
      localStorage.setItem('ik_welcomed', 'true');
      setShowWelcome(true);
    }
    if (s.guest_id) {
      const params = new URLSearchParams({ guest_id: s.guest_id });
      if (s.property_id) params.set('property_id', s.property_id);
      fetch(`/api/notifications?${params}`)
        .then(r => r.json())
        .then(data => {
          const notifs = Array.isArray(data.notifications) ? data.notifications : [];
          setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
        })
        .catch(() => {});
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
      tier: s.tier, region: s.region,
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

  return (
    <div className="min-h-screen bg-white flex flex-col pb-36">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-5 pt-[52px] pb-5">
        {/* Top row: logo mark + bell */}
        <div className="flex items-center justify-between mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: 18, width: 'auto', opacity: 0.3 }} />
          <Link href="/notifications" className="relative inline-flex active:scale-90 transition-transform">
            <div className="w-9 h-9 rounded-full bg-mist flex items-center justify-center text-tx-mid">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-ember text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Editorial greeting */}
        <h1 className="font-display text-[40px] font-normal text-ink leading-[1.04] tracking-[-0.5px] mb-3">
          Hello,{' '}
          <em className="italic">{session.first_name}.</em>
        </h1>

        {/* Inline weather + trip status — single line, no box */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[14px] text-tx-mid">
          {weather ? (
            <span className="font-medium">{wmoIcon(weather.code)} {weather.temp}°C · {wmoDesc(weather.code)}</span>
          ) : (
            <span className="font-medium">Crete</span>
          )}
          {tripStatus.type === 'during' && (
            <><span className="text-border">·</span><span>Day {tripStatus.dayNum} of {tripStatus.length}</span></>
          )}
          {tripStatus.type === 'before' && (
            <><span className="text-border">·</span><span>{tripStatus.daysUntil}d to arrival</span></>
          )}
          {tripStatus.type === 'after' && (
            <><span className="text-border">·</span><span>Thanks for visiting!</span></>
          )}
          {weather && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-[12px] text-tx-light">
                <WindArrow degrees={weather.windDir} />
                {windCompass(weather.windDir)} {weather.wind} km/h
              </span>
              {(() => {
                const b = uvBadge(weather.uv)
                return (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: b.bg, color: b.text }}>
                    {b.label}
                  </span>
                )
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────── */}
      <div className="px-5 pb-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-mist border border-border rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.99] active:bg-sand"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="text-[15px] text-tx-light flex-1">What are you looking for?</span>
          <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </button>
      </div>

      {/* ── Scrollable content ──────────────────────────────── */}
      <div className="flex-1">

        <SmartFeed />

        {error && (
          <div className="mx-5 mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            Failed to load content: {error}
          </div>
        )}

        {/* ── Deals banner ────────────────────────────────── */}
        {dealsStatus === 'data' && data.deals.length > 0 && (() => {
          const deal = data.deals[0]
          const img = deal.images?.[0] ?? null
          return (
            <button
              onClick={() => router.push('/deals')}
              className="mx-4 mb-4 w-[calc(100%-32px)] rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform shadow-elevated block"
            >
              <div className="relative h-[172px]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={deal.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-tx-mid to-ink" />
                )}
                <div className="absolute inset-0 scrim" />
                {(deal.savings_pct ?? 0) > 0 && (
                  <div className="absolute top-3 right-3 bg-lime text-ink text-[11px] font-bold px-2.5 py-1 rounded-full">
                    -{deal.savings_pct}%
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[10px] font-bold text-lime/90 uppercase tracking-widest mb-1">⚡ Limited Deal</p>
                  <p className="font-display text-[19px] font-semibold text-white leading-tight">{deal.title}</p>
                  {(deal.original_price || deal.deal_price) && (
                    <div className="flex items-center gap-2 mt-1.5">
                      {deal.original_price && <span className="text-[12px] text-white/50 line-through">€{deal.original_price}</span>}
                      {deal.deal_price && <span className="text-[15px] font-bold text-white">€{deal.deal_price}</span>}
                    </div>
                  )}
                </div>
              </div>
              {deal.valid_until && (
                <div className="bg-lime px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-ink font-semibold">Expires in</span>
                  <span className="text-[11px] font-bold text-ink font-mono"><DealCountdown validUntil={deal.valid_until} /></span>
                </div>
              )}
            </button>
          )
        })()}

        {/* ── Experiences ─────────────────────────────────── */}
        <SectionHeader title="Experiences for You" linkText="See all" href="/activities" />
        {loading ? (
          <div className="flex gap-3 px-5 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[220px] h-[200px] rounded-xl skeleton flex-shrink-0" />
            ))}
          </div>
        ) : data.activities.length > 0 ? (
          <div className="flex gap-3 px-5 overflow-x-auto snap-x snap-mandatory no-scrollbar mb-4">
            {data.activities.map(a => (
              <ActivityMiniCard
                key={a.id}
                title={a.title}
                subtitle={[a.duration, a.meeting_point].filter(Boolean).join(' · ')}
                priceFrom={a.price_from ?? 0}
                category={a.category}
                imageUrl={a.images?.[0] ?? null}
                focalPoint={a.focal_x != null && a.focal_y != null ? { x: a.focal_x, y: a.focal_y } : null}
                heartItem={{ id: a.id, type: 'activity', slug: a.slug, title: a.title, image: a.images?.[0] ?? null, price: a.price_from ? `€${a.price_from}pp` : null }}
                onClick={() => router.push(`/activities/${a.slug}`)}
              />
            ))}
          </div>
        ) : (
          <p className="px-5 mb-4 text-sm text-tx-light">No featured experiences yet.</p>
        )}

        {/* ── Boat Trips banner ───────────────────────────── */}
        <Link
          href="/activities?category=boat_trips"
          className="mx-4 block active:scale-[0.98] transition-transform"
          style={{ marginTop: 20, marginBottom: 16, width: 'calc(100% - 32px)', borderRadius: 22, overflow: 'hidden', position: 'relative', height: 224, boxShadow: '0 12px 40px rgba(0,0,0,0.16)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&q=80" alt="Boat Trips" loading="eager"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px 22px' }}>
            <p style={{ fontSize: 10, color: '#C8F135', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Boat Trips</p>
            <p className="font-display" style={{ fontSize: 24, color: 'white', lineHeight: 1.15, marginBottom: 7 }}>Sail the waters of Crete</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Sunset cruises, day trips and private charters</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#C8F135', color: '#0D0D0D', borderRadius: 9999, padding: '8px 18px', fontSize: 12, fontWeight: 700 }}>
              Explore Boat Trips →
            </span>
          </div>
        </Link>

        {/* ── Culinary banner ─────────────────────────────── */}
        <Link
          href="/activities?category=culinary"
          className="mx-4 block active:scale-[0.98] transition-transform"
          style={{ marginTop: 16, marginBottom: 16, width: 'calc(100% - 32px)', borderRadius: 22, overflow: 'hidden', position: 'relative', height: 224, boxShadow: '0 12px 40px rgba(0,0,0,0.16)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80" alt="Culinary Experiences" loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px 22px' }}>
            <p style={{ fontSize: 10, color: '#C8F135', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Culinary Crete</p>
            <p className="font-display" style={{ fontSize: 24, color: 'white', lineHeight: 1.15, marginBottom: 7 }}>Cooking lessons &amp; food experiences</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Authentic Cretan cuisine with local chefs</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#C8F135', color: '#0D0D0D', borderRadius: 9999, padding: '8px 18px', fontSize: 12, fontWeight: 700 }}>
              Discover →
            </span>
          </div>
        </Link>

        {/* ── What's on Today ─────────────────────────────── */}
        {eventsStatus !== 'empty' && (
          <>
            <SectionHeader title="What's on Today" linkText="See all" href="/events" />
            {eventsStatus === 'loading' ? (
              <div className="mx-5 mb-4 space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton" />
                ))}
              </div>
            ) : (
              <div className="mb-4">
                {data.events.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => router.push(`/events/${ev.slug}`)}
                    className="mx-5 mb-2 flex gap-3 p-3 px-4 bg-mist rounded-xl items-center cursor-pointer active:bg-sand transition-colors"
                  >
                    <span className="text-[18px] flex-shrink-0">{EVENT_ICONS[ev.category ?? 'other'] ?? '📅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink leading-snug truncate">{ev.title}</p>
                      <p className="text-[11px] text-tx-light mt-0.5">
                        {formatEventWhen(ev.start_date)}
                        {ev.location_name ? ` · ${ev.location_name}` : ''}
                        {ev.is_free ? ' · Free' : ''}
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C9890" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Events hero card ────────────────────────────── */}
        <Link
          href="/events"
          className="mx-4 mb-4 block active:opacity-90 transition-opacity"
          style={{ width: 'calc(100% - 32px)', borderRadius: 22, overflow: 'hidden', position: 'relative', height: 172 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800" alt="Events in Chania" loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.78) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 18, left: 20, right: 60 }}>
            <p style={{ fontSize: 10, color: '#C8F135', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 5 }}>Events &amp; Culture</p>
            <p className="font-display" style={{ fontSize: 20, color: 'white', fontWeight: 500, lineHeight: 1.2 }}>See what&apos;s on in Chania</p>
          </div>
          <div style={{ position: 'absolute', bottom: 18, right: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#C8F135', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </Link>

        {/* ── Local Insights ──────────────────────────────── */}
        <SectionHeader title="Local Insights" linkText="Read more" href="/insights" />
        {loading ? (
          <div className="flex gap-3 px-5 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[240px] h-[195px] rounded-xl skeleton flex-shrink-0" />
            ))}
          </div>
        ) : data.articles.length > 0 ? (
          <div className="flex gap-3 px-5 overflow-x-auto snap-x no-scrollbar mb-6">
            {data.articles.map(a => {
              const style = ARTICLE_STYLES[a.category ?? ''] ?? { bg: ARTICLE_STYLES.guide.bg, tagColor: '#5A5A5A' };
              return (
                <ArticleCard
                  key={a.id}
                  title={a.title}
                  excerpt={a.excerpt ?? ''}
                  category={(a.category ?? 'other').replace('_', ' ')}
                  readTime={a.read_time_min ?? 0}
                  bgGradient={style.bg}
                  tagColor={style.tagColor}
                  image={a.cover_image}
                  onClick={() => router.push(`/insights/${a.slug}`)}
                />
              );
            })}
          </div>
        ) : (
          <p className="px-5 mb-5 text-sm text-tx-light">No articles published yet.</p>
        )}

      </div>

      {/* Prefetch hint */}
      <Link href="/activities" prefetch={true} className="hidden" aria-hidden="true" tabIndex={-1} />

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {/* ── Welcome bottom sheet ────────────────────────── */}
      {showWelcome && (
        <div className="fixed inset-0 z-[300] flex items-end" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-t-[32px] w-full shadow-modal px-6 pt-6 pb-10 animate-slide-up relative">
            <button onClick={() => setShowWelcome(false)} className="absolute top-4 right-5 text-2xl text-tx-light leading-none">×</button>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <div className="text-center text-5xl mb-4">🌊</div>
            <h2 className="font-display text-[30px] font-normal text-ink text-center leading-tight mb-2">
              Welcome, {session.first_name}.
            </h2>
            <p className="text-[15px] text-tx-light text-center mb-6">Your Crete experience starts now.</p>
            <div className="rounded-2xl p-4 mb-2 bg-mist">
              {tripStatus.type === 'before' ? (
                <>
                  <p className="text-[14px] text-ink leading-relaxed mb-4">
                    You arrive in <strong>{tripStatus.daysUntil} {tripStatus.daysUntil === 1 ? 'day' : 'days'}</strong>. Smart move to sort the essentials now — airport transfers and car rentals fill up fast in summer.
                  </p>
                  <button onClick={() => { setShowWelcome(false); router.push('/transfers'); }}
                    className="w-full py-4 rounded-xl bg-ink text-white text-[14px] font-semibold mb-2">
                    Book Airport Transfer →
                  </button>
                  <button onClick={() => { setShowWelcome(false); router.push('/move'); }}
                    className="w-full py-4 rounded-xl text-[14px] font-semibold bg-lime text-ink">
                    Rent a Car or Vehicle →
                  </button>
                </>
              ) : (tripStatus.type === 'during' || tripStatus.type === 'after') ? (
                <>
                  <p className="text-[14px] text-ink leading-relaxed mb-4">You&apos;re in Crete. Time to make the most of it.</p>
                  <button onClick={() => { setShowWelcome(false); router.push('/explore'); }}
                    className="w-full py-4 rounded-xl bg-ink text-white text-[14px] font-semibold mb-2">
                    See Today&apos;s Experiences →
                  </button>
                  <button onClick={() => setShowWelcome(false)}
                    className="w-full py-4 rounded-xl text-[14px] font-semibold bg-lime text-ink">
                    View Today&apos;s Highlights →
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[14px] text-ink leading-relaxed mb-4">Your concierge is ready. Start exploring.</p>
                  <button onClick={() => { setShowWelcome(false); router.push('/explore'); }}
                    className="w-full py-4 rounded-xl bg-ink text-white text-[14px] font-semibold">
                    Start Exploring →
                  </button>
                </>
              )}
            </div>
            <button onClick={() => setShowWelcome(false)} className="w-full text-center text-[12px] text-tx-light mt-4">
              Skip for now
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
