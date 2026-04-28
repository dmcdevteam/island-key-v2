'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookButton } from '@/components/ui/components';
import { formatPrice, getSession } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { Activity } from '@/lib/types';

const CATEGORY_GRADIENTS: Record<string, string> = {
  sea:       'linear-gradient(135deg,rgba(26,138,125,0.15),rgba(27,45,79,0.1))',
  land:      'linear-gradient(135deg,rgba(27,45,79,0.15),rgba(26,138,125,0.1))',
  table:     'linear-gradient(135deg,rgba(26,138,125,0.15),rgba(212,133,74,0.1))',
  culture:   'linear-gradient(135deg,rgba(122,107,93,0.15),rgba(196,112,63,0.1))',
  adventure: 'linear-gradient(135deg,rgba(139,111,71,0.15),rgba(107,123,94,0.1))',
  wellness:  'linear-gradient(135deg,rgba(26,138,125,0.15),rgba(232,245,243,0.1))',
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
  onBack: () => void
}

function ImageCarousel({ images, alts, category, categoryIcon, onBack }: CarouselProps) {
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
    <div className="h-[210px] relative flex-shrink-0 overflow-hidden">
      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((url, i) => (
          <div key={url} className="flex-shrink-0 w-full h-full snap-start relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alts[i] || `${category} activity`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-[52px] left-4 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 px-3 h-[34px] text-[12px] font-semibold text-navy z-10 active:scale-90"
      >← Activities</button>

      {/* Category badge */}
      <span className="absolute bottom-10 left-4 text-[10px] font-bold text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded uppercase z-10">
        {categoryIcon} {category}
      </span>

      {/* Dot indicators — only when more than 1 image */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Image ${i + 1}`}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [session, setSession] = useState<import('@/lib/types').GuestSession | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Read session client-side only (localStorage unavailable during SSR)
  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s?.first_name) setGuestName(s.first_name);
    if (s?.check_in) setBookingDate(s.check_in);
  }, []);

  useEffect(() => {
    if (!slug) return;
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
  }, [slug]);

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
      <div className="min-h-screen bg-cream flex flex-col">
        <div className="h-[210px] bg-navy/5 animate-pulse flex-shrink-0" />
        <div className="px-5 pt-4 space-y-3">
          <div className="h-6 bg-navy/5 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-navy/5 rounded animate-pulse w-1/2" />
          <div className="h-24 bg-navy/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── 404 ───
  if (notFound || !activity) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-4">🌊</p>
        <h1 className="font-display text-xl text-navy mb-2">Activity not found</h1>
        <p className="text-sm text-tx-light mb-6">This experience may no longer be available.</p>
        <button onClick={() => router.back()} className="text-sm font-semibold text-teal">← Back to activities</button>
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
    <div className="min-h-screen bg-cream flex flex-col relative">
      {/* Hero — image carousel or gradient fallback */}
      {hasImages ? (
        <ImageCarousel
          images={images}
          alts={alts}
          category={activity.category}
          categoryIcon={categoryIcon}
          onBack={() => window.history.length <= 1 ? router.push('/activities') : router.back()}
        />
      ) : (
        <div className="h-[210px] relative flex items-end p-4 flex-shrink-0" style={{ background: heroBg }}>
          <button
            onClick={() => window.history.length <= 1 ? router.push('/activities') : router.back()}
            className="absolute top-[52px] left-4 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 px-3 h-[34px] text-[12px] font-semibold text-navy z-10 active:scale-90"
          >← Activities</button>
          <span className="text-[10px] font-bold text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded uppercase">
            {categoryIcon} {activity.category}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[100px]">
        <h1 className="font-display text-[21px] font-medium text-navy mb-0.5">{activity.title}</h1>
        <p className="text-xs text-tx-light mb-1">{activity.meeting_point ?? activity.region}</p>

        {activity.external_rating && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-amber-400 text-sm leading-none">
              {'★'.repeat(Math.floor(activity.external_rating))}
              {activity.external_rating % 1 >= 0.5 ? '½' : ''}
            </span>
            <span className="text-[13px] font-bold text-navy">{activity.external_rating.toFixed(1)}</span>
            {activity.external_rating_count && (
              <span className="text-[11px] text-tx-light">· {activity.external_rating_count.toLocaleString()} reviews</span>
            )}
            {activity.external_rating_source && (
              <span className="text-[10px] text-tx-light bg-sand px-1.5 py-0.5 rounded">{activity.external_rating_source}</span>
            )}
          </div>
        )}

        {!activity.external_rating && <div className="mb-3" />}

        <div className="flex flex-wrap gap-3 mb-3">
          {activity.duration && <span className="text-[11px] text-tx-mid">⏱ {activity.duration}</span>}
          {activity.max_group_size && <span className="text-[11px] text-tx-mid">👥 Max {activity.max_group_size}</span>}
          {activity.season && <span className="text-[11px] text-tx-mid">📅 {activity.season}</span>}
          {activity.languages?.length > 0 && <span className="text-[11px] text-tx-mid">🌐 {activity.languages.join(', ')}</span>}
        </div>

        {activity.availability_text && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-teal/10 rounded-lg">
            <span className="text-teal text-[13px]">🕐</span>
            <div>
              <span className="text-[10px] font-bold text-teal uppercase tracking-wide">Availability · </span>
              <span className="text-[13px] font-medium text-navy">{activity.availability_text}</span>
            </div>
          </div>
        )}

        <p className="text-[13px] text-tx-mid leading-relaxed mb-4">{activity.description}</p>

        {activity.includes && activity.includes.length > 0 && (
          <>
            <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">What's included</h3>
            <ul className="mb-4">
              {activity.includes.map(item => (
                <li key={item} className="text-xs text-tx-mid py-1.5 border-b border-border-light flex items-center gap-2">
                  <span className="text-teal font-bold text-[11px]">✓</span>{item}
                </li>
              ))}
            </ul>
          </>
        )}

        {activity.not_included && activity.not_included.length > 0 && (
          <>
            <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">Not included</h3>
            <ul className="mb-4">
              {activity.not_included.map(item => (
                <li key={item} className="text-xs text-tx-mid py-1.5 border-b border-border-light flex items-center gap-2">
                  <span className="text-tx-light font-bold text-[11px]">✗</span>{item}
                </li>
              ))}
            </ul>
          </>
        )}

        {activity.good_to_know && (
          <>
            <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">Good to know</h3>
            <p className="text-[13px] text-tx-mid leading-relaxed mb-4">{activity.good_to_know}</p>
          </>
        )}

        {activity.cancellation_policy && (
          <p className="text-[11px] text-tx-light italic">{activity.cancellation_policy}</p>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pt-2.5 pb-8 bg-white border-t border-border-light flex items-center gap-2.5">
        <div className="flex-shrink-0">
          <p className="text-[10px] text-tx-light">From</p>
          <p className="text-[19px] font-bold text-navy">
            {hasPrice ? <>{formatPrice(unitPrice)}<span className="text-[11px] text-tx-light font-normal">/pp</span></> : '—'}
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
          <div className="w-full bg-white rounded-t-[18px] px-5 pt-5 pb-9 animate-slide-up max-h-[90%] overflow-y-auto">
            <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-lg font-medium text-navy mb-1">Check Availability</h2>
            <p className="text-xs text-tx-light mb-4">We&apos;ll send your request to your Island Key curator via WhatsApp — they&apos;ll confirm within a few hours.</p>

            {/* Activity summary */}
            <div className="flex justify-between items-start py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Experience</span>
              <span className="text-[13px] font-semibold text-navy text-right max-w-[55%]">{activity.title}</span>
            </div>

            {/* Date picker */}
            <div className="flex justify-between items-center py-2.5 border-b border-border-light">
              <span className="text-[13px] text-tx-mid">Date</span>
              <input
                type="date"
                value={bookingDate}
                min={session?.check_in ?? new Date().toISOString().slice(0, 10)}
                max={session?.check_out ?? undefined}
                onChange={e => {
                  let v = e.target.value;
                  const minDate = session?.check_in ?? new Date().toISOString().slice(0, 10);
                  const maxDate = session?.check_out;
                  if (v < minDate) v = minDate;
                  if (maxDate && v > maxDate) v = maxDate;
                  setBookingDate(v);
                }}
                className="text-[13px] font-semibold text-navy bg-transparent outline-none"
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
                className="w-full py-3.5 bg-teal text-white rounded-sm font-semibold text-sm active:scale-[0.98] disabled:opacity-50"
              >
                {enquiryLoading ? 'Sending…' : 'Check Availability'}
              </button>
            </div>

            <p className="text-center text-[10px] text-tx-light mt-3">
              No payment taken now — your curator will confirm availability first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
