'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookButton } from '@/components/ui/components';
import { formatPrice, getSession } from '@/lib/utils';
import DateRangePicker, { toDate, fromDate } from '@/components/ui/date-range-picker';
import { createClient } from '@/lib/supabase';
import { FocalImage } from '@/components/FocalImage';
import type { FocalPoint } from '@/components/FocalImage';
import { getActivitySuitability, type WeatherData } from '@/lib/weather-suitability';
import type { Activity } from '@/lib/types';

const CATEGORY_GRADIENTS: Record<string, string> = {
  sea:       'linear-gradient(160deg,#0D1B2A 0%,#0A2E2A 100%)',
  land:      'linear-gradient(160deg,#1A1A12 0%,#2A2D1A 100%)',
  table:     'linear-gradient(160deg,#1A120A 0%,#2A1E12 100%)',
  culture:   'linear-gradient(160deg,#1A160E 0%,#2A2018 100%)',
  adventure: 'linear-gradient(160deg,#121A0D 0%,#1E2A14 100%)',
  wellness:  'linear-gradient(160deg,#0A1A18 0%,#122A26 100%)',
};
const CATEGORY_ICONS: Record<string, string> = {
  sea: '🌊', land: '⛰️', table: '🍷', culture: '🏛️', adventure: '🧗', wellness: '🧘',
};

const COUNTRY_CODES = [
  { flag: '🇬🇷', code: '+30',  label: 'GR' },
  { flag: '🇬🇧', code: '+44',  label: 'GB' },
  { flag: '🇩🇪', code: '+49',  label: 'DE' },
  { flag: '🇫🇷', code: '+33',  label: 'FR' },
  { flag: '🇵🇱', code: '+48',  label: 'PL' },
  { flag: '🇺🇸', code: '+1',   label: 'US' },
  { flag: '🇮🇹', code: '+39',  label: 'IT' },
  { flag: '🇳🇱', code: '+31',  label: 'NL' },
  { flag: '🇸🇪', code: '+46',  label: 'SE' },
  { flag: '🇳🇴', code: '+47',  label: 'NO' },
  { flag: '🇩🇰', code: '+45',  label: 'DK' },
];

// Spyros's WhatsApp — enquiries go here
const SPYROS_WA = '306974176759';

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Image Carousel ───────────────────────────────────────────────────────────
interface CarouselProps {
  images: string[]
  alts: string[]
  category: string
  categoryIcon: string
  coverFocalPoint?: FocalPoint | null
  onBack: () => void
}

function ImageCarousel({ images, alts, category, categoryIcon, coverFocalPoint, onBack }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(index)
  }

  function scrollTo(index: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' })
  }

  return (
    <div className="h-[320px] relative flex-shrink-0 overflow-hidden">
      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((url, i) => (
          <div key={url} className="flex-shrink-0 w-full h-full snap-start relative">
            <FocalImage
              src={url}
              alt={alts[i] || `${category} activity`}
              focalPoint={i === 0 ? coverFocalPoint : null}
              priority={i === 0}
              className="w-full h-full"
              draggable={false}
            />
            {/* Deep cinematic scrim */}
            <div className="scrim absolute inset-0 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Back button — glass style */}
      <button
        onClick={onBack}
        className="glass-btn absolute top-[52px] left-4 flex items-center gap-1.5 px-3.5 h-[34px] text-[12px] font-semibold text-white z-10 active:scale-90"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      {/* Category badge */}
      <span className="absolute bottom-10 left-4 text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
        {categoryIcon} {category}
      </span>

      {/* Dot indicators — only when more than 1 image */}
      {images.length > 1 && (
        <div className="absolute bottom-3.5 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Image ${i + 1}`}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ActivityDetailPage({ initialActivity }: { initialActivity?: Activity }) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [session, setSession] = useState<import('@/lib/types').GuestSession | null>(null);
  const [activity, setActivity] = useState<Activity | null>(initialActivity ?? null);
  const [loading, setLoading] = useState(!initialActivity);
  const [notFound, setNotFound] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(tomorrow());
  const [pax, setPax] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+30');
  const [localPhone, setLocalPhone] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [mapImgError, setMapImgError] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch('/api/weather/forecast')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setWeather(data) })
      .catch(() => { /* fail silently */ })
  }, []);

  // Read session client-side only (localStorage unavailable during SSR)
  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s?.first_name) setGuestName(s.first_name);
    if (s?.check_in) setBookingDate(s.check_in);
  }, []);

  useEffect(() => {
    if (initialActivity || !slug) return;
    createClient()
      .from('activities')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setActivity(data);
        setLoading(false);
      });
  }, [slug, initialActivity]);

  const unitPrice = activity?.price_from ?? 0;
  const hasPrice = unitPrice > 0;
  const maxPax = activity?.max_group_size ?? 20;

  function validateEmail() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
    setEmailError(!valid);
    return valid;
  }

  // ─── Submit enquiry ───
  async function handleEnquiry() {
    if (!activity) return;
    if (!validateEmail()) return;
    setEnquiryLoading(true);
    setEnquiryError(null);

    let confirmationCode: string | null = null;

    // Build full phone from inputs or session
    const fullPhone = localPhone.trim()
      ? `${countryCode}${localPhone.trim().replace(/^0+/, '').replace(/\s+/g, '')}`
      : session?.whatsapp_number ?? null;

    const resolvedName = guestName.trim() || session?.first_name || 'Guest';

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type:      'activity',
          item_id:        activity.id,
          item_title:     activity.title,
          booking_date:   bookingDate,
          pax,
          days:           1,
          unit_price:     unitPrice,
          total_price:    unitPrice * pax,
          payment_method: 'whatsapp',
          guest_id:       session?.guest_id ?? null,
          property_slug:  session?.property_id ?? null,
          provider_id:    activity.provider_id ?? null,
          guest_notes:    guestNotes.trim() || null,
          guest_name:     resolvedName,
          guest_email:    guestEmail.trim() || null,
          activity_slug:  slug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Enquiry insert error:', data.error);
      } else {
        confirmationCode = data.confirmation_code;
        // Emails are sent server-side inside POST /api/bookings
      }
    } catch (err) {
      console.error('Enquiry insert exception:', err);
    }

    // Send WhatsApp to Spyros
    const name = resolvedName;
    const property = session?.property_name || '—';

    const parts = [
      `🌟 New Enquiry — Island Key`,
      `📍 Activity: ${activity.title}`,
      `📅 Date: ${formatDateLong(bookingDate)}`,
      `👥 People: ${pax}`,
      `👤 Guest: ${name}`,
      `📧 Email: ${guestEmail.trim() || '—'}`,
      fullPhone ? `📱 WhatsApp: ${fullPhone}` : null,
      guestNotes.trim() ? `📝 Notes: ${guestNotes.trim()}` : null,
      `🏠 Property: ${property}`,
      confirmationCode ? `🔖 Ref: ${confirmationCode}` : null,
    ].filter(Boolean);
    const message = parts.join('\n');

    window.open(`https://wa.me/${SPYROS_WA}?text=${encodeURIComponent(message)}`, '_blank');

    const urlParams = new URLSearchParams({
      title: activity.title,
      date: bookingDate,
      pax: String(pax),
      ...(confirmationCode ? { code: confirmationCode } : {}),
    });
    router.push(`/booking/confirmation?${urlParams.toString()}`);
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="h-[320px] skeleton flex-shrink-0" />
        <div className="px-5 pt-5 space-y-3">
          <div className="h-7 skeleton rounded-xl w-3/4" />
          <div className="h-4 skeleton rounded-lg w-1/3" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── 404 ───
  if (notFound || !activity) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-4">🌊</p>
        <h1 className="font-display text-[28px] font-light text-ink mb-2">Activity not found</h1>
        <p className="text-sm text-tx-mid mb-6">This experience may no longer be available.</p>
        <button onClick={() => router.back()} className="text-sm font-semibold text-ink underline underline-offset-4">← Back to activities</button>
      </div>
    );
  }

  const heroBg = CATEGORY_GRADIENTS[activity.category] ?? CATEGORY_GRADIENTS.culture;
  const categoryIcon = CATEGORY_ICONS[activity.category] ?? '🌟';
  // Filter to only browser-safe formats — AVIF, HEIC, etc. won't render reliably on all devices
  const rawImages = activity.images ?? [];
  const rawAlts   = activity.image_alts ?? [];
  const filteredPairs = rawImages
    .map((url, i) => ({ url, alt: rawAlts[i] ?? '' }))
    .filter(({ url }) => /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(url));
  const images = filteredPairs.map(p => p.url);
  const alts   = filteredPairs.map(p => p.alt);
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Hero — image carousel or gradient fallback */}
      {hasImages ? (
        <ImageCarousel
          images={images}
          alts={alts}
          category={activity.category}
          categoryIcon={categoryIcon}
          coverFocalPoint={activity.focal_x != null && activity.focal_y != null ? { x: activity.focal_x, y: activity.focal_y } : null}
          onBack={() => window.history.length <= 1 ? router.push('/activities') : router.back()}
        />
      ) : (
        <div className="h-[320px] relative flex items-end p-5 flex-shrink-0" style={{ background: heroBg }}>
          <button
            onClick={() => window.history.length <= 1 ? router.push('/activities') : router.back()}
            className="glass-btn absolute top-[52px] left-4 flex items-center gap-1.5 px-3.5 h-[34px] text-[12px] font-semibold text-white z-10 active:scale-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <span className="text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase tracking-wide">
            {categoryIcon} {activity.category}
          </span>
        </div>
      )}

      {/* Weather notice bar */}
      {(() => {
        if (!weather || !activity || activity.weather_driven === false) return null
        const s = getActivitySuitability(activity.category, weather, activity.is_boat_activity)
        if (s.status === 'good') return null
        const isRed = s.status === 'affected'
        return (
          <div className={`px-4 py-2.5 text-[12px] font-medium ${isRed ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            {isRed ? '🔴' : '⚠️'} {s.reason} — {isRed ? 'we recommend checking availability' : 'conditions may affect this activity'}
          </div>
        )
      })()}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-[100px]">
        <h1 className="font-display text-[28px] font-light text-ink leading-tight mb-1">{activity.title}</h1>
        <p className="text-[12px] text-tx-light mb-2">{activity.region}</p>

        {activity.external_rating && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-amber-400 text-sm leading-none">
              {'★'.repeat(Math.floor(activity.external_rating))}
              {activity.external_rating % 1 >= 0.5 ? '½' : ''}
            </span>
            <span className="text-[13px] font-bold text-ink">{activity.external_rating.toFixed(1)}</span>
            {activity.external_rating_count && (
              <span className="text-[11px] text-tx-light">· {activity.external_rating_count.toLocaleString()} reviews</span>
            )}
            {activity.external_rating_source && (
              <span className="text-[10px] text-tx-light bg-mist px-1.5 py-0.5 rounded-full">{activity.external_rating_source}</span>
            )}
          </div>
        )}

        {!activity.external_rating && <div className="mb-3" />}

        <div className="flex flex-wrap gap-3 mb-4">
          {activity.duration && <span className="text-[11px] text-tx-mid">⏱ {activity.duration}</span>}
          {activity.max_group_size && <span className="text-[11px] text-tx-mid">👥 Max {activity.max_group_size}</span>}
          {activity.season && <span className="text-[11px] text-tx-mid">📅 {activity.season}</span>}
          {activity.languages?.length > 0 && <span className="text-[11px] text-tx-mid">🌐 {activity.languages.join(', ')}</span>}
        </div>

        {activity.availability_text && (
          <div className="flex items-center gap-2.5 mb-4 px-4 py-3 bg-lime/15 rounded-2xl">
            <span className="text-[15px]">🕐</span>
            <div>
              <span className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">Availability · </span>
              <span className="text-[13px] font-medium text-ink">{activity.availability_text}</span>
            </div>
          </div>
        )}

        <p className="text-[14px] text-tx-mid leading-relaxed mb-5">{activity.description}</p>

        {activity.includes && activity.includes.length > 0 && (
          <>
            <h3 className="text-[11px] font-bold text-ink/40 uppercase tracking-widest mb-2">What&apos;s included</h3>
            <ul className="mb-5">
              {activity.includes.map(item => (
                <li key={item} className="text-[13px] text-tx-mid py-2 border-b border-border flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0D0D0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        {activity.not_included && activity.not_included.length > 0 && (
          <>
            <h3 className="text-[11px] font-bold text-ink/40 uppercase tracking-widest mb-2">Not included</h3>
            <ul className="mb-5">
              {activity.not_included.map(item => (
                <li key={item} className="text-[13px] text-tx-mid py-2 border-b border-border flex items-center gap-2.5">
                  <span className="text-tx-xlight font-bold text-[13px] flex-shrink-0">✗</span>{item}
                </li>
              ))}
            </ul>
          </>
        )}

        {activity.good_to_know && (
          <>
            <h3 className="text-[11px] font-bold text-ink/40 uppercase tracking-widest mb-2">Good to know</h3>
            <p className="text-[13px] text-tx-mid leading-relaxed mb-5">{activity.good_to_know}</p>
          </>
        )}

        {activity.meeting_point && (() => {
          const mp = activity.meeting_point;
          const encoded = encodeURIComponent(mp);
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          const isGeneric = /confirmation|pickup included/i.test(mp);
          const staticMapUrl = apiKey && !isGeneric && !mapImgError
            ? `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=15&size=600x300&scale=2&markers=color:0x1A8A7D|${encoded}&key=${apiKey}`
            : null;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
          return (
            <div style={{ marginTop: 24, marginBottom: 24 }}>
              <h3 className="text-[11px] font-bold text-ink/40 uppercase tracking-widest mb-2">
                Meeting point
              </h3>
              <p style={{ fontSize: 13, color: '#5C5A56', lineHeight: 1.6, marginBottom: 10 }}>{mp}</p>
              {staticMapUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={staticMapUrl}
                  alt="Meeting point map"
                  onError={() => setMapImgError(true)}
                  style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16, display: 'block', marginBottom: 8 }}
                />
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 48, borderRadius: 12, marginTop: 8,
                  background: '#F7F5F1', border: '1px solid #E8E5DE',
                  paddingLeft: 14, paddingRight: 14, textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
                <span style={{ flex: 1, fontSize: 13, color: '#0D0D0D', fontWeight: 600 }}>Open in Google Maps</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          );
        })()}

        {activity.cancellation_policy && (
          <p className="text-[11px] text-tx-light italic">{activity.cancellation_policy}</p>
        )}

        {/* Contextual WhatsApp help */}
        <div className="border-t border-border mt-6 pt-5 pb-2 text-center">
          <p className="text-[13px] text-tx-light mb-2">Can&apos;t find what you need?</p>
          <a
            href="https://wa.me/306974176759?text=Hi%2C%20I%20need%20help%20booking%20an%20experience%20in%20Crete"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.468.668 4.778 1.832 6.762L2 30l7.43-1.8A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#0D0D0D"/>
              <path d="M23.5 19.75c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" fill="white"/>
            </svg>
            Chat with us on WhatsApp
          </a>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="cta-strip absolute bottom-0 left-0 right-0 px-5 pt-3 pb-6 flex items-center gap-3">
        <div className="flex-shrink-0">
          <p className="text-[10px] font-medium text-tx-light uppercase tracking-wide">From</p>
          <p className="text-[22px] font-bold text-ink leading-none">
            {hasPrice ? <>{formatPrice(unitPrice)}<span className="text-[12px] text-tx-light font-normal ml-0.5">/pp</span></> : '—'}
          </p>
        </div>
        <BookButton onClick={() => { setShowModal(true); setEnquiryError(null); }} />
      </div>

      {/* ─── Enquiry Modal ─── */}
      {showModal && (
        <div
          className="absolute inset-0 bg-black/35 z-[150] flex items-end"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full bg-white rounded-t-[24px] px-5 pt-5 pb-9 animate-slide-up max-h-[90%] overflow-y-auto">
            <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-[22px] font-light text-ink mb-1">Check Availability</h2>
            <p className="text-[12px] text-tx-light mb-4">We&apos;ll send your request to your Island Key curator via WhatsApp — they&apos;ll confirm within a few hours.</p>

            {/* Activity summary */}
            <div className="flex justify-between items-start py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Experience</span>
              <span className="text-[13px] font-semibold text-navy text-right max-w-[55%]">{activity.title}</span>
            </div>

            {/* Date picker */}
            <div className="py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid block mb-2">Date</span>
              <DateRangePicker
                singleDate
                startDate={toDate(bookingDate)}
                endDate={null}
                onChange={(s) => setBookingDate(fromDate(s))}
                placeholder="Select date"
                minDate={session?.check_in ? toDate(session.check_in) ?? undefined : undefined}
                maxDate={session?.check_out ? toDate(session.check_out) ?? undefined : undefined}
              />
            </div>

            {/* Pax counter */}
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Number of people</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm active:bg-sand">−</button>
                <span className="text-[13px] font-semibold text-navy w-4 text-center">{pax}</span>
                <button onClick={() => setPax(Math.min(maxPax, pax + 1))} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm active:bg-sand">+</button>
              </div>
            </div>

            {/* Guest name */}
            {!session?.first_name && (
              <div className="flex justify-between items-center py-2.5 border-b border-border-light">
                <span className="text-[13px] text-tx-mid">Your name</span>
                <input
                  type="text"
                  placeholder="First name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="text-[13px] text-right text-navy bg-transparent outline-none placeholder:text-tx-light w-36"
                />
              </div>
            )}

            {/* Email (required) */}
            <div className={`py-2.5 border-b ${emailError ? 'border-red-300' : 'border-border-light'}`}>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-tx-mid">Email</span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={guestEmail}
                  onChange={e => { setGuestEmail(e.target.value); if (emailError) setEmailError(false); }}
                  className="text-[13px] text-right text-navy bg-transparent outline-none placeholder:text-tx-light w-48"
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-red-500 mt-1 text-right">Please enter a valid email address</p>
              )}
            </div>

            {/* WhatsApp number (if not in session) */}
            {!session?.whatsapp_number && (
              <div className="flex justify-between items-center py-2.5 border-b border-border-light gap-2">
                <span className="text-[13px] text-tx-mid flex-shrink-0">WhatsApp</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="text-[12px] font-semibold text-navy bg-sand border border-border-light rounded px-1.5 py-1 outline-none"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="6900000000"
                    value={localPhone}
                    onChange={e => setLocalPhone(e.target.value)}
                    className="text-[13px] text-navy bg-transparent outline-none placeholder:text-tx-light w-28"
                  />
                </div>
              </div>
            )}

            {/* Accommodation */}
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Accommodation</span>
              <span className="text-[13px] font-semibold text-navy">{session?.property_name || '—'}</span>
            </div>

            {/* Optional notes */}
            <div className="py-2.5 border-b border-border-light">
              <p className="text-[13px] text-tx-mid mb-2">Anything else we should know?</p>
              <textarea
                placeholder="Dietary needs, mobility requirements, special occasion…"
                value={guestNotes}
                onChange={e => setGuestNotes(e.target.value)}
                rows={3}
                className="w-full text-[13px] text-navy bg-sand rounded px-3 py-2 outline-none resize-none placeholder:text-tx-light"
              />
            </div>

            {enquiryError && (
              <p className="mt-3 text-[12px] text-red-600 text-center">{enquiryError}</p>
            )}

            {/* Submit */}
            <div className="mt-4">
              <button
                onClick={handleEnquiry}
                disabled={enquiryLoading}
                className="w-full py-3.5 bg-lime text-ink rounded-full font-semibold text-sm active:scale-[0.98] disabled:opacity-50"
              >
                {enquiryLoading ? 'Sending…' : 'Check Availability'}
              </button>
            </div>

            <p className="text-center text-[11px] text-tx-light mt-3">
              No payment taken now — your curator will confirm availability first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
